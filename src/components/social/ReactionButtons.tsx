"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getReaction, toggleReaction } from "@/services/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ReactionSummary, ReactionTargetType, ReactionType } from "@/types";

interface ReactionButtonsProps {
  targetType: ReactionTargetType;
  targetId: string;
  initialLikeCount?: number;
  initialDislikeCount?: number;
  initialUserReaction?: ReactionType | null;
  fetchOnMount?: boolean;
  variant?: "default" | "reader";
  size?: "sm" | "md";
}

export function ReactionButtons({
  targetType,
  targetId,
  initialLikeCount = 0,
  initialDislikeCount = 0,
  initialUserReaction = null,
  fetchOnMount = false,
  variant = "default",
  size = "sm",
}: ReactionButtonsProps) {
  const user = useAuthStore((s) => s.user);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReactionSummary>({
    likeCount: initialLikeCount,
    dislikeCount: initialDislikeCount,
    userReaction: initialUserReaction,
  });

  useEffect(() => {
    setSummary({
      likeCount: initialLikeCount,
      dislikeCount: initialDislikeCount,
      userReaction: initialUserReaction,
    });
  }, [initialLikeCount, initialDislikeCount, initialUserReaction, targetId]);

  const { data: fetched } = useQuery({
    queryKey: ["reaction", targetType, targetId, user?.id ?? "guest"],
    enabled: fetchOnMount && !!targetId,
    queryFn: () => getReaction(targetType, targetId),
  });

  useEffect(() => {
    if (fetched) {
      setSummary(fetched);
    }
  }, [fetched]);

  const mutation = useMutation({
    mutationFn: (reaction: ReactionType) => toggleReaction(targetType, targetId, reaction),
    onSuccess: (updated) => {
      setSummary(updated);
      setAuthNotice(null);
    },
    onError: (err) => {
      setAuthNotice(err instanceof Error ? err.message : "Could not update reaction.");
    },
  });

  const handleReact = (reaction: ReactionType) => {
    if (!user) {
      setAuthNotice("Please sign in with a registered account to like or dislike.");
      return;
    }
    if (mutation.isPending) return;
    mutation.mutate(reaction);
  };

  const isLiked = summary.userReaction === "like";
  const isDisliked = summary.userReaction === "dislike";
  const padClass = size === "md" ? "px-3.5 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]";
  const iconClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  const baseBtnStyle =
    variant === "reader"
      ? { borderColor: "var(--reader-border)", color: "var(--reader-text)" }
      : undefined;

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleReact("like")}
          disabled={mutation.isPending}
          aria-pressed={isLiked}
          aria-label={`Like (${summary.likeCount})`}
          style={isLiked ? undefined : baseBtnStyle}
          className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all disabled:opacity-60 ${padClass} ${
            isLiked
              ? "border-emerald-600/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs"
              : variant === "reader"
              ? "hover:bg-primary/10"
              : "border-border bg-surface-soft/60 text-text-muted hover:text-text hover:border-primary/40"
          }`}
        >
          <ThumbsUp className={`${iconClass} ${isLiked ? "fill-current" : ""}`} />
          <span className="tabular-nums">{summary.likeCount}</span>
        </button>

        <button
          type="button"
          onClick={() => handleReact("dislike")}
          disabled={mutation.isPending}
          aria-pressed={isDisliked}
          aria-label={`Dislike (${summary.dislikeCount})`}
          style={isDisliked ? undefined : baseBtnStyle}
          className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all disabled:opacity-60 ${padClass} ${
            isDisliked
              ? "border-rose-600/50 bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-xs"
              : variant === "reader"
              ? "hover:bg-rose-500/10"
              : "border-border bg-surface-soft/60 text-text-muted hover:text-text hover:border-rose-500/40"
          }`}
        >
          <ThumbsDown className={`${iconClass} ${isDisliked ? "fill-current" : ""}`} />
          <span className="tabular-nums">{summary.dislikeCount}</span>
        </button>
      </div>

      {authNotice && (
        <p role="alert" className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
          {authNotice}{" "}
          {!user && (
            <Link href="/login" className="underline font-bold text-primary">
              Sign in
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
