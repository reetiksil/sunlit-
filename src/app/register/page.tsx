"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput, PASSWORD_MIN_LENGTH } from "@/lib/authSchemas";
import { useAuthStore } from "@/stores/useAuthStore";
import { sendVerificationOtp, verifyRegistrationOtp } from "@/services/api";
import { Mail, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const refresh = useAuthStore((s) => s.refresh);
  const [serverError, setServerError] = useState<string | null>(null);

  // Verification step state
  const [step, setStep] = useState<"register" | "verify">("register");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      await registerUser(data.name, data.email, data.password);
      setRegisteredEmail(data.email);
      setStep("verify");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not create the account.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setServerError("Please enter a 6-digit code.");
      return;
    }
    setOtpLoading(true);
    setServerError(null);
    try {
      await verifyRegistrationOtp(registeredEmail, otpCode);
      setOtpSuccess("Email verified successfully! Taking you to your bookshelf…");
      await refresh();
      setTimeout(() => {
        router.push("/bookshelf");
        router.refresh();
      }, 1500);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Invalid or expired verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setServerError(null);
    setOtpMessage(null);
    try {
      const res = await sendVerificationOtp(registeredEmail);
      setOtpMessage(res.message);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to resend code.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card space-y-7 p-8 sm:p-10 border border-primary/20 shadow-xl">
        {step === "register" ? (
          <>
            <header className="space-y-2 text-center sm:text-left">
              <p className="eyebrow">New Reader</p>
              <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight">
                Save your place in every story
              </h1>
              <p className="text-xs text-text-muted">Join our tranquil salon for web fiction and serene reading.</p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="field">
                <label htmlFor="name" className="label">Your Name</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="input"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
              </div>

              <div className="field">
                <label htmlFor="email" className="label">Email Address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>

              <div className="field">
                <label htmlFor="password" className="label">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="input"
                  aria-invalid={!!errors.password}
                  aria-describedby="pw-hint"
                  {...register("password")}
                />
                <p id="pw-hint" className="text-xs text-text-muted">At least {PASSWORD_MIN_LENGTH} characters.</p>
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>

              {serverError && (
                <p role="alert" className="form-error rounded-xl bg-accent-blush/25 px-4 py-3">{serverError}</p>
              )}

              <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full shadow-md">
                {isSubmitting ? "Creating account…" : "Create Account & Verify"}
              </button>
            </form>

            <p className="text-center text-sm text-text-muted">
              Already have an account?{" "}
              <Link href="/login" className="link-underline font-semibold text-text">Sign in</Link>
            </p>
          </>
        ) : (
          <div className="space-y-6">
            <header className="space-y-2 text-center sm:text-left">
              <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-1">
                <Mail className="h-6 w-6" />
              </div>
              <h1 className="font-serif text-2xl font-semibold leading-tight">Verify Your Email</h1>
              <p className="text-xs text-text-muted">
                We sent a 6-digit confirmation code to <strong>{registeredEmail}</strong>. Please enter it below to verify your account.
              </p>
            </header>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="field">
                <label className="label">6-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="••••••"
                  className="input font-mono tracking-widest text-center text-xl font-bold"
                />
              </div>

              {serverError && <p className="form-error text-xs">{serverError}</p>}
              {otpMessage && <p className="text-xs text-primary font-medium">{otpMessage}</p>}
              {otpSuccess && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> {otpSuccess}
                </p>
              )}

              <button type="submit" disabled={otpLoading} className="btn btn-primary w-full">
                {otpLoading ? "Verifying…" : "Confirm Code & Complete Sign Up"}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/bookshelf")}
                  className="text-xs text-text-muted hover:underline"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
