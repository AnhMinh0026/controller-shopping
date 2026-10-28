import { useState } from "react";

interface ZaloOtpHelperProps {
  botName?: string | null;
  botUsername?: string | null;
  botLink?: string | null;
  pushedToZalo?: boolean;
}

export default function ZaloOtpHelper({
  botName,
  botUsername,
  botLink,
  pushedToZalo = false,
}: ZaloOtpHelperProps) {
  const [copied, setCopied] = useState(false);

  const displayBotName = botName || "Bot AI OTP";
  const displayBotUsername = botUsername || "bot.HpPktEvB";
  const targetUrl = botLink || `https://zalo.me/${displayBotUsername}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(targetUrl)}`;

  const handleCopyUsername = async () => {
    try {
      await navigator.clipboard.writeText(displayBotUsername);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <div className="mb-5 rounded-2xl border border-brand/40 bg-[#0f1322]/90 p-4 text-xs text-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-black text-white">
            Z
          </span>
          <div>
            <p className="font-bold uppercase tracking-wider text-white">
              Nhận mã OTP qua Zalo Bot
            </p>
            <p className="text-[11px] text-gray-400">
              {displayBotName}{" "}
              <span className="font-mono text-brand">
                ({displayBotUsername})
              </span>
            </p>
          </div>
        </div>

        {pushedToZalo && (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            Đã gửi tự động
          </span>
        )}
      </div>

      {/* Status notice if already auto-pushed */}
      {pushedToZalo && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
          ✅ Mã OTP 6 số đã được gửi thẳng vào khung chat Zalo của bạn!
        </div>
      )}

      {/* Body: Instructions + QR Code */}
      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* QR Code Box */}
        <div className="flex shrink-0 flex-col items-center rounded-xl border border-white/15 bg-white p-2 shadow-md">
          <img
            src={qrImageUrl}
            alt={`Mã QR Zalo Bot ${displayBotName}`}
            width={112}
            height={112}
            className="h-28 w-28 rounded-lg object-contain"
          />
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-800">
            Quét QR bằng Zalo
          </span>
        </div>

        {/* Step-by-step instructions */}
        <div className="flex-1 space-y-2 text-[11.5px] leading-relaxed text-gray-300">
          <p className="font-semibold text-white">
            Cách lấy mã xác thực 6 số:
          </p>
          <ol className="list-inside list-decimal space-y-1.5 text-gray-300">
            <li>
              Quét <strong>mã QR</strong> bên cạnh bằng ứng dụng Zalo hoặc bấm
              nút <strong>Mở đoạn chat với Bot</strong> bên dưới.
            </li>
            <li>
              Nhắn chữ{" "}
              <code className="rounded bg-brand/25 px-1.5 py-0.5 font-mono font-bold text-white">
                otp
              </code>{" "}
              (hoặc số điện thoại của bạn) vào khung chat.
            </li>
            <li>
              Bot sẽ trả về ngay <strong>mã OTP 6 số</strong> để bạn nhập vào ô
              bên dưới.
            </li>
          </ol>

          {/* Copy Bot Username helper */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-gray-400">Mã tìm kiếm Bot:</span>
            <button
              type="button"
              onClick={() => void handleCopyUsername()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 font-mono text-[11px] text-white transition-colors hover:border-brand hover:text-brand"
              title="Bấm để sao chép mã Bot"
            >
              <span>{displayBotUsername}</span>
              <span className="text-[10px] text-gray-400">
                {copied ? "✓ Đã chép" : "Sao chép"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Direct Action Button to Open Zalo Chat */}
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand bg-brand px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-transparent hover:text-brand hover:shadow-[0_0_20px_rgb(var(--color-brand)/0.4)]"
      >
        <span>💬 Mở đoạn chat với Zalo Bot</span>
      </a>
    </div>
  );
}

