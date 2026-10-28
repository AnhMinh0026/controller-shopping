import {
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

interface OtpCodeInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
  length?: number;
}

export default function OtpCodeInput({
  value,
  onChange,
  disabled = false,
  length = 6,
}: OtpCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, idx) => value[idx] || "");

  const focusBox = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  };

  const setDigitAt = (index: number, char: string) => {
    const next = [...digits];
    next[index] = char;
    onChange(next.join(""));
  };

  const handleInputChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      setDigitAt(index, "");
      return;
    }

    const lastDigit = clean.slice(-1);
    setDigitAt(index, lastDigit);

    if (index < length - 1) {
      focusBox(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      if (digits[index]) {
        setDigitAt(index, "");
      } else if (index > 0) {
        setDigitAt(index - 1, "");
        focusBox(index - 1);
      }
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      focusBox(index - 1);
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      focusBox(index + 1);
      event.preventDefault();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pastedDigits) return;

    onChange(pastedDigits);
    focusBox(Math.min(pastedDigits.length, length - 1));
  };

  return (
    <div
      role="group"
      aria-label="6-digit verification code"
      className="flex items-center justify-between gap-2 sm:gap-3"
    >
      {digits.map((digit, index) => (
        <input
          key={`otp-box-${index}`}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digit}
          aria-label={`Digit ${index + 1}`}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="h-12 w-full rounded-xl border border-white/15 bg-black/70 text-center text-lg font-extrabold text-white transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:text-xl"
        />
      ))}
    </div>
  );
}

