import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { OtpChannel } from "../../../services/auth.service";
import { useAuthStore } from "../../../store/useAuthStore";

export type LoginMode = "password" | "otp";

export function useLoginForm() {
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const loginWithPassword = useAuthStore((state) => state.loginWithPassword);
  const loginWithOtp = useAuthStore((state) => state.loginWithOtp);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const clearError = useAuthStore((state) => state.clearError);

  const [mode, setMode] = useState<LoginMode>("password");
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Zalo Bot Delivery Info
  const [zaloBotName, setZaloBotName] = useState<string | null>(null);
  const [zaloBotUsername, setZaloBotUsername] = useState<string | null>(null);
  const [zaloBotLink, setZaloBotLink] = useState<string | null>(null);
  const [pushedToZalo, setPushedToZalo] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError, mode, otpChannel]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setInfoMessage(null);
    try {
      await loginWithPassword({ identifier, password });
      navigate("/", { replace: true });
    } catch {
      // Error is caught and stored in useAuthStore
    }
  };

  const handleRequestOtp = async () => {
    setInfoMessage(null);
    try {
      const response = await sendOtp({
        channel: otpChannel,
        purpose: "login",
        identifier,
      });
      setOtpSent(true);
      setOtpCode("");
      setCooldown(response.cooldownSeconds || 60);
      setInfoMessage(response.message);
      setZaloBotName(response.zaloBotName || null);
      setZaloBotUsername(response.zaloBotUsername || null);
      setZaloBotLink(response.zaloBotLink || null);
      setPushedToZalo(Boolean(response.pushedToZalo));
    } catch {
      // Error is caught and stored in useAuthStore
    }
  };

  const handleOtpSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!otpSent) {
      await handleRequestOtp();
      return;
    }

    setInfoMessage(null);
    try {
      await loginWithOtp({
        channel: otpChannel,
        identifier,
        otpCode,
      });
      navigate("/", { replace: true });
    } catch {
      // Error is caught and stored in useAuthStore
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setInfoMessage(null);
    try {
      await loginWithGoogle(idToken);
      navigate("/", { replace: true });
    } catch {
      // Error is caught and stored in useAuthStore
    }
  };

  return {
    mode,
    setMode,
    otpChannel,
    setOtpChannel,
    identifier,
    setIdentifier,
    password,
    setPassword,
    otpCode,
    setOtpCode,
    otpSent,
    setOtpSent,
    cooldown,
    infoMessage,
    setInfoMessage,
    zaloBotName,
    zaloBotUsername,
    zaloBotLink,
    pushedToZalo,
    isSubmitting,
    error,
    handlePasswordSubmit,
    handleRequestOtp,
    handleOtpSubmit,
    handleGoogleCredential,
  };
}

