import rateLimit from "express-rate-limit";

/**
 * Limits OTP send requests per IP to prevent SMS/Zalo pumping and email spam.
 */
export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many OTP requests from this IP. Please wait 15 minutes and try again.",
  },
});

/**
 * Limits OTP verification attempts per IP to mitigate brute-force guessing.
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many OTP verification attempts. Please wait 15 minutes and try again.",
  },
});

/**
 * Limits login & registration requests per IP.
 */
export const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many authentication attempts from this IP. Please try again later.",
  },
});

