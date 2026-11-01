import type { FormEvent } from "react";
import OtpCodeInput from "../../../components/common/OtpCodeInput";

interface OtpLoginFormProps {
  identifier: string;
  setIdentifier: (value: string) => void;
  otpCode: string;
  setOtpCode: (value: string) => void;
  otpSent: boolean;
  setOtpSent: (sent: boolean) => void;
  cooldown: number;
  onRequestOtp: () => Promise<void>;
  onSubmit: (event: FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export default function OtpLoginForm({
  identifier,
  setIdentifier,
  otpCode,
  setOtpCode,
  otpSent,
  setOtpSent,
  cooldown,
  onRequestOtp,
  onSubmit,
  isSubmitting,
}: OtpLoginFormProps) {
  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
      {/* Input Email */}
      <div>
        <label
          htmlFor="otp-login-identifier"
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-300"
        >
          Email Address
        </label>
        <input
          id="otp-login-identifier"
          type="email"
          required
          disabled={otpSent}
          placeholder="you@example.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* Step 2: Verification Code Input */}
      {otpSent && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">
              6-Digit Email Verification Code
            </span>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtpCode("");
              }}
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              Change Email
            </button>
          </div>

          <OtpCodeInput
            value={otpCode}
            onChange={setOtpCode}
            disabled={isSubmitting}
          />

          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              disabled={cooldown > 0 || isSubmitting}
              onClick={() => void onRequestOtp()}
              className="font-semibold text-brand transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
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
          ? "Signing in..."
          : otpSent
            ? "Verify & Sign In"
            : "Send Email OTP"}
      </button>
    </form>
  );
}
