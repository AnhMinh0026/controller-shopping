import { Link } from "react-router-dom";
import GoogleAuthButton from "../../components/common/GoogleAuthButton";
import Header from "../../components/layout/Header/Header";
import SignUpForm from "./components/SignUpForm";
import { useSignUpForm } from "./hooks/useSignUpForm";

export default function SignUpPage() {
  const {
    name,
    setName,
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
    isSubmitting,
    error,
    handleRequestOtp,
    handleSubmit,
    handleGoogleCredential,
  } = useSignUpForm();

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
              Sign up with Email verification or continue with Google.
            </p>
          </div>

          {/* Alerts */}
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

          {/* Registration Form Component */}
          <SignUpForm
            name={name}
            setName={setName}
            identifier={identifier}
            setIdentifier={setIdentifier}
            password={password}
            setPassword={setPassword}
            otpCode={otpCode}
            setOtpCode={setOtpCode}
            otpSent={otpSent}
            setOtpSent={setOtpSent}
            cooldown={cooldown}
            onRequestOtp={handleRequestOtp}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />

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
              Sign In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
