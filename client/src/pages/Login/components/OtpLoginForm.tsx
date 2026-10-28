import type { FormEvent } from "react";
import OtpCodeInput from "../../../components/common/OtpCodeInput";
import ZaloOtpHelper from "../../../components/common/ZaloOtpHelper";
import type { OtpChannel } from "../../../services/auth.service";

interface OtpLoginFormProps {
  otpChannel: OtpChannel;
  setOtpChannel: (channel: OtpChannel) => void;
  identifier: string;
  setIdentifier: (value: string) => void;
  otpCode: string;
  setOtpCode: (value: string) => void;
  otpSent: boolean;
  setOtpSent: (sent: boolean) => void;
  cooldown: number;
  zaloBotName: string | null;
  zaloBotUsername: string | null;
  zaloBotLink: string | null;
  pushedToZalo: boolean;
  onRequestOtp: () => Promise<void>;
  onSubmit: (event: FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export default function OtpLoginForm({
  otpChannel,
  setOtpChannel,
  identifier,
  setIdentifier,
  otpCode,
  setOtpCode,
  otpSent,
  setOtpSent,
  cooldown,
  zaloBotName,
  zaloBotUsername,
  zaloBotLink,
  pushedToZalo,
  onRequestOtp,
  onSubmit,
  isSubmitting,
}: OtpLoginFormProps) {
  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
      {/* Channel Selector: Email vs Phone */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setOtpChannel("email");
            setOtpSent(false);
            setOtpCode("");
          }}
          className={`flex-1 rounded-xl border py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
            otpChannel === "email"
              ? "border-brand bg-brand/15 text-white"
              : "border-white/10 text-gray-400 hover:text-white"
          }`}
        >
          Email OTP
        </button>
        <button
          type="button"
          onClick={() => {
            setOtpChannel("phone");
            setOtpSent(false);
            setOtpCode("");
          }}
          className={`flex-1 rounded-xl border py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
            otpChannel === "phone"
              ? "border-brand bg-brand/15 text-white"
              : "border-white/10 text-gray-400 hover:text-white"
          }`}
        >
          Phone OTP (Zalo)
        </button>
      </div>

      {/* Input Identifier */}
      <div>
        <label
          htmlFor="otp-login-identifier"
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-300"
        >
          {otpChannel === "email" ? "Địa chỉ Email" : "Số Điện Thoại"}
        </label>
        <input
          id="otp-login-identifier"
          type={otpChannel === "email" ? "email" : "tel"}
          required
          disabled={otpSent}
          placeholder={
            otpChannel === "email" ? "you@example.com" : "0912345678"
          }
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* Step 2: Verification Code Input & Zalo Helper */}
      {otpSent && (
        <div>
          {otpChannel === "phone" && (
            <ZaloOtpHelper
              botName={zaloBotName}
              botUsername={zaloBotUsername}
              botLink={zaloBotLink}
              pushedToZalo={pushedToZalo}
            />
          )}

          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">
              Mã xác thực 6 số
            </span>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtpCode("");
              }}
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              Đổi {otpChannel === "email" ? "Email" : "Số điện thoại"}
            </button>
          </div>

          <OtpCodeInput
            value={otpCode}
            onChange={setOtpCode}
            disabled={isSubmitting}
          />

          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>Chưa nhận được mã?</span>
            <button
              type="button"
              disabled={cooldown > 0 || isSubmitting}
              onClick={() => void onRequestOtp()}
              className="font-semibold text-brand transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"}
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
          ? "Đang xử lý..."
          : otpSent
            ? "Xác Thực & Đăng Nhập"
            : "Gửi Mã OTP"}
      </button>
    </form>
  );
}

