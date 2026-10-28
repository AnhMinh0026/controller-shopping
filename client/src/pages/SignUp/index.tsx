import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../../components/common/GoogleAuthButton";
import OtpCodeInput from "../../components/common/OtpCodeInput";
import ZaloOtpHelper from "../../components/common/ZaloOtpHelper";
import Header from "../../components/layout/Header/Header";
import type { OtpChannel } from "../../services/auth.service";
import { useAuthStore } from "../../store/useAuthStore";

export default function SignUpPage() {
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const register = useAuthStore((state) => state.register);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const clearError = useAuthStore((state) => state.clearError);

  const [channel, setChannel] = useState<OtpChannel>("email");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [zaloBotName, setZaloBotName] = useState<string | null>(null);
  const [zaloBotUsername, setZaloBotUsername] = useState<string | null>(null);
  const [zaloBotLink, setZaloBotLink] = useState<string | null>(null);
  const [pushedToZalo, setPushedToZalo] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError, channel]);

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

  const handleRequestOtp = async () => {
    setInfoMessage(null);
    try {
      const response = await sendOtp({
        channel,
        purpose: "register",
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
      // Error state is managed by useAuthStore
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!otpSent) {
      await handleRequestOtp();
      return;
    }

    setInfoMessage(null);
    try {
      await register({
        name,
        channel,
        identifier,
        password,
        otpCode,
      });
      navigate("/", { replace: true });
    } catch {
      // Error state is managed by useAuthStore
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setInfoMessage(null);
    try {
      await loginWithGoogle(idToken);
      navigate("/", { replace: true });
    } catch {
      // Error state is managed by useAuthStore
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 pb-16 pt-28 sm:px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b0f] p-6 shadow-2xl sm:p-8">
          {/* Heading */}
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand">
              JOIN FLYDIGI
            </p>
            <h1 className="mt-2 text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
              CREATE ACCOUNT
            </h1>
            <p className="mt-2 text-xs text-gray-400">
              Register with Email or Phone OTP verification, or continue with
              Google.
            </p>
          </div>

          {/* Channel Selector */}
          <div className="mt-6 grid grid-cols-2 rounded-full border border-white/10 bg-black p-1">
            <button
              type="button"
              onClick={() => {
                setChannel("email");
                setOtpSent(false);
                setOtpCode("");
                setInfoMessage(null);
              }}
              className={`rounded-full py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                channel === "email"
                  ? "bg-brand text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setChannel("phone");
                setOtpSent(false);
                setOtpCode("");
                setInfoMessage(null);
              }}
              className={`rounded-full py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                channel === "phone"
                  ? "bg-brand text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Phone Number
            </button>
          </div>

          {/* Error & Info Alerts */}
          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200"
            >
              {error}
            </div>
          )}

          {infoMessage && !error && (
            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
              {infoMessage}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="signup-name"
                className="block text-[11px] font-bold uppercase tracking-widest text-gray-300"
              >
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                minLength={2}
                disabled={otpSent}
                placeholder="Nguyen Van A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="signup-identifier"
                className="block text-[11px] font-bold uppercase tracking-widest text-gray-300"
              >
                {channel === "email" ? "Email Address" : "Phone Number"}
              </label>
              <input
                id="signup-identifier"
                type={channel === "email" ? "email" : "tel"}
                required
                disabled={otpSent}
                placeholder={
                  channel === "email" ? "you@example.com" : "0912345678"
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-[11px] font-bold uppercase tracking-widest text-gray-300"
              >
                Password (min. 8 characters)
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                disabled={otpSent}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand focus:outline-none disabled:opacity-60"
              />
            </div>

            {/* Step 2: OTP Verification Input */}
            {otpSent && (
              <div className="pt-2">
                {channel === "phone" && (
                  <ZaloOtpHelper
                    botName={zaloBotName}
                    botUsername={zaloBotUsername}
                    botLink={zaloBotLink}
                    pushedToZalo={pushedToZalo}
                  />
                )}

                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">
                    Enter 6-Digit OTP
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="text-[11px] font-semibold text-brand hover:underline"
                  >
                    Edit Info
                  </button>
                </div>

                <OtpCodeInput
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={isSubmitting}
                />

                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>Didn&apos;t receive the code?</span>
                  <button
                    type="button"
                    disabled={cooldown > 0 || isSubmitting}
                    onClick={() => void handleRequestOtp()}
                    className="font-semibold text-brand transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (otpSent && otpCode.trim().length < 6)}
              className="w-full rounded-full border border-brand bg-brand py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-transparent hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Processing..."
                : otpSent
                  ? "Verify OTP & Create Account"
                  : "Send Verification Code"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              OR
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google OAuth */}
          <GoogleAuthButton
            onCredential={handleGoogleCredential}
            disabled={isSubmitting}
          />

          {/* Footer Link */}
          <p className="mt-6 text-center text-xs text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold uppercase tracking-wider text-brand hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

