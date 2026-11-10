"use client";

import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function BedtimeWarmth() {
  const [warmth, setWarmth] = useState(0); // 0 to 45%
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
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

  return (
    <>
      {/* Amber Candlelight Screen Filter Overlay */}
      {warmth > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-[999] transition-opacity duration-300"
          style={{
            backgroundColor: "#FF9A3C",
            opacity: warmth / 100,
            mixBlendMode: "multiply",
          }}
          aria-hidden="true"
        />
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
          <div className="card absolute right-0 top-11 z-50 w-56 p-4 border border-border shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
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
