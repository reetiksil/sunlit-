"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { submitBookRequest, sendRequestOtp } from "@/services/api";
import { BookPlus, CheckCircle2, ShieldCheck, Mail, KeyRound, ArrowRight, Loader2, X } from "lucide-react";
import Link from "next/link";

interface RequestBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestBookModal({ isOpen, onClose }: RequestBookModalProps) {
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");

  // Guest fields
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");

  // OTP verification state
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSentMsg, setOtpSentMsg] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const isUserVerified = Boolean(user && (user.isVerified || user.role === "admin"));

  const handleSendOtp = async (emailToUse: string) => {
    setSendingOtp(true);
    setError(null);
    try {
      const res = await sendRequestOtp(emailToUse || undefined);
      setOtpRequired(true);
      setOtpSentMsg(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispatch verification code.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !author.trim()) {
      setError("Please provide both book title and author.");
      return;
    }

    // If user is not logged in, email is required
    if (!user && !guestEmail.trim()) {
      setError("Please enter your email address so we can verify your request.");
      return;
    }

    // If verification is required (guest or unverified user) and code not yet requested
    if (!isUserVerified && !otpRequired) {
      const targetEmail = user ? user.email : guestEmail.trim();
      await handleSendOtp(targetEmail);
      return;
    }

    // If OTP is required, check that the user entered the 6 digits
    if (!isUserVerified && otpRequired && (!otpCode.trim() || otpCode.trim().length !== 6)) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      await submitBookRequest({
        title,
        author,
        note: note.trim() || undefined,
        email: user ? undefined : guestEmail.trim(),
        name: user ? undefined : guestName.trim() || undefined,
        otp: !isUserVerified ? otpCode.trim() : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle("");
        setAuthor("");
        setNote("");
        setGuestEmail("");
        setGuestName("");
        setOtpCode("");
        setOtpRequired(false);
        setOtpSentMsg(null);
        onClose();
      }, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card w-full max-w-lg p-6 sm:p-8 space-y-5 border border-primary/30 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-text-muted hover:text-text rounded-lg"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <header className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <BookPlus className="h-5 w-5" />
            <p className="eyebrow text-primary">Curator Request</p>
          </div>
          <h2 className="font-serif text-2xl font-bold">Request a Book</h2>
          <p className="text-xs text-text-muted">
            Can&apos;t find what you&apos;re looking for? Suggest a public domain or web fiction masterpiece to our curators.
          </p>
        </header>

        {success ? (
          <div className="p-8 text-center space-y-3 bg-surface-soft/60 rounded-2xl border border-primary/20">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
            <h3 className="font-serif text-lg font-semibold text-text">Request Received!</h3>
            <p className="text-xs text-text-muted">
              Our curation team has received your suggestion. We will notify you once it has been processed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Authenticated User Status Banner */}
            {user ? (
              <div className="p-3 rounded-xl bg-surface-soft border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">
                    Requesting as <strong className="text-text">{user.name}</strong> ({user.email})
                  </span>
                </div>
                {isUserVerified && (
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                    Verified Reader
                  </span>
                )}
              </div>
            ) : (
              /* Guest Email & Name Fields */
              <div className="space-y-3 p-3.5 rounded-xl bg-surface-soft/60 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" /> Contact Details
                  </span>
                  <Link href="/login" onClick={onClose} className="text-[11px] text-primary hover:underline">
                    Already have an account? Sign in
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="field">
                    <label className="label text-[11px]">Your Email *</label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input h-9 text-xs"
                      disabled={otpRequired}
                    />
                  </div>
                  <div className="field">
                    <label className="label text-[11px]">Your Name (Optional)</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Elena"
                      className="input h-9 text-xs"
                      disabled={otpRequired}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Book Details */}
            <div className="field">
              <label className="label">Book Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Picture of Dorian Gray"
                className="input"
              />
            </div>

            <div className="field">
              <label className="label">Author *</label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Oscar Wilde"
                className="input"
              />
            </div>

            <div className="field">
              <label className="label">Notes / Source Link (Optional)</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any specific translation, edition, or Gutenberg URL…"
                className="input py-2 h-auto resize-none text-xs"
              />
            </div>

            {/* OTP Verification Input if required */}
            {(!isUserVerified || otpRequired) && otpRequired && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-text">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span>Enter 6-Digit Verification Code</span>
                </div>
                {otpSentMsg && <p className="text-[11px] text-text-muted">{otpSentMsg}</p>}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="input h-10 text-center tracking-[0.3em] font-mono text-base font-bold w-40"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendOtp(user ? user.email : guestEmail)}
                    disabled={sendingOtp}
                    className="btn btn-ghost btn-sm text-xs"
                  >
                    {sendingOtp ? "Resending…" : "Resend Code"}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="form-error text-xs">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || sendingOtp}
                className="btn btn-primary inline-flex items-center gap-1.5"
              >
                {loading || sendingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                  </>
                ) : !isUserVerified && !otpRequired ? (
                  <>
                    Verify & Continue <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
