import type { FormEvent } from "react";
import OtpCodeInput from "../../../components/common/OtpCodeInput";
import ZaloOtpHelper from "../../../components/common/ZaloOtpHelper";
import type { OtpChannel } from "../../../services/auth.service";

interface SignUpFormProps {
  channel: OtpChannel;
  name: string;
  setName: (value: string) => void;
  identifier: string;
  setIdentifier: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
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

export default function SignUpForm({
  channel,
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
  zaloBotName,
  zaloBotUsername,
  zaloBotLink,
  pushedToZalo,
  onRequestOtp,
  onSubmit,
  isSubmitting,
}: SignUpFormProps) {
  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
      {/* Full Name */}
      <div>
        <label
          htmlFor="signup-name"
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-300"
        >
          Họ và Tên
        </label>
        <input
          id="signup-name"
          type="text"
          required
          minLength={2}
          disabled={otpSent}
          placeholder="Nguyễn Văn A"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* Identifier: Email or Phone */}
      <div>
        <label
          htmlFor="signup-identifier"
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-300"
        >
          {channel === "email" ? "Địa chỉ Email" : "Số Điện Thoại"}
        </label>
        <input
          id="signup-identifier"
          type={channel === "email" ? "email" : "tel"}
          required
          disabled={otpSent}
          placeholder={channel === "email" ? "you@example.com" : "0912345678"}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="signup-password"
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-300"
        >
          Mật khẩu (tối thiểu 8 ký tự)
        </label>
        <input
          id="signup-password"
          type="password"
          required
          minLength={8}
          disabled={otpSent}
          autoComplete="new-password"
          placeholder="Tạo mật khẩu bảo mật"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* Step 2: OTP Verification Input & Zalo Helper */}
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
              Nhập mã OTP 6 số
            </span>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtpCode("");
              }}
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              Sửa thông tin
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
              {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại OTP"}
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
            ? "Xác Thực OTP & Đăng Ký"
            : "Gửi Mã Xác Thực"}
      </button>
    </form>
  );
}

