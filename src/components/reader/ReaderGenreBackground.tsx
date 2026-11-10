"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { GenreSlug, ReaderTheme } from "@/types";

interface ReaderGenreBackgroundProps {
  genres?: GenreSlug[];
  theme?: ReaderTheme;
  isDark: boolean;
}

export function ReaderGenreBackground({
  genres = [],
  theme = "day",
  isDark,
}: ReaderGenreBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  // Pick primary genre or determine visual theme category
  const genreCategory = useMemo(() => {
    if (genres.some((g) => g === "slice-of-life" || g === "cozy")) return "slice-of-life";
    if (genres.some((g) => g === "fantasy")) return "fantasy";
    if (genres.some((g) => g === "sci-fi")) return "sci-fi";
    if (genres.some((g) => g === "romance")) return "romance";
    if (genres.some((g) => g === "mystery")) return "mystery";
    if (genres.some((g) => g === "adventure" || g === "historical")) return "adventure";
    return "slice-of-life"; // peaceful default
  }, [genres]);

  // Calm, theme-matched color palette (delicate, low contrast, peaceful)
  const isNightTheme = isDark || theme === "night" || theme === "true-dark";
  const strokeColor = isNightTheme ? "rgba(226, 232, 240, 0.12)" : "rgba(80, 60, 30, 0.08)";
  const accentFill = isNightTheme ? "rgba(255, 210, 138, 0.14)" : "rgba(230, 160, 60, 0.12)";
  const petalFill = isNightTheme ? "rgba(251, 191, 206, 0.15)" : "rgba(236, 130, 150, 0.14)";
  const greenFill = isNightTheme ? "rgba(167, 243, 208, 0.12)" : "rgba(100, 160, 120, 0.12)";
  const blueFill = isNightTheme ? "rgba(147, 197, 253, 0.13)" : "rgba(120, 170, 220, 0.11)";

  const animateAllowed = !shouldReduceMotion;

  return (
    <div
      aria-hidden="true"
      className="reader-genre-bg pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* ------------------------------------------------------------------ */}
      {/* 1. SLICE OF LIFE & COZY: Swaying branches, petals & gliding bird   */}
      {/* ------------------------------------------------------------------ */}
      {genreCategory === "slice-of-life" && (
        <>
          {/* Subtle cherry blossom / willow branch in top-left margin */}
          <motion.svg
            viewBox="0 0 320 220"
            className="absolute -top-6 -left-8 w-72 h-52 pointer-events-none opacity-45"
            animate={animateAllowed ? { rotate: [-1, 1.5, -1], y: [0, 3, 0] } : false}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Tree Branch */}
            <path
              d="M -10 10 Q 70 30 140 70 T 260 120 M 130 65 Q 180 40 220 30 M 70 30 Q 110 80 160 110"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Flower Blossoms / Leaves */}
            <circle cx="140" cy="70" r="5" fill={petalFill} />
            <circle cx="220" cy="30" r="6" fill={petalFill} />
            <circle cx="260" cy="120" r="5" fill={petalFill} />
            <circle cx="160" cy="110" r="4.5" fill={greenFill} />
            <circle cx="190" cy="48" r="4" fill={petalFill} />
            <circle cx="95" cy="50" r="4" fill={greenFill} />
          </motion.svg>

          {/* Gentle Gliding Songbird in top-right sky */}
          <motion.div
            className="absolute top-12 left-0 pointer-events-none opacity-30"
            animate={
              animateAllowed
                ? {
                    x: ["-10vw", "105vw"],
                    y: [20, 45, 15, 30],
                  }
                : false
            }
            transition={{ duration: 52, repeat: Infinity, ease: "linear", delay: 3 }}
          >
            <svg viewBox="0 0 60 30" className="w-10 h-6">
              <path
                d="M 5 20 Q 20 5 35 15 Q 50 5 55 20 Q 40 12 35 18 Q 20 12 5 20 Z"
                fill={strokeColor}
              />
            </svg>
          </motion.div>

          {/* Lazily drifting flower petals */}
          {[
            { id: "p1", xStart: "15%", delay: 0, dur: 26 },
            { id: "p2", xStart: "75%", delay: 7, dur: 32 },
            { id: "p3", xStart: "45%", delay: 14, dur: 29 },
            { id: "p4", xStart: "88%", delay: 4, dur: 35 },
            { id: "p5", xStart: "28%", delay: 18, dur: 28 },
          ].map((item) => (
            <motion.div
              key={item.id}
              className="absolute pointer-events-none opacity-40"
              style={{ left: item.xStart, top: "-5%" }}
              animate={
                animateAllowed
                  ? {
                      y: ["-5vh", "110vh"],
                      x: [0, 40, -30, 20],
                      rotate: [0, 180, 360],
                    }
                  : false
              }
              transition={{
                duration: item.dur,
                delay: item.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5">
                <path
                  d="M 10 2 C 14 5 16 12 10 18 C 4 12 6 5 10 2 Z"
                  fill={petalFill}
                />
              </svg>
            </motion.div>
          ))}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. FANTASY: Celestial wisps, mythical stag horn & starry motes    */}
      {/* ------------------------------------------------------------------ */}
      {genreCategory === "fantasy" && (
        <>
          {/* Ethereal runic aura in top right */}
          <motion.svg
            viewBox="0 0 160 160"
            className="absolute top-10 -right-8 w-44 h-44 pointer-events-none opacity-25"
            animate={animateAllowed ? { rotate: [0, 360] } : false}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="80" cy="80" r="60" fill="none" stroke={accentFill} strokeWidth="1" strokeDasharray="6 8" />
            <circle cx="80" cy="80" r="42" fill="none" stroke={accentFill} strokeWidth="0.8" />
            <polygon points="80,26 126,106 34,106" fill="none" stroke={accentFill} strokeWidth="0.8" />
            <polygon points="80,134 126,54 34,54" fill="none" stroke={accentFill} strokeWidth="0.8" />
          </motion.svg>

          {/* Floating starlight motes */}
          {[
            { id: "f1", top: "18%", left: "10%", delay: 0, dur: 18 },
            { id: "f2", top: "45%", left: "88%", delay: 5, dur: 22 },
            { id: "f3", top: "72%", left: "8%", delay: 9, dur: 20 },
            { id: "f4", top: "82%", left: "92%", delay: 3, dur: 24 },
          ].map((mote) => (
            <motion.div
              key={mote.id}
              className="absolute pointer-events-none opacity-45"
              style={{ top: mote.top, left: mote.left }}
              animate={
                animateAllowed
                  ? {
                      scale: [0.8, 1.3, 0.8],
                      opacity: [0.2, 0.7, 0.2],
                    }
                  : false
              }
              transition={{ duration: 5, delay: mote.delay, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path
                  d="M 12 0 L 14 10 L 24 12 L 14 14 L 12 24 L 10 14 L 0 12 L 10 10 Z"
                  fill={accentFill}
                />
              </svg>
            </motion.div>
          ))}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. SCI-FI: Orbital trajectory rings & stardust nebulae             */}
      {/* ------------------------------------------------------------------ */}
      {genreCategory === "sci-fi" && (
        <>
          <motion.svg
            viewBox="0 0 300 300"
            className="absolute top-20 -left-16 w-80 h-80 pointer-events-none opacity-20"
            animate={animateAllowed ? { rotate: [0, 360] } : false}
            transition={{ duration: 160, repeat: Infinity, ease: "linear" }}
          >
            <ellipse cx="150" cy="150" rx="130" ry="50" fill="none" stroke={blueFill} strokeWidth="1" strokeDasharray="8 12" />
            <ellipse cx="150" cy="150" rx="100" ry="38" fill="none" stroke={blueFill} strokeWidth="0.8" />
            <circle cx="280" cy="150" r="3" fill={blueFill} />
            <circle cx="150" cy="150" r="8" fill={blueFill} opacity="0.3" />
          </motion.svg>

          {/* Gentle constellation lines in right margin */}
          <svg viewBox="0 0 180 280" className="absolute top-44 right-2 w-48 h-72 pointer-events-none opacity-25">
            <polyline
              points="40,30 80,70 140,60 120,150 70,210 110,250"
              fill="none"
              stroke={strokeColor}
              strokeWidth="0.8"
              strokeDasharray="4 6"
            />
            {[[40, 30], [80, 70], [140, 60], [120, 150], [70, 210], [110, 250]].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="2.5" fill={blueFill} />
            ))}
          </svg>
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. ROMANCE: Falling rose petals & gentle warm shimmer              */}
      {/* ------------------------------------------------------------------ */}
      {genreCategory === "romance" && (
        <>
          {[
            { id: "r1", left: "12%", delay: 0, dur: 24 },
            { id: "r2", left: "82%", delay: 6, dur: 30 },
            { id: "r3", left: "38%", delay: 12, dur: 27 },
            { id: "r4", left: "68%", delay: 3, dur: 33 },
          ].map((item) => (
            <motion.div
              key={item.id}
              className="absolute pointer-events-none opacity-35"
              style={{ left: item.left, top: "-5%" }}
              animate={
                animateAllowed
                  ? {
                      y: ["-5vh", "110vh"],
                      x: [0, 35, -25, 0],
                      rotate: [0, 140, 280],
                    }
                  : false
              }
              transition={{
                duration: item.dur,
                delay: item.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path
                  d="M 12 2 C 16 6 20 12 12 22 C 4 12 8 6 12 2 Z"
                  fill={petalFill}
                />
              </svg>
            </motion.div>
          ))}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. MYSTERY: Soft swirling mist banks & lantern glow                */}
      {/* ------------------------------------------------------------------ */}
      {genreCategory === "mystery" && (
        <>
          <motion.svg
            viewBox="0 0 600 200"
            className="absolute -top-10 left-0 w-full h-44 pointer-events-none opacity-20"
            animate={animateAllowed ? { x: [-30, 30, -30] } : false}
            transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
          >
            <path
              d="M 0 100 Q 150 40 300 90 T 600 80 L 600 200 L 0 200 Z"
              fill={strokeColor}
            />
          </motion.svg>

          {/* Distant soaring owl/raven silhouette */}
          <motion.div
            className="absolute top-28 left-0 pointer-events-none opacity-25"
            animate={
              animateAllowed
                ? {
                    x: ["105vw", "-10vw"],
                    y: [10, 30, 15],
                  }
                : false
            }
            transition={{ duration: 60, repeat: Infinity, ease: "linear", delay: 8 }}
          >
            <svg viewBox="0 0 50 25" className="w-8 h-4">
              <path
                d="M 0 15 Q 15 5 25 12 Q 35 5 50 15 Q 35 10 25 16 Q 15 10 0 15 Z"
                fill={strokeColor}
              />
            </svg>
          </motion.div>
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. ADVENTURE & HISTORICAL: Mountain ridge silhouette & soaring hawk */}
      {/* ------------------------------------------------------------------ */}
      {genreCategory === "adventure" && (
        <>
          <svg viewBox="0 0 800 120" className="absolute bottom-0 left-0 w-full h-28 pointer-events-none opacity-15">
            <path
              d="M 0 120 L 0 80 L 120 40 L 220 90 L 360 20 L 480 85 L 620 35 L 740 75 L 800 50 L 800 120 Z"
              fill={strokeColor}
            />
          </svg>

          {/* Soaring hawk high in the sky */}
          <motion.div
            className="absolute top-16 left-0 pointer-events-none opacity-30"
            animate={
              animateAllowed
                ? {
                    x: ["-10vw", "105vw"],
                    y: [15, 35, 10, 25],
                  }
                : false
            }
            transition={{ duration: 64, repeat: Infinity, ease: "linear", delay: 1 }}
          >
            <svg viewBox="0 0 60 25" className="w-10 h-5">
              <path
                d="M 5 18 Q 20 2 30 12 Q 40 2 55 18 Q 38 10 30 15 Q 22 10 5 18 Z"
                fill={strokeColor}
              />
            </svg>
          </motion.div>
        </>
      )}
    </div>
  );
}
