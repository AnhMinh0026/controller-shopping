import https from "https";
import OtpVerification, { type OtpPurpose } from "../models/OtpVerification";
import { decryptOtpForBot, normalizePhone } from "../utils/crypto";

const PURPOSE_LABELS: Record<OtpPurpose, string> = {
  register: "Đăng ký tài khoản",
  login: "Đăng nhập tài khoản",
  reset_password: "Đặt lại mật khẩu",
};

interface ZaloBotProfile {
  id: string;
  account_name?: string;
  display_name?: string;
  account_type?: string;
  can_join_groups?: boolean;
}

interface ZaloMessagePayload {
  chat?: {
    id: string;
    chat_type?: string;
  };
  text?: string;
  message_id?: string;
  from?: {
    id?: string;
    display_name?: string;
  };
}

interface ZaloUpdateEvent {
  event_name?: string;
  message?: ZaloMessagePayload;
}

// Stores connected Zalo chat_ids in memory so OTPs can be pushed automatically
// as soon as the user requests an OTP on the website.
const activeZaloChatIds = new Set<string>();
// Optional mapping from normalized E.164 phone ("+84912345678") -> Zalo chat_id
const phoneToChatIdMap = new Map<string, string>();

let cachedBotId: string | null = null;
let cachedBotName: string | null = null;
let cachedBotUsername: string | null = null;
let isPolling = false;

function getZaloBotToken(): string | undefined {
  return process.env.ZALO_BOT_TOKEN?.trim() || undefined;
}

export function getZaloBotName(): string | null {
  return process.env.ZALO_BOT_NAME?.trim() || cachedBotName || cachedBotUsername;
}

export function getZaloBotUsername(): string | null {
  return process.env.ZALO_BOT_USERNAME?.trim() || cachedBotUsername;
}

export function getZaloBotLink(): string | null {
  const customUrl = process.env.ZALO_BOT_URL?.trim();
  if (customUrl) return customUrl;
  if (cachedBotId) return `https://zalo.me/${cachedBotId}`;
  if (cachedBotUsername) return `https://zalo.me/${cachedBotUsername}`;
  return null;
}

export function isZaloBotConfigured(): boolean {
  return Boolean(getZaloBotToken());
}

/**
 * Formats the OTP message sent inside Zalo chat.
 */
function formatZaloOtpMessage(
  identifier: string,
  otpCode: string,
  purpose: OtpPurpose,
): string {
  const purposeText = PURPOSE_LABELS[purpose];
  return [
    "🔐 FLYDIGI SECURITY - MÃ XÁC THỰC OTP",
    "────────────────────",
    `📌 Yêu cầu: ${purposeText}`,
    `📱 Số điện thoại: ${identifier}`,
    "",
    `👉 Mã OTP của bạn là: ${otpCode}`,
    "",
    "⏳ Mã có hiệu lực trong 5 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.",
  ].join("\n");
}

/**
 * Starts the background Zalo Bot listener using long-polling (`getUpdates`)
 * against `https://bot-api.zapps.me/bot<TOKEN>/...`.
 * Works directly on localhost without needing webhook/ngrok.
 */
export async function initZaloOtpBot(): Promise<void> {
  const token = getZaloBotToken();
  if (!token || isPolling) return;

  const envChatId = process.env.ZALO_CHAT_ID?.trim();
  if (envChatId) {
    activeZaloChatIds.add(envChatId);
  }

  try {
    const me = await callZaloBotApi<ZaloBotProfile>(token, "getMe", {});
    if (me?.id) {
      cachedBotId = me.id;
    }
    if (me?.account_name) {
      cachedBotUsername = me.account_name;
    }
    if (me?.display_name) {
      cachedBotName = me.display_name;
    } else if (me?.account_name) {
      cachedBotName = me.account_name;
    }
    console.log(
      `[Zalo OTP Bot] Connected to Zalo Bot "${cachedBotName || "Flydigi"}" (${cachedBotUsername || me?.id || "ready"})`,
    );
    isPolling = true;
    void pollZaloUpdatesLoop();
  } catch (error) {
    console.error(
      "[Zalo OTP Bot] Failed to initialize Zalo Bot:",
      error instanceof Error ? error.message : error,
    );
  }
}

async function pollZaloUpdatesLoop(): Promise<void> {
  while (isPolling) {
    const token = getZaloBotToken();
    if (!token) {
      isPolling = false;
      break;
    }

    try {
      const result = await callZaloBotApi<ZaloUpdateEvent | ZaloUpdateEvent[]>(
        token,
        "getUpdates",
        { timeout: "30" },
      );

      if (Array.isArray(result)) {
        for (const item of result) {
          await handleIncomingZaloEvent(token, item);
        }
      } else if (result && typeof result === "object") {
        await handleIncomingZaloEvent(token, result);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      // HTTP 408 / timeout is normal when no new messages arrive within the long-polling window
      if (!msg.includes("408") && !msg.toLowerCase().includes("timeout")) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
}

async function handleIncomingZaloEvent(
  token: string,
  event: ZaloUpdateEvent,
): Promise<void> {
  const chatId = event.message?.chat?.id;
  const rawText = event.message?.text?.trim();
  if (!chatId) return;

  // Remember this chat_id so future web OTP requests push straight to Zalo automatically
  activeZaloChatIds.add(chatId);

  const text = rawText || "";
  const digitsOnly = text.replace(/\D/g, "");

  // If the user sent a phone number (e.g. "0912345678" or "+84912345678"), link it to their Zalo chatId
  let matchedPhoneE164: string | null = null;
  if (digitsOnly.length >= 9 && digitsOnly.length <= 12) {
    matchedPhoneE164 = normalizePhone(text);
    phoneToChatIdMap.set(matchedPhoneE164, chatId);
  }

  // Look for an active, non-expired Phone OTP in MongoDB
  const now = new Date();
  const pendingRecord = matchedPhoneE164
    ? await OtpVerification.findOne({
        channel: "phone",
        identifier: matchedPhoneE164,
        expiresAt: { $gt: now },
      }).sort({ updatedAt: -1 })
    : await OtpVerification.findOne({
        channel: "phone",
        expiresAt: { $gt: now },
      }).sort({ updatedAt: -1 });

  if (pendingRecord && pendingRecord.encryptedOtp) {
    const otpCode = decryptOtpForBot(pendingRecord.encryptedOtp);
    if (otpCode) {
      phoneToChatIdMap.set(pendingRecord.identifier, chatId);
      await sendZaloMessage(
        token,
        chatId,
        formatZaloOtpMessage(
          pendingRecord.identifier,
          otpCode,
          pendingRecord.purpose,
        ),
      );
      return;
    }
  }

  // Otherwise greet the user and confirm their Zalo is linked for automatic OTP delivery
  await sendZaloMessage(
    token,
    chatId,
    [
      "👋 Chào mừng bạn đến với Flydigi Việt Nam (Zalo OTP Bot)!",
      "",
      "✅ Tài khoản Zalo của bạn đã được kết nối thành công.",
      "👉 Bây giờ khi bạn bấm 'Gửi mã OTP' trên website Flydigi, mã OTP 6 số sẽ tự động được gửi thẳng vào khung chat Zalo này!",
      "",
      "💡 Mẹo: Bạn cũng có thể nhắn số điện thoại của mình (VD: 0912345678) hoặc nhắn 'otp' vào đây bất cứ lúc nào để lấy mã xác thực mới nhất.",
    ].join("\n"),
  );
}

/**
 * Automatically pushes the OTP to connected Zalo chat(s) as soon as the user
 * clicks "Send OTP" on the website.
 * Returns `true` if at least one Zalo chat received the push immediately.
 */
export async function pushOtpViaZaloBot(
  phoneE164: string,
  otpCode: string,
  purpose: OtpPurpose,
): Promise<boolean> {
  const token = getZaloBotToken();
  if (!token) return false;

  const message = formatZaloOtpMessage(phoneE164, otpCode, purpose);

  // 1. If this specific phone number is already mapped to a Zalo chatId, send directly to it
  const mappedChatId = phoneToChatIdMap.get(phoneE164);
  if (mappedChatId) {
    try {
      await sendZaloMessage(token, mappedChatId, message);
      return true;
    } catch {
      // Fall through to broadcast to active chatIds
    }
  }

  // 2. Otherwise push to all active Zalo chatIds that have interacted with the bot
  if (activeZaloChatIds.size === 0) {
    return false;
  }

  let delivered = false;
  for (const chatId of activeZaloChatIds) {
    try {
      await sendZaloMessage(token, chatId, message);
      delivered = true;
    } catch (error) {
      console.error(
        `[Zalo OTP Bot] Failed to push OTP to chat_id ${chatId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return delivered;
}

export async function sendZaloMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<void> {
  await callZaloBotApi(token, "sendMessage", {
    chat_id: chatId,
    text,
  });
}

function callZaloBotApi<T>(
  token: string,
  method: string,
  payload: Record<string, unknown>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      `https://bot-api.zapps.me/bot${token}/${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 35000,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 408) {
            reject(new Error("Zalo polling timeout (408)"));
            return;
          }
          try {
            const parsed = JSON.parse(raw) as {
              ok?: boolean;
              result?: T;
              description?: string;
              error_code?: number;
            };
            if (parsed.ok) {
              resolve(parsed.result as T);
            } else {
              reject(
                new Error(
                  parsed.description ||
                    `Zalo Bot API error (${parsed.error_code ?? res.statusCode ?? "unknown"})`,
                ),
              );
            }
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("Request timeout"));
    });
    req.write(body);
    req.end();
  });
}

