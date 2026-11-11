import { promises as fs } from "fs";
import path from "path";
import { randomInt, createHash } from "crypto";
import nodemailer from "nodemailer";
import { dataDir } from "@/lib/server/users";

export type OtpPurpose = "admin-reset" | "register-verify" | "book-request";

export interface StoredOtp {
  id: string;
  email: string;
  hash: string;
  purpose: OtpPurpose;
  expiresAt: number;
  attemptsLeft: number;
  used: boolean;
  createdAt: number;
}

export interface EmailDispatchResult {
  dispatched: boolean;
  deliveryMethod: "smtp" | "resend" | "local";
  message: string;
}

const otpFile = () => path.join(dataDir(), "otps.json");

function hashOtp(email: string, code: string, purpose: string): string {
  const secret = process.env.AUTH_SECRET || "fallback-otp-secret-key-32chars";
  return createHash("sha256").update(`${email}:${code}:${purpose}:${secret}`).digest("hex");
}

async function loadOtps(): Promise<StoredOtp[]> {
  try {
    const raw = await fs.readFile(otpFile(), "utf8");
    return JSON.parse(raw) as StoredOtp[];
  } catch {
    return [];
  }
}

async function saveOtps(otps: StoredOtp[]): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  const tmp = `${otpFile()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(otps, null, 2));
  await fs.rename(tmp, otpFile());
}

/** Generate a 6-digit cryptographic OTP, hash it, and store it. */
export async function createOtp(email: string, purpose: OtpPurpose): Promise<{ code: string; expiresAt: number }> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const otps = await loadOtps();

  // Rate limit: max 4 active OTP requests per email in 10 minutes
  const recent = otps.filter(
    (o) => o.email === normalizedEmail && o.purpose === purpose && now - o.createdAt < 10 * 60 * 1000
  );
  if (recent.length >= 4) {
    throw new Error("Too many OTP requests. Please wait 10 minutes before requesting another code.");
  }

  // Generate 6-digit numeric OTP (100000 - 999999)
  const code = randomInt(100000, 999999).toString();
  const hash = hashOtp(normalizedEmail, code, purpose);
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  // Invalidate any older unused code for this email and purpose
  const cleaned = otps.map((o) =>
    o.email === normalizedEmail && o.purpose === purpose ? { ...o, used: true } : o
  );

  const entry: StoredOtp = {
    id: `otp-${now}-${randomInt(1000, 9999)}`,
    email: normalizedEmail,
    hash,
    purpose,
    expiresAt,
    attemptsLeft: 5,
    used: false,
    createdAt: now,
  };

  await saveOtps([...cleaned, entry]);
  return { code, expiresAt };
}

/** Verify single-use OTP. Decrements attempts on failure, marks used on success. */
export async function verifyOtpCode(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<{ ok: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const otps = await loadOtps();

  const entry = otps.find(
    (o) => o.email === normalizedEmail && o.purpose === purpose && !o.used && o.expiresAt > now
  );

  if (!entry) {
    return { ok: false, error: "The verification code is invalid or has expired. Please request a new one." };
  }

  if (entry.attemptsLeft <= 0) {
    entry.used = true;
    await saveOtps(otps);
    return { ok: false, error: "Too many failed attempts. This code has been invalidated for security." };
  }

  const expectedHash = hashOtp(normalizedEmail, code.trim(), purpose);
  if (entry.hash !== expectedHash) {
    entry.attemptsLeft -= 1;
    if (entry.attemptsLeft <= 0) entry.used = true;
    await saveOtps(otps);
    return {
      ok: false,
      error: `Incorrect code. ${entry.attemptsLeft > 0 ? `${entry.attemptsLeft} attempts remaining.` : "Code expired."}`,
    };
  }

  // Mark single-use as consumed
  entry.used = true;
  await saveOtps(otps);
  return { ok: true };
}

/**
 * Shared email dispatcher using configured SMTP, Resend, or local fallback.
 */
async function dispatchEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  localSummary: string;
  logEntry: Record<string, unknown>;
}): Promise<EmailDispatchResult> {
  const { to, subject, text, html, localSummary, logEntry } = opts;

  // 1. Universal SMTP configuration (e.g. Gmail SMTP, SendGrid, Amazon SES)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === "true" || port === 465;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Sunlit Pages" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });

      return {
        dispatched: true,
        deliveryMethod: "smtp",
        message: `A 6-digit verification code has been sent to ${to}.`,
      };
    } catch (smtpErr) {
      console.error("[SMTP ERROR] Could not send email:", smtpErr);
      if (!process.env.RESEND_API_KEY) {
        const detail = smtpErr instanceof Error ? smtpErr.message : "Unknown SMTP error";
        throw new Error(`Could not send email via SMTP (${detail}). Please check your SMTP settings in .env.local.`);
      }
    }
  }

  // 2. Resend API integration
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Sunlit Pages <onboarding@resend.dev>",
          to: [to],
          subject,
          text,
          html,
        }),
      });

      if (res.ok) {
        return {
          dispatched: true,
          deliveryMethod: "resend",
          message: `A 6-digit verification code has been sent to ${to}.`,
        };
      } else {
        const errJson = (await res.json().catch(() => ({}))) as { message?: string };
        console.error("[RESEND ERROR]", errJson);
        throw new Error(
          `Could not send email via Resend (${errJson.message || `HTTP ${res.status}`}). Check RESEND_API_KEY and EMAIL_FROM in .env.local.`
        );
      }
    } catch (resendErr) {
      console.error("[RESEND ERROR] Could not send email:", resendErr);
      if (resendErr instanceof Error) throw resendErr;
      throw new Error("Could not send email via Resend. Check RESEND_API_KEY in .env.local.");
    }
  }

  // 3. Local Development Mailbox Fallback (writes to terminal & .data/otp-log.json)
  console.log(`\n======================================================`);
  console.log(`[DISPATCHED EMAIL] To: ${to}`);
  console.log(`[SUBJECT]          ${subject}`);
  console.log(`[DETAILS]          ${localSummary}`);
  console.log(`======================================================\n`);

  try {
    const logFile = path.join(dataDir(), "otp-log.json");
    let log: unknown[] = [];
    try {
      log = JSON.parse(await fs.readFile(logFile, "utf8"));
    } catch {}
    log.push({ email: to, ...logEntry, timestamp: new Date().toISOString() });
    await fs.writeFile(logFile, JSON.stringify(log.slice(-50), null, 2));
  } catch {}

  return {
    dispatched: true,
    deliveryMethod: "local",
    message:
      "Email provider (SMTP or Resend) is not configured in .env.local. Code was logged locally to the server terminal and .data/otp-log.json.",
  };
}

/**
 * Dispatch verification OTP using configured SMTP, Resend, or local mailbox fallback.
 */
export async function sendOtpEmail(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<EmailDispatchResult> {
  const subject =
    purpose === "admin-reset"
      ? "Sunlit Pages — Curator Password Reset Code"
      : purpose === "book-request"
      ? "Sunlit Pages — Book Request Verification Code"
      : "Sunlit Pages — Account Verification Code";

  const text = `Your Sunlit Pages verification code is: ${code}\n\nThis code is valid for 10 minutes and single-use.\nIf you did not make this request, you can safely ignore this email.`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 28px; background-color: #FFF9EF; color: #182230; border: 1px solid #F0E6D2; border-radius: 18px;">
      <h2 style="font-size: 24px; color: #F6B94C; margin-top: 0;">Sunlit Pages</h2>
      <p style="font-size: 15px; line-height: 1.6;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.6;">Your single-use verification code is:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; background: #FFFFFF; border: 2px dashed #F6B94C; border-radius: 12px; display: inline-block;">${code}</span>
      </div>
      <p style="font-size: 13px; color: #5C6B7C; line-height: 1.5;">This code expires in 10 minutes and can only be used once. Never share this code with anyone.</p>
    </div>
  `;

  return dispatchEmail({
    to: email,
    subject,
    text,
    html,
    localSummary: code,
    logEntry: { purpose, code },
  });
}

/**
 * Send a general transactional notification email (e.g., book request fulfilled).
 */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  message: string
): Promise<EmailDispatchResult> {
  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 28px; background-color: #FFF9EF; color: #182230; border: 1px solid #F0E6D2; border-radius: 18px;">
      <h2 style="font-size: 24px; color: #F6B94C; margin-top: 0;">Sunlit Pages</h2>
      <p style="font-size: 15px; line-height: 1.6;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.6;">${message}</p>
      <p style="font-size: 13px; color: #5C6B7C; line-height: 1.5;">Warm regards,<br/>The Sunlit Pages Salon</p>
    </div>
  `;

  return dispatchEmail({
    to: email,
    subject,
    text: message,
    html,
    localSummary: message,
    logEntry: { purpose: "notification", message },
  });
}
