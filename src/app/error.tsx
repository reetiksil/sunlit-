"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center space-y-5">
      <h1 className="font-serif text-2xl font-semibold text-text">
        A gentle pause in the reading room
      </h1>
      <p className="text-sm text-text-muted">
        Something unexpected occurred while loading this view. Your local reading progress and
        bookshelf remain safe.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-xs font-semibold text-primary-fg"
      >
        <RotateCcw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}