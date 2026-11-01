import axiosClient from "../utils/axiosClient";

export type OtpPurpose = "register" | "login" | "reset_password";
export type UserRole = "customer" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  address?: string;
}

export interface AuthSessionResponse {
  success: boolean;
  accessToken: string;
  user: AuthUser;
}

export interface SendOtpPayload {
  purpose: OtpPurpose;
  identifier: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  cooldownSeconds: number;
  expiresInSeconds: number;
}

export interface RegisterWithOtpPayload {
  name: string;
  identifier: string;
  otpCode: string;
  password: string;
}

export interface LoginWithPasswordPayload {
  identifier: string;
  password: string;
}

export interface LoginWithOtpPayload {
  identifier: string;
  otpCode: string;
}

export async function sendOtp(
  payload: SendOtpPayload,
): Promise<SendOtpResponse> {
  const response = await axiosClient.post<SendOtpResponse>(
    "/auth/otp/send",
    payload,
  );
  return response.data;
}

export async function registerWithOtp(
  payload: RegisterWithOtpPayload,
): Promise<AuthSessionResponse> {
  const response = await axiosClient.post<AuthSessionResponse>(
    "/auth/register",
    payload,
  );
  return response.data;
}

export async function loginWithPassword(
  payload: LoginWithPasswordPayload,
): Promise<AuthSessionResponse> {
  const response = await axiosClient.post<AuthSessionResponse>(
    "/auth/login/password",
    payload,
  );
  return response.data;
}

export async function loginWithOtp(
  payload: LoginWithOtpPayload,
): Promise<AuthSessionResponse> {
  const response = await axiosClient.post<AuthSessionResponse>(
    "/auth/login/otp",
    payload,
  );
  return response.data;
}

export async function loginWithGoogle(
  idToken: string,
): Promise<AuthSessionResponse> {
  const response = await axiosClient.post<AuthSessionResponse>("/auth/google", {
    idToken,
  });
  return response.data;
}

export async function refreshSession(): Promise<AuthSessionResponse> {
  const response =
    await axiosClient.post<AuthSessionResponse>("/auth/refresh");
  return response.data;
}

export async function getCurrentUser(): Promise<{
  success: boolean;
  user: AuthUser;
}> {
  const response = await axiosClient.get<{ success: boolean; user: AuthUser }>(
    "/auth/me",
  );
  return response.data;
}

export async function logoutSession(): Promise<void> {
  await axiosClient.post("/auth/logout");
}

export async function logoutAllSessions(): Promise<void> {
  await axiosClient.post("/auth/logout-all");
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<{
  success: boolean;
  message: string;
  user: AuthUser;
}> {
  const response = await axiosClient.put<{
    success: boolean;
    message: string;
    user: AuthUser;
  }>("/auth/profile", payload);
  return response.data;
}

export const authService = {
  sendOtp,
  registerWithOtp,
  loginWithPassword,
  loginWithOtp,
  loginWithGoogle,
  refreshSession,
  getCurrentUser,
  logoutSession,
  logoutAllSessions,
  updateProfile,
};

