import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(\+?84|0)[35789]\d{8}$/;

export const sendOtpSchema = z.object({
  purpose: z.enum(["register", "login", "reset_password"]),
  identifier: z
    .string()
    .trim()
    .regex(emailRegex, "Invalid email address format"),
});

export const registerWithOtpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name cannot exceed 80 characters"),
  identifier: z
    .string()
    .trim()
    .regex(emailRegex, "Invalid email address format"),
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
  identifier: z
    .string()
    .trim()
    .regex(emailRegex, "Invalid email address format"),
  password: z.string().min(1, "Password is required"),
});

export const loginWithOtpSchema = z.object({
  identifier: z
    .string()
    .trim()
    .regex(emailRegex, "Invalid email address format"),
  otpCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP code must be 6 digits"),
});

export const googleAuthSchema = z.object({
  idToken: z.string().trim().min(10, "Google ID token is required"),
});

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name cannot exceed 80 characters")
      .optional(),
    phone: z.string().trim().optional(),
    address: z
      .string()
      .trim()
      .max(500, "Shipping address cannot exceed 500 characters")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.phone &&
      data.phone.length > 0 &&
      !phoneRegex.test(data.phone.replace(/[\s.-]/g, ""))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Invalid Vietnamese phone number (e.g. 0912345678)",
      });
    }
  });
