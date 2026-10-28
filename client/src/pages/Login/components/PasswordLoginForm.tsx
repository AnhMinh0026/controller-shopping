import type { FormEvent } from "react";

interface PasswordLoginFormProps {
  identifier: string;
  setIdentifier: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onSubmit: (event: FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export default function PasswordLoginForm({
  identifier,
  setIdentifier,
  password,
  setPassword,
  onSubmit,
  isSubmitting,
}: PasswordLoginFormProps) {
  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="login-identifier"
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-300"
        >
          Email hoặc Số Điện Thoại
        </label>
        <input
          id="login-identifier"
          type="text"
          required
          autoComplete="username"
          placeholder="you@example.com hoặc 0912345678"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-300"
        >
          Mật khẩu
        </label>
        <input
          id="login-password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Nhập mật khẩu của bạn"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full border border-brand bg-brand py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-transparent hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Đang xử lý..." : "Đăng Nhập"}
      </button>
    </form>
  );
}

