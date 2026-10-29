import { Link } from "react-router-dom";
import GoogleAuthButton from "../../components/common/GoogleAuthButton";
import Header from "../../components/layout/Header/Header";
import OtpLoginForm from "./components/OtpLoginForm";
import PasswordLoginForm from "./components/PasswordLoginForm";
import { useLoginForm } from "./hooks/useLoginForm";

export default function LoginPage() {
  const {
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
  } = useLoginForm();

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 pb-16 pt-28 sm:px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b0f] p-6 shadow-2xl sm:p-8">
          {/* Heading */}
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand">
              FLYDIGI ACCOUNT
            </p>
            <h1 className="mt-2 text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
              WELCOME BACK
            </h1>
            <p className="mt-2 text-xs text-gray-400">
              Sign in with password, one-time OTP code, or Google account.
            </p>
          </div>

          {/* Mode Switcher: Password vs OTP */}
          <div className="mt-6 grid grid-cols-2 rounded-full border border-white/10 bg-black p-1">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setInfoMessage(null);
              }}
              className={`rounded-full py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                mode === "password"
                  ? "bg-brand text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("otp");
                setInfoMessage(null);
              }}
              className={`rounded-full py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                mode === "otp"
                  ? "bg-brand text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              OTP Code
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

          {/* Forms */}
          {mode === "password" ? (
            <PasswordLoginForm
              identifier={identifier}
              setIdentifier={setIdentifier}
              password={password}
              setPassword={setPassword}
              onSubmit={handlePasswordSubmit}
              isSubmitting={isSubmitting}
            />
          ) : (
            <OtpLoginForm
              otpChannel={otpChannel}
              setOtpChannel={setOtpChannel}
              identifier={identifier}
              setIdentifier={setIdentifier}
              otpCode={otpCode}
              setOtpCode={setOtpCode}
              otpSent={otpSent}
              setOtpSent={setOtpSent}
              cooldown={cooldown}
              zaloBotName={zaloBotName}
              zaloBotUsername={zaloBotUsername}
              zaloBotLink={zaloBotLink}
              pushedToZalo={pushedToZalo}
              onRequestOtp={handleRequestOtp}
              onSubmit={handleOtpSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              OR
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google Sign-In */}
          <GoogleAuthButton
            onCredential={handleGoogleCredential}
            disabled={isSubmitting}
          />

          {/* Footer Link */}
          <p className="mt-6 text-center text-xs text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-bold uppercase tracking-wider text-brand hover:underline"
            >
              Sign Up Now
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
