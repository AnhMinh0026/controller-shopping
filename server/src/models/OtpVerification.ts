import mongoose, { Document, Schema } from "mongoose";

export type OtpChannel = "email";
export type OtpPurpose = "register" | "login" | "reset_password";

export interface IOtpVerification extends Document {
  identifier: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  otpHash: string;
  attempts: number;
  maxAttempts: number;
  resendAvailableAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpVerificationSchema = new Schema<IOtpVerification>(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ["email"],
      default: "email",
      required: true,
    },
    purpose: {
      type: String,
      enum: ["register", "login", "reset_password"],
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    resendAvailableAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index: auto-deletes expired OTP records
    },
  },
  {
    timestamps: true,
  },
);

otpVerificationSchema.index({ identifier: 1, purpose: 1 }, { unique: true });

const OtpVerification = mongoose.model<IOtpVerification>(
  "OtpVerification",
  otpVerificationSchema,
);
export default OtpVerification;
