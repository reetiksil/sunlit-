"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/authSchemas";
import { safeNextPath } from "@/lib/safeRedirect";
import { useAuthStore } from "@/stores/useAuthStore";
import { requestPasswordReset, resetPassword } from "@/services/api";
import { KeyRound, Mail, ShieldCheck, X } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);

  // Forgot password OTP flow state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const user = await login(data.email, data.password);
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(safeNextPath(next, "/bookshelf"));
      }
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not sign in.");
    }
  };

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError("Please enter your email.");
      return;
    }
    setResetLoading(true);
    setResetError(null);
    setResetMessage(null);
    try {
      const res = await requestPasswordReset(resetEmail.trim());
      setOtpSent(true);
      setResetMessage(res.message);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || resetNewPass.length < 8) {
      setResetError("Please enter the 6-digit code and a new password (min 8 characters).");
      return;
    }
    setResetLoading(true);
    setResetError(null);
    try {
      const res = await resetPassword({
        email: resetEmail.trim(),
        code: resetCode.trim(),
        newPassword: resetNewPass,
      });
      setResetMessage(res.message);
      setTimeout(() => {
        setShowForgot(false);
        setOtpSent(false);
        setResetCode("");
        setResetNewPass("");
      }, 2000);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card space-y-7 p-8 sm:p-10 border border-primary/20 shadow-xl">
        <header className="space-y-2 text-center sm:text-left">
          <p className="eyebrow">Welcome Back</p>
          <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight">
            Step into the reading room
          </h1>
          <p className="text-xs text-text-muted">Enter your credentials to access your library or curator studio.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="field">
            <label htmlFor="email" className="label">Email Address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-err" : undefined}
              {...register("email")}
            />
            {errors.email && <p id="email-err" className="form-error">{errors.email.message}</p>}
          </div>

          <div className="field">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="label">Password</label>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setResetError(null);
                  setResetMessage(null);
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "pw-err" : undefined}
              {...register("password")}
            />
            {errors.password && <p id="pw-err" className="form-error">{errors.password.message}</p>}
          </div>

          {serverError && (
            <p role="alert" className="form-error rounded-xl bg-accent-blush/25 px-4 py-3">{serverError}</p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full shadow-md">
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted">
          New here?{" "}
          <Link href="/register" className="link-underline font-semibold text-text">
            Create an account
          </Link>
        </p>
      </div>

      {/* Forgot Password OTP Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 sm:p-8 space-y-5 border border-primary/30 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-xl font-bold">Password Reset (OTP)</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="p-1 text-text-muted hover:text-text rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendResetOtp} className="space-y-4">
                <p className="text-xs text-text-muted">
                  Enter your account email. We will send a single-use, 6-digit OTP code valid for 10 minutes.
                </p>
                <div className="field">
                  <label className="label">Account Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="curator@example.com"
                    className="input"
                  />
                </div>
                {resetError && <p className="form-error text-xs">{resetError}</p>}
                {resetMessage && <p className="text-xs text-primary font-medium">{resetMessage}</p>}
                <button type="submit" disabled={resetLoading} className="btn btn-primary w-full">
                  {resetLoading ? "Sending Code…" : "Send Verification OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <p className="text-xs text-text-muted">
                  {resetMessage || (
                    <>
                      A verification code has been dispatched to <strong>{resetEmail}</strong>.
                    </>
                  )}
                </p>
                <div className="field">
                  <label className="label">6-Digit OTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    className="input font-mono tracking-widest text-center text-lg"
                  />
                </div>
                <div className="field">
                  <label className="label">New Password (min 8 chars)</label>
                  <input
                    type="password"
                    required
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="input"
                  />
                </div>
                {resetError && <p className="form-error text-xs">{resetError}</p>}
                {resetMessage && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> {resetMessage}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Back
                  </button>
                  <button type="submit" disabled={resetLoading} className="btn btn-primary flex-1">
                    {resetLoading ? "Updating…" : "Set New Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
