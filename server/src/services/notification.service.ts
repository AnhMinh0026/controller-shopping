import https from "https";
import nodemailer from "nodemailer";
import type { OtpPurpose } from "../models/OtpVerification";
import {
  getZaloBotLink,
  getZaloBotName,
  getZaloBotUsername,
  isZaloBotConfigured,
  pushOtpViaZaloBot,
} from "./zaloBot.service";

const PURPOSE_LABELS: Record<OtpPurpose, string> = {
  register: "Account Registration",
  login: "Sign-In Verification",
  reset_password: "Password Reset",
};

/**
 * Sends a real HTML OTP email via SMTP (Gmail App Password / Resend / Brevo)
 * or prints a structured fallback box in the console when SMTP env vars are absent.
 */
export async function sendEmailOtp(
  email: string,
  otpCode: string,
  purpose: OtpPurpose,
): Promise<void> {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  const subject = `[Flydigi] ${otpCode} is your ${PURPOSE_LABELS[purpose]} code`;

  if (smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"Flydigi Security" <${smtpUser}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; background:#08080c; color:#ffffff; padding:32px; border-radius:16px; max-width:480px; margin:0 auto; border:1px solid rgba(40,90,250,0.4);">
          <p style="color:#285afa; font-size:12px; font-weight:bold; letter-spacing:3px; text-transform:uppercase; margin:0 0 8px;">FLYDIGI SECURITY</p>
          <h2 style="margin:0 0 16px; font-size:22px; color:#ffffff;">${PURPOSE_LABELS[purpose]}</h2>
          <p style="color:#b0b6c3; font-size:14px; line-height:1.6;">Use the 6-digit verification code below to continue. This code expires in <strong>5 minutes</strong>.</p>
          <div style="margin:24px 0; padding:18px; background:#11131f; border:1px solid #285afa; border-radius:12px; text-align:center; font-size:32px; font-weight:bold; letter-spacing:10px; color:#ffffff;">
            ${otpCode}
          </div>
          <p style="color:#6b7280; font-size:12px; margin:0;">If you did not request this code, please ignore this email.</p>
        </div>
      `,
    });
    return;
  }

  // Dev fallback when SMTP_USER / SMTP_PASS are not configured yet
  console.log(
    [
      "",
      "╔══════════════════════════════════════════════════════════╗",
      "║                [DEV EMAIL OTP DISPATCHED]                ║",
      `║  To      : ${email.padEnd(45, " ")}║`,
      `║  Purpose : ${PURPOSE_LABELS[purpose].padEnd(45, " ")}║`,
      `║  OTP Code: ${otpCode.padEnd(45, " ")}║`,
      "║  Expires : 5 minutes                                     ║",
      "╚══════════════════════════════════════════════════════════╝",
      "",
    ].join("\n"),
  );
}

/**
 * Sends an OTP to a phone number via:
 *  1) Zalo Bot Platform (`ZALO_BOT_TOKEN` via `bot-api.zapps.me`) — free & friendly for Vietnamese users
 *  2) Zalo ZNS OpenAPI (if ZALO_ACCESS_TOKEN & ZALO_OTP_TEMPLATE_ID are set)
 *  3) Twilio SMS REST API (if TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN & TWILIO_FROM_NUMBER are set)
 *  4) Dev Console Fallback
 */
export async function sendPhoneOtp(
  phoneE164: string,
  otpCode: string,
  purpose: OtpPurpose,
): Promise<{
  provider: "zalo_bot" | "zalo_zns" | "twilio_sms" | "dev_console";
  pushedToZalo?: boolean;
  zaloBotName?: string | null;
  zaloBotUsername?: string | null;
  zaloBotLink?: string | null;
}> {
  // 1. Try Zalo Bot Platform (Free Zalo Bot API)
  if (isZaloBotConfigured()) {
    const pushedToZalo = await pushOtpViaZaloBot(phoneE164, otpCode, purpose);
    return {
      provider: "zalo_bot",
      pushedToZalo,
      zaloBotName: getZaloBotName(),
      zaloBotUsername: getZaloBotUsername(),
      zaloBotLink: getZaloBotLink(),
    };
  }

  const zaloToken = process.env.ZALO_ACCESS_TOKEN?.trim();
  const zaloTemplateId = process.env.ZALO_OTP_TEMPLATE_ID?.trim();

  // 2. Try Zalo ZNS Official API if configured
  if (zaloToken && zaloTemplateId) {
    const zaloPhone = phoneE164.replace(/^\+/, ""); // Zalo expects "84..." without '+'
    await postJson(
      "https://business.openapi.zalo.me/message/template",
      {
        phone: zaloPhone,
        template_id: zaloTemplateId,
        template_data: {
          otp: otpCode,
        },
        tracking_id: `flydigi-${Date.now()}`,
      },
      {
        access_token: zaloToken,
      },
    );
    return { provider: "zalo_zns" };
  }

  // 3. Try Twilio SMS API if configured
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFrom = process.env.TWILIO_FROM_NUMBER?.trim();

  if (twilioSid && twilioToken && twilioFrom) {
    const body = new URLSearchParams({
      To: phoneE164,
      From: twilioFrom,
      Body: `[Flydigi] Your ${PURPOSE_LABELS[purpose]} OTP is ${otpCode}. Valid for 5 minutes.`,
    }).toString();

    const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString(
      "base64",
    );

    await postForm(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      body,
      {
        Authorization: `Basic ${basicAuth}`,
      },
    );
    return { provider: "twilio_sms" };
  }

  // 4. Dev Console Fallback
  console.log(
    [
      "",
      "╔══════════════════════════════════════════════════════════╗",
      "║             [DEV ZALO / SMS OTP DISPATCHED]              ║",
      `║  Phone   : ${phoneE164.padEnd(45, " ")}║`,
      `║  Purpose : ${PURPOSE_LABELS[purpose].padEnd(45, " ")}║`,
      `║  OTP Code: ${otpCode.padEnd(45, " ")}║`,
      "║  Expires : 5 minutes                                     ║",
      "╚══════════════════════════════════════════════════════════╝",
      "",
    ].join("\n"),
  );

  return { provider: "dev_console" };
}

function postJson(
  url: string,
  payload: Record<string, unknown>,
  headers: Record<string, string>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(
              new Error(
                `External OTP API failed (${res.statusCode}): ${responseBody}`,
              ),
            );
          }
        });
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function postForm(
  url: string,
  formBody: string,
  headers: Record<string, string>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(formBody),
          ...headers,
        },
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(
              new Error(
                `Twilio SMS API failed (${res.statusCode}): ${responseBody}`,
              ),
            );
          }
        });
      },
    );
    req.on("error", reject);
    req.write(formBody);
    req.end();
  });
}

