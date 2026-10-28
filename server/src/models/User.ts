import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "customer" | "admin";

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  googleId?: string;
  avatar?: string;
  passwordHash?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;

