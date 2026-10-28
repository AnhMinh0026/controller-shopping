import express from "express";
import {
  getCurrentUser,
  loginWithGoogle,
  loginWithOtp,
  loginWithPassword,
  logout,
  logoutAllDevices,
  refreshAccessToken,
  registerWithOtp,
  sendOtp,
} from "../controllers/authController";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  authAttemptLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
} from "../middlewares/rateLimiter.middleware";

const router = express.Router();

// OTP endpoints
router.post("/otp/send", otpSendLimiter, sendOtp);

// Registration & Login endpoints
router.post("/register", otpVerifyLimiter, registerWithOtp);
router.post("/login/password", authAttemptLimiter, loginWithPassword);
router.post("/login/otp", otpVerifyLimiter, loginWithOtp);
router.post("/google", authAttemptLimiter, loginWithGoogle);

// Token lifecycle & Session management
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);
router.post("/logout-all", requireAuth, logoutAllDevices);
router.get("/me", requireAuth, getCurrentUser);

export default router;

