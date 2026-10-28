import axios from "axios";
import { create } from "zustand";
import {
  authService,
  type AuthUser,
  type LoginWithOtpPayload,
  type LoginWithPasswordPayload,
  type RegisterWithOtpPayload,
  type SendOtpPayload,
  type SendOtpResponse,
} from "../services/auth.service";
import { bindAuthTokenListeners, setAccessToken } from "../utils/tokenManager";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isSubmitting: boolean;
  error: string | null;

  initializeAuth: () => Promise<void>;
  sendOtp: (payload: SendOtpPayload) => Promise<SendOtpResponse>;
  register: (payload: RegisterWithOtpPayload) => Promise<AuthUser>;
  loginWithPassword: (payload: LoginWithPasswordPayload) => Promise<AuthUser>;
  loginWithOtp: (payload: LoginWithOtpPayload) => Promise<AuthUser>;
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  clearError: () => void;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

let hasInitializedOnce = false;

export const useAuthStore = create<AuthState>((set) => {
  // Keep Zustand state in sync when axiosClient silently rotates or clears tokens
  bindAuthTokenListeners({
    onTokenChange: (token) => {
      set((state) => ({
        accessToken: token,
        isAuthenticated: Boolean(token && state.user),
      }));
    },
    onClearSession: () => {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
    },
  });

  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isInitializing: true,
    isSubmitting: false,
    error: null,

    initializeAuth: async () => {
      if (hasInitializedOnce) return;
      hasInitializedOnce = true;

      set({ isInitializing: true });
      try {
        const session = await authService.refreshSession();
        setAccessToken(session.accessToken);
        set({
          user: session.user,
          accessToken: session.accessToken,
          isAuthenticated: true,
          isInitializing: false,
          error: null,
        });
      } catch {
        setAccessToken(null);
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isInitializing: false,
        });
      }
    },

    sendOtp: async (payload) => {
      set({ isSubmitting: true, error: null });
      try {
        const result = await authService.sendOtp(payload);
        set({ isSubmitting: false });
        return result;
      } catch (error: unknown) {
        const message = extractErrorMessage(error, "Failed to send OTP code.");
        set({ isSubmitting: false, error: message });
        throw new Error(message);
      }
    },

    register: async (payload) => {
      set({ isSubmitting: true, error: null });
      try {
        const session = await authService.registerWithOtp(payload);
        setAccessToken(session.accessToken);
        set({
          user: session.user,
          accessToken: session.accessToken,
          isAuthenticated: true,
          isSubmitting: false,
          error: null,
        });
        return session.user;
      } catch (error: unknown) {
        const message = extractErrorMessage(error, "Registration failed.");
        set({ isSubmitting: false, error: message });
        throw new Error(message);
      }
    },

    loginWithPassword: async (payload) => {
      set({ isSubmitting: true, error: null });
      try {
        const session = await authService.loginWithPassword(payload);
        setAccessToken(session.accessToken);
        set({
          user: session.user,
          accessToken: session.accessToken,
          isAuthenticated: true,
          isSubmitting: false,
          error: null,
        });
        return session.user;
      } catch (error: unknown) {
        const message = extractErrorMessage(error, "Sign-in failed.");
        set({ isSubmitting: false, error: message });
        throw new Error(message);
      }
    },

    loginWithOtp: async (payload) => {
      set({ isSubmitting: true, error: null });
      try {
        const session = await authService.loginWithOtp(payload);
        setAccessToken(session.accessToken);
        set({
          user: session.user,
          accessToken: session.accessToken,
          isAuthenticated: true,
          isSubmitting: false,
          error: null,
        });
        return session.user;
      } catch (error: unknown) {
        const message = extractErrorMessage(error, "OTP sign-in failed.");
        set({ isSubmitting: false, error: message });
        throw new Error(message);
      }
    },

    loginWithGoogle: async (idToken) => {
      set({ isSubmitting: true, error: null });
      try {
        const session = await authService.loginWithGoogle(idToken);
        setAccessToken(session.accessToken);
        set({
          user: session.user,
          accessToken: session.accessToken,
          isAuthenticated: true,
          isSubmitting: false,
          error: null,
        });
        return session.user;
      } catch (error: unknown) {
        const message = extractErrorMessage(
          error,
          "Google authentication failed.",
        );
        set({ isSubmitting: false, error: message });
        throw new Error(message);
      }
    },

    logout: async () => {
      try {
        await authService.logoutSession();
      } finally {
        setAccessToken(null);
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
        });
      }
    },

    logoutAll: async () => {
      try {
        await authService.logoutAllSessions();
      } finally {
        setAccessToken(null);
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
        });
      }
    },

    clearError: () => set({ error: null }),
  };
});

