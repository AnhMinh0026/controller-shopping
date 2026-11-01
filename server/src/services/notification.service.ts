import nodemailer from "nodemailer";
import type { OtpPurpose } from "../models/OtpVerification";

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
