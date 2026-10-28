import crypto from "crypto";
import type { OtpPurpose } from "../models/OtpVerification";

const getOtpSecret = (): string =>
  process.env.OTP_SECRET ||
  process.env.JWT_ACCESS_SECRET ||
  "flydigi-enterprise-otp-secret-key-2026";

const getAesKey = (): Buffer =>
  crypto.createHash("sha256").update(getOtpSecret()).digest();

/**
 * Generates a cryptographically secure 6-digit numeric OTP code.
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Generates a short random token for the Bot deep link (?start=otp_<token>).
 */
export function generateBotDeepLinkToken(): string {
  return crypto.randomBytes(12).toString("hex");
}

/**
 * Encrypts the 6-digit OTP using AES-256-GCM so the Bot can deliver it when the
 * user opens the deep link, without ever storing plaintext OTPs in MongoDB.
 */
export function encryptOtpForBot(otpCode: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getAesKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(otpCode, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts an AES-256-GCM encrypted OTP for Bot delivery.
 */
export function decryptOtpForBot(payload: string): string | null {
  try {
    const [ivHex, tagHex, dataHex] = payload.split(":");
    if (!ivHex || !tagHex || !dataHex) return null;

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getAesKey(),
      Buffer.from(ivHex, "hex"),
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Computes an HMAC-SHA256 digest of the OTP bound to the identifier + purpose
 * so an OTP generated for one user or purpose can never be replayed elsewhere.
 */
export function hashOtp(
  identifier: string,
  purpose: OtpPurpose,
  otpCode: string,
): string {
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${identifier}:${purpose}:${otpCode}`)
    .digest("hex");
}

/**
 * Constant-time comparison of an OTP candidate against a stored HMAC hash
 * to prevent timing side-channel attacks.
 */
export function verifyOtpHash(
  storedHash: string,
  identifier: string,
  purpose: OtpPurpose,
  candidateOtp: string,
): boolean {
  const candidateHash = hashOtp(identifier, purpose, candidateOtp);
  const storedBuf = Buffer.from(storedHash, "hex");
  const candidateBuf = Buffer.from(candidateHash, "hex");

  if (storedBuf.length !== candidateBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(storedBuf, candidateBuf);
}

/**
 * Generates a high-entropy opaque refresh token and its SHA-256 hash.
 */
export function generateRefreshTokenPair(): {
  rawToken: string;
  tokenHash: string;
} {
  const rawToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Generates a unique token family identifier for Refresh Token Rotation & Reuse Detection.
 */
export function generateTokenFamilyId(): string {
  return crypto.randomUUID();
}

/**
 * Hashes an opaque token (such as a Refresh Token) using SHA-256 before DB storage.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Normalizes Vietnamese and international phone numbers to E.164 format (+84...).
 */
export function normalizePhone(rawPhone: string): string {
  const digitsAndPlus = rawPhone.trim().replace(/[\s.-]/g, "");
  if (digitsAndPlus.startsWith("+84")) {
    return `+84${digitsAndPlus.slice(3).replace(/^0+/, "")}`;
  }
  if (digitsAndPlus.startsWith("84") && digitsAndPlus.length >= 10) {
    return `+84${digitsAndPlus.slice(2).replace(/^0+/, "")}`;
  }
  if (digitsAndPlus.startsWith("0")) {
    return `+84${digitsAndPlus.slice(1)}`;
  }
  return digitsAndPlus;
}

/**
 * Normalizes an email address to lowercase trimmed format.
 */
export function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}
