"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Send, Trash2, Lock, Loader2, User as UserIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteComment, getComments, postComment } from "@/services/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { ReactionButtons } from "@/components/social/ReactionButtons";
import type { Comment, CommentTargetType } from "@/types";

interface CommentsSectionProps {
  targetType: CommentTargetType;
  targetId: string;
  heading?: string;
  variant?: "default" | "reader";
}

const PAGE_LIMIT = 20;

export function CommentsSection({
  targetType,
  targetId,
  heading,
  variant = "default",
}: CommentsSectionProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extraComments, setExtraComments] = useState<Comment[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset paginated list if target changes
  useEffect(() => {
    setExtraComments([]);
    setErrorMsg(null);
  }, [targetType, targetId]);

  const queryKey = ["comments", targetType, targetId, user?.id ?? "guest"];

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: !!targetId,
    queryFn: () => getComments(targetType, targetId, 0, PAGE_LIMIT),
  });

  const postMutation = useMutation({
    mutationFn: (text: string) => postComment(targetType, targetId, text),
    onSuccess: (created) => {
      setContent("");
      setErrorMsg(null);
      setExtraComments([]);
      queryClient.setQueryData<{ comments: Comment[]; total: number; hasMore: boolean }>(
        queryKey,
        (old) => {
          if (!old) return { comments: [created], total: 1, hasMore: false };
          return {
            comments: [created, ...old.comments],
            total: old.total + 1,
            hasMore: old.hasMore,
          };
        }
      );
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : "Could not post comment.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(targetType, targetId, commentId),
    onSuccess: (_res, deletedId) => {
      setExtraComments((prev) => prev.filter((c) => c.id !== deletedId));
      queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : "Could not delete comment.");
    },
  });

  const handleLoadMore = async () => {
    if (loadingMore) return;
    const currentLoadedCount = (data?.comments.length ?? 0) + extraComments.length;
    setLoadingMore(true);
    try {
      const next = await getComments(targetType, targetId, currentLoadedCount, PAGE_LIMIT);
      setExtraComments((prev) => {
        const seen = new Set([
          ...(data?.comments.map((c) => c.id) ?? []),
          ...prev.map((c) => c.id),
        ]);
        const uniqueNext = next.comments.filter((c) => !seen.has(c.id));
        return [...prev, ...uniqueNext];
      });
    } catch {
      setErrorMsg("Could not load older comments right now.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || postMutation.isPending) return;
    setErrorMsg(null);
    postMutation.mutate(trimmed);
  };

  const combinedComments = [...(data?.comments ?? []), ...extraComments];
  const totalCount = data?.total ?? combinedComments.length;
  const canLoadMore = combinedComments.length < totalCount;

  const isReader = variant === "reader";
  const boxStyle = isReader
    ? {
        backgroundColor: "var(--reader-surface)",
        borderColor: "var(--reader-border)",
        color: "var(--reader-text)",
      }
    : undefined;

  return (
    <section
      aria-label={heading || "Comments"}
      onClick={isReader ? (e) => e.stopPropagation() : undefined}
      onDoubleClick={isReader ? (e) => e.stopPropagation() : undefined}
      className={isReader ? "space-y-6 font-sans" : "space-y-6"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span>{heading || (targetType === "chapter" ? "Chapter Discussion" : "Reader Comments")}</span>
          <span className="text-sm font-sans font-medium opacity-70">({totalCount})</span>
        </h3>
        <span className="text-[11px] opacity-65">Max 5 comments / min</span>
      </div>

      {/* Comment Composer (Registered Users Only) */}
      {user ? (
        <form
          onSubmit={handleSubmit}
          style={boxStyle}
          className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
            isReader ? "" : "border-border bg-surface shadow-xs"
          }`}
        >
          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-700 dark:text-rose-300"
            >
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor={`comment-${targetType}-${targetId}`} className="text-xs font-semibold opacity-80 block">
              Posting as {user.name}
            </label>
            <textarea
              id={`comment-${targetType}-${targetId}`}
              rows={3}
              required
              minLength={2}
              maxLength={1500}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                targetType === "chapter"
                  ? "Share your thoughts on this chapter (be mindful of spoilers)…"
                  : "Share a comment about this book with other readers…"
              }
              style={
                isReader
                  ? {
                      borderColor: "var(--reader-border)",
                      color: "var(--reader-text)",
                      backgroundColor: "transparent",
                    }
                  : undefined
              }
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y ${
                isReader
                  ? "placeholder:opacity-50"
                  : "border-border bg-bg text-text placeholder:text-text-muted"
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] opacity-65 tabular-nums">
              {content.length} / 1,500 characters
            </span>
            <button
              type="submit"
              disabled={postMutation.isPending || content.trim().length < 2}
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {postMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Posting…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Post Comment
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div
          style={boxStyle}
          className={`rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4 ${
            isReader ? "" : "border-border bg-surface-soft/50"
          }`}
        >
          <div className="space-y-1">
            <p className="font-serif font-semibold text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> Join the conversation
            </p>
            <p className="text-xs opacity-75">
              Only registered readers can post comments, reviews, and likes/dislikes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm text-xs">
              Sign in
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm text-xs">
              Register
            </Link>
          </div>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-20 animate-pulse rounded-2xl border opacity-40"
              style={boxStyle}
            />
          ))}
        </div>
      ) : combinedComments.length === 0 ? (
        <div
          style={boxStyle}
          className={`rounded-2xl border p-8 text-center text-xs opacity-75 ${
            isReader ? "" : "border-border bg-surface/60"
          }`}
        >
          No comments yet. Be the first registered reader to leave a note!
        </div>
      ) : (
        <div className="space-y-3">
          {combinedComments.map((c) => {
            const canDelete = Boolean(user && (user.id === c.userId || user.role === "admin"));
            return (
              <article
                key={c.id}
                style={boxStyle}
                className={`rounded-2xl border p-4 sm:p-5 space-y-2.5 ${
                  isReader ? "" : "border-border bg-surface shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary shrink-0">
                      <UserIcon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{c.userName}</p>
                      <p className="text-[11px] opacity-65">
                        {new Date(c.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm("Remove this comment?")) {
                          deleteMutation.mutate(c.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete comment"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-sm leading-relaxed whitespace-pre-line break-words">
                  {c.content}
                </p>

                <div className="pt-1">
                  <ReactionButtons
                    targetType="comment"
                    targetId={c.id}
                    initialLikeCount={c.likeCount}
                    initialDislikeCount={c.dislikeCount}
                    initialUserReaction={c.userReaction}
                    variant={variant}
                    size="sm"
                  />
                </div>
              </article>
            );
          })}

          {canLoadMore && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={boxStyle}
                className={`btn btn-sm text-xs ${
                  isReader ? "border hover:opacity-80" : "btn-ghost"
                }`}
              >
                {loadingMore ? "Loading…" : `Load More Comments (${totalCount - combinedComments.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
