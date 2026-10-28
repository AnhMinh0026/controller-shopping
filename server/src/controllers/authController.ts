import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import OtpVerification, {
  type OtpChannel,
  type OtpPurpose,
} from "../models/OtpVerification";
import RefreshToken from "../models/RefreshToken";
import User, { type IUser } from "../models/User";
import { sendEmailOtp, sendPhoneOtp } from "../services/notification.service";
import {
  encryptOtpForBot,
  generateBotDeepLinkToken,
  generateRefreshTokenPair,
  generateSecureOtp,
  generateTokenFamilyId,
  hashOtp,
  hashToken,
  normalizeEmail,
  normalizePhone,
  verifyOtpHash,
} from "../utils/crypto";
import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
  setRefreshTokenCookie,
  signAccessToken,
} from "../utils/jwt";
import {
  googleAuthSchema,
  loginWithOtpSchema,
  loginWithPasswordSchema,
  registerWithOtpSchema,
  sendOtpSchema,
} from "../validators/auth.validator";

const BCRYPT_ROUNDS = 12;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_OTP_ATTEMPTS = 5;
const MAX_PASSWORD_FAILURES = 5;
const ACCOUNT_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function sanitizeUser(user: IUser) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
  };
}

function normalizeIdentifier(channel: OtpChannel, raw: string): string {
  return channel === "email" ? normalizeEmail(raw) : normalizePhone(raw);
}

async function issueSessionTokens(
  user: IUser,
  req: Request,
  res: Response,
  existingFamilyId?: string,
) {
  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role,
  });

  const { rawToken, tokenHash } = generateRefreshTokenPair();
  const familyId = existingFamilyId || generateTokenFamilyId();

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    familyId,
    userAgent: req.headers["user-agent"] || "unknown",
    ipAddress: req.ip || "unknown",
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  setRefreshTokenCookie(res, rawToken);

  return {
    accessToken,
    tokenHash,
    user: sanitizeUser(user),
  };
}

/**
 * Verifies an OTP against the stored HMAC-SHA256 hash and deletes it immediately upon success.
 * Enforces max attempts (brute-force protection).
 */
async function verifyAndConsumeOtp(
  identifier: string,
  purpose: OtpPurpose,
  candidateOtp: string,
): Promise<{ valid: true } | { valid: false; status: number; message: string }> {
  const record = await OtpVerification.findOne({ identifier, purpose });

  if (!record || record.expiresAt.getTime() < Date.now()) {
    if (record) await record.deleteOne();
    return {
      valid: false,
      status: 400,
      message: "OTP has expired or was not requested. Please request a new code.",
    };
  }

  if (record.attempts >= record.maxAttempts) {
    await record.deleteOne();
    return {
      valid: false,
      status: 429,
      message:
        "Maximum verification attempts exceeded. Please request a new OTP.",
    };
  }

  const isMatch = verifyOtpHash(
    record.otpHash,
    identifier,
    purpose,
    candidateOtp,
  );

  if (!isMatch) {
    record.attempts += 1;
    const remaining = record.maxAttempts - record.attempts;

    if (remaining <= 0) {
      await record.deleteOne();
      return {
        valid: false,
        status: 429,
        message:
          "Too many incorrect attempts. This OTP has been invalidated.",
      };
    }

    await record.save();
    return {
      valid: false,
      status: 400,
      message: `Invalid OTP code (${remaining} attempt${remaining === 1 ? "" : "s"} remaining).`,
    };
  }

  // One-time use: destroy OTP immediately after successful verification
  await record.deleteOne();
  return { valid: true };
}

// [POST] /api/auth/otp/send
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = sendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid input",
      });
      return;
    }

    const { channel, purpose } = parsed.data;
    const identifier = normalizeIdentifier(channel, parsed.data.identifier);

    // Check existing user according to purpose
    const query =
      channel === "email" ? { email: identifier } : { phone: identifier };
    const existingUser = await User.findOne(query);

    if (purpose === "register" && existingUser) {
      res.status(409).json({
        success: false,
        message:
          channel === "email"
            ? "An account with this email already exists."
            : "An account with this phone number already exists.",
      });
      return;
    }

    if (purpose === "login" && !existingUser) {
      res.status(404).json({
        success: false,
        message: "No account found with this identifier.",
      });
      return;
    }

    // Enforce 60s resend cooldown per identifier + purpose
    const existingOtp = await OtpVerification.findOne({ identifier, purpose });
    if (
      existingOtp &&
      existingOtp.resendAvailableAt.getTime() > Date.now()
    ) {
      const retryAfterSeconds = Math.ceil(
        (existingOtp.resendAvailableAt.getTime() - Date.now()) / 1000,
      );
      res.status(429).json({
        success: false,
        retryAfterSeconds,
        message: `Please wait ${retryAfterSeconds}s before requesting another OTP.`,
      });
      return;
    }

    const otpCode = generateSecureOtp();
    const otpHash = hashOtp(identifier, purpose, otpCode);
    const botToken =
      channel === "phone" ? generateBotDeepLinkToken() : undefined;
    const encryptedOtp =
      channel === "phone" ? encryptOtpForBot(otpCode) : undefined;
    const now = Date.now();

    await OtpVerification.findOneAndUpdate(
      { identifier, purpose },
      {
        identifier,
        channel,
        purpose,
        otpHash,
        ...(botToken ? { botToken } : {}),
        ...(encryptedOtp ? { encryptedOtp } : {}),
        attempts: 0,
        maxAttempts: MAX_OTP_ATTEMPTS,
        resendAvailableAt: new Date(now + OTP_RESEND_COOLDOWN_MS),
        expiresAt: new Date(now + OTP_TTL_MS),
      },
      { upsert: true, returnDocument: "after" },
    );

    let responseMessage = "Verification code has been sent to your email.";
    let zaloBotName: string | null | undefined;
    let zaloBotUsername: string | null | undefined;
    let zaloBotLink: string | null | undefined;
    let pushedToZalo = false;

    if (channel === "email") {
      await sendEmailOtp(identifier, otpCode, purpose);
    } else {
      const phoneResult = await sendPhoneOtp(identifier, otpCode, purpose);
      zaloBotName = phoneResult.zaloBotName;
      zaloBotUsername = phoneResult.zaloBotUsername;
      zaloBotLink = phoneResult.zaloBotLink;
      pushedToZalo = Boolean(phoneResult.pushedToZalo);

      if (phoneResult.provider === "zalo_bot") {
        responseMessage = pushedToZalo
          ? "Mã OTP 6 số đã được gửi trực tiếp vào tin nhắn Zalo của bạn!"
          : "Mã OTP đã sẵn sàng! Hãy quét mã QR hoặc bấm nút Mở Zalo bên dưới và nhắn 'otp' để nhận mã.";
      } else {
        responseMessage = "Verification code has been sent to your phone.";
      }
    }

    res.status(200).json({
      success: true,
      message: responseMessage,
      cooldownSeconds: OTP_RESEND_COOLDOWN_MS / 1000,
      expiresInSeconds: OTP_TTL_MS / 1000,
      ...(zaloBotName ? { zaloBotName } : {}),
      ...(zaloBotUsername ? { zaloBotUsername } : {}),
      ...(zaloBotLink ? { zaloBotLink } : {}),
      ...(channel === "phone" ? { pushedToZalo } : {}),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send OTP";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/auth/register
export const registerWithOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = registerWithOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid registration data",
      });
      return;
    }

    const { name, channel, otpCode, password } = parsed.data;
    const identifier = normalizeIdentifier(channel, parsed.data.identifier);

    // 1. Verify OTP first
    const otpResult = await verifyAndConsumeOtp(
      identifier,
      "register",
      otpCode,
    );
    if (!otpResult.valid) {
      res
        .status(otpResult.status)
        .json({ success: false, message: otpResult.message });
      return;
    }

    // 2. Ensure account was not created concurrently
    const query =
      channel === "email" ? { email: identifier } : { phone: identifier };
    const existingUser = await User.findOne(query);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Account already exists.",
      });
      return;
    }

    // 3. Hash password and create user
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({
      name,
      ...(channel === "email"
        ? { email: identifier, isEmailVerified: true }
        : { phone: identifier, isPhoneVerified: true }),
      passwordHash,
      lastLoginAt: new Date(),
    });

    const session = await issueSessionTokens(user, req, res);

    res.status(201).json({
      success: true,
      accessToken: session.accessToken,
      user: session.user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/auth/login/password
export const loginWithPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = loginWithPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid credentials",
      });
      return;
    }

    const rawIdentifier = parsed.data.identifier;
    const isEmail = rawIdentifier.includes("@");
    const identifier = isEmail
      ? normalizeEmail(rawIdentifier)
      : normalizePhone(rawIdentifier);

    const user = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier },
    ).select("+passwordHash");

    if (!user || !user.passwordHash) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
      return;
    }

    // Check temporary brute-force lockout
    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const waitMinutes = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / 60000,
      );
      res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed attempts. Try again in ${waitMinutes} minute(s).`,
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      parsed.data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_PASSWORD_FAILURES) {
        user.lockUntil = new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS);
        user.failedLoginAttempts = 0;
      }
      await user.save();

      res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
      return;
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    const session = await issueSessionTokens(user, req, res);

    res.status(200).json({
      success: true,
      accessToken: session.accessToken,
      user: session.user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/auth/login/otp
export const loginWithOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = loginWithOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid input",
      });
      return;
    }

    const { channel, otpCode } = parsed.data;
    const identifier = normalizeIdentifier(channel, parsed.data.identifier);

    const otpResult = await verifyAndConsumeOtp(identifier, "login", otpCode);
    if (!otpResult.valid) {
      res
        .status(otpResult.status)
        .json({ success: false, message: otpResult.message });
      return;
    }

    const user = await User.findOne(
      channel === "email" ? { email: identifier } : { phone: identifier },
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Account not found.",
      });
      return;
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    if (channel === "email") user.isEmailVerified = true;
    if (channel === "phone") user.isPhoneVerified = true;
    await user.save();

    const session = await issueSessionTokens(user, req, res);

    res.status(200).json({
      success: true,
      accessToken: session.accessToken,
      user: session.user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OTP login failed";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/auth/google
export const loginWithGoogle = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = googleAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid Google token",
      });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      res.status(500).json({
        success: false,
        message: "GOOGLE_CLIENT_ID is not configured on the server.",
      });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      res.status(401).json({
        success: false,
        message: "Unable to verify Google account profile.",
      });
      return;
    }

    const email = normalizeEmail(payload.email);
    const googleId = payload.sub;

    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (!user) {
      user = await User.create({
        name: payload.name || email.split("@")[0] || "Flydigi User",
        email,
        googleId,
        ...(payload.picture ? { avatar: payload.picture } : {}),
        isEmailVerified: Boolean(payload.email_verified),
        lastLoginAt: new Date(),
      });
    } else {
      user.googleId = googleId;
      user.isEmailVerified = true;
      if (!user.avatar && payload.picture) {
        user.avatar = payload.picture;
      }
      user.lastLoginAt = new Date();
      await user.save();
    }

    const session = await issueSessionTokens(user, req, res);

    res.status(200).json({
      success: true,
      accessToken: session.accessToken,
      user: session.user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google authentication failed";
    res.status(401).json({ success: false, message });
  }
};

// [POST] /api/auth/refresh
// Implements Dual-Token Rotation + Stolen Token Reuse Detection
export const refreshAccessToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as
      | string
      | undefined;

    if (!rawRefreshToken) {
      res.status(401).json({
        success: false,
        code: "REFRESH_TOKEN_MISSING",
        message: "Refresh token cookie not found",
      });
      return;
    }

    const incomingHash = hashToken(rawRefreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash: incomingHash });

    if (!storedToken) {
      clearRefreshTokenCookie(res);
      res.status(401).json({
        success: false,
        code: "REFRESH_TOKEN_INVALID",
        message: "Invalid refresh token",
      });
      return;
    }

    // REUSE DETECTION: If this token was already rotated/revoked, an attacker or replay is detected!
    // Immediately revoke the entire token family across all sessions in this chain.
    if (storedToken.revokedAt) {
      await RefreshToken.updateMany(
        { familyId: storedToken.familyId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
      clearRefreshTokenCookie(res);
      res.status(401).json({
        success: false,
        code: "TOKEN_REUSE_DETECTED",
        message:
          "Security alert: Refresh token reuse detected. Session invalidated.",
      });
      return;
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      storedToken.revokedAt = new Date();
      await storedToken.save();
      clearRefreshTokenCookie(res);
      res.status(401).json({
        success: false,
        code: "REFRESH_TOKEN_EXPIRED",
        message: "Refresh token has expired",
      });
      return;
    }

    const user = await User.findById(storedToken.userId);
    if (!user) {
      clearRefreshTokenCookie(res);
      res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
      return;
    }

    // Rotate Refresh Token within the same familyId
    const session = await issueSessionTokens(
      user,
      req,
      res,
      storedToken.familyId,
    );

    storedToken.revokedAt = new Date();
    storedToken.replacedByTokenHash = session.tokenHash;
    await storedToken.save();

    res.status(200).json({
      success: true,
      accessToken: session.accessToken,
      user: session.user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to refresh token";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as
      | string
      | undefined;

    if (rawRefreshToken) {
      const incomingHash = hashToken(rawRefreshToken);
      await RefreshToken.findOneAndUpdate(
        { tokenHash: incomingHash, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    }

    clearRefreshTokenCookie(res);
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logout failed";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/auth/logout-all
export const logoutAllDevices = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.user?.userId) {
      await RefreshToken.updateMany(
        { userId: req.user.userId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    }

    clearRefreshTokenCookie(res);
    res.status(200).json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logout failed";
    res.status(500).json({ success: false, message });
  }
};

// [GET] /api/auth/me
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load user profile";
    res.status(500).json({ success: false, message });
  }
};
