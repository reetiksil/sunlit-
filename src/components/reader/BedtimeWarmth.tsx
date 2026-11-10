"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function BedtimeWarmth() {
  const [warmth, setWarmth] = useState(0); // 0 to 40%
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sunlit_bedtime_warmth");
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val)) setWarmth(val);
    }
  }, []);

  const updateWarmth = (val: number) => {
    setWarmth(val);
    localStorage.setItem("sunlit_bedtime_warmth", val.toString());
  };

  const isDark = resolvedTheme === "dark";

  return (
    <>
      {/* Amber Candlelight Screen Filter Overlay - Portaled directly to body to cover full viewport smoothly */}
      {mounted &&
        warmth > 0 &&
        createPortal(
          <div
            className="fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-300"
            style={{
              backgroundColor: isDark ? "#FFA726" : "#E68A00",
              opacity: (warmth / 100) * (isDark ? 0.32 : 0.22),
            }}
            aria-hidden="true"
          />,
          document.body
        )}

      <div className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`btn btn-reader btn-sm inline-flex items-center gap-1.5 ${
            warmth > 0 ? "text-amber-500 border-amber-500/50" : ""
          }`}
          title="Bedtime Warm-Light / Candle Glow"
        >
          <Moon className={`h-4 w-4 ${warmth > 0 ? "text-amber-500 fill-amber-500" : ""}`} />
          <span className="hidden sm:inline text-xs font-semibold">
            {warmth > 0 ? `${warmth}% Warm` : "Warmth"}
          </span>
        </button>

        {isOpen && (
          <div className="card fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 z-50 sm:w-56 max-w-[calc(100vw-2rem)] p-4 border border-border shadow-2xl space-y-3 animate-in fade-in zoom-in-95 bg-surface text-text rounded-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="font-serif text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5 text-amber-500" /> Bedtime Candlelight
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs text-text-muted hover:text-text"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-text-muted">
              Applies a 2200K amber glow to filter blue light and relax your eyes for evening reading.
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-text">
                <span>Warmth Level</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{warmth}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={warmth}
                onChange={(e) => updateWarmth(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1.5 bg-surface-soft rounded-lg cursor-pointer"
              />
            </div>

            {warmth > 0 && (
              <button
                type="button"
                onClick={() => updateWarmth(0)}
                className="text-xs text-primary hover:underline block text-center w-full pt-1"
              >
                Turn off warmth
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
