import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(\+?84|0)[35789]\d{8}$/;

export const sendOtpSchema = z
  .object({
    channel: z.enum(["email", "phone"]),
    purpose: z.enum(["register", "login", "reset_password"]),
    identifier: z.string().trim().min(3, "Identifier is required"),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "email" && !emailRegex.test(data.identifier)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identifier"],
        message: "Invalid email address format",
      });
    }
    if (
      data.channel === "phone" &&
      !phoneRegex.test(data.identifier.replace(/[\s.-]/g, ""))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identifier"],
        message: "Invalid Vietnamese phone number (e.g. 0912345678)",
      });
    }
  });

export const registerWithOtpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name cannot exceed 80 characters"),
  channel: z.enum(["email", "phone"]),
  identifier: z.string().trim().min(3, "Email or phone is required"),
  otpCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP code must be 6 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

export const loginWithPasswordSchema = z.object({
  identifier: z.string().trim().min(3, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export const loginWithOtpSchema = z.object({
  channel: z.enum(["email", "phone"]),
  identifier: z.string().trim().min(3, "Email or phone number is required"),
  otpCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP code must be 6 digits"),
});

export const googleAuthSchema = z.object({
  idToken: z.string().trim().min(10, "Google ID token is required"),
});

