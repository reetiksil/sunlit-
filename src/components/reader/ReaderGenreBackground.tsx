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

  // Pick primary genre category with peaceful fallback
  const genreCategory = useMemo(() => {
    const list = Array.isArray(genres) ? genres.map((g) => String(g).toLowerCase()) : [];
    if (list.some((g) => g.includes("slice") || g.includes("cozy") || g.includes("life"))) return "slice-of-life";
    if (list.some((g) => g.includes("fantasy") || g.includes("magic"))) return "fantasy";
    if (list.some((g) => g.includes("sci") || g.includes("space"))) return "sci-fi";
    if (list.some((g) => g.includes("romance") || g.includes("love"))) return "romance";
    if (list.some((g) => g.includes("mystery") || g.includes("detective"))) return "mystery";
    if (list.some((g) => g.includes("adventure") || g.includes("historical"))) return "adventure";
    return "slice-of-life"; // comforting default
  }, [genres]);

  const isNightTheme = isDark || theme === "night" || theme === "true-dark";

  // Visible, soft, calming colors
  const strokeColor = isNightTheme ? "rgba(226, 232, 240, 0.40)" : "rgba(145, 95, 45, 0.42)";
  const branchColor = isNightTheme ? "rgba(148, 163, 184, 0.45)" : "rgba(120, 80, 40, 0.45)";
  const accentFill = isNightTheme ? "rgba(253, 224, 71, 0.55)" : "rgba(245, 158, 11, 0.48)";
  const petalFill = isNightTheme ? "rgba(244, 114, 182, 0.55)" : "rgba(236, 72, 153, 0.45)";
  const greenFill = isNightTheme ? "rgba(110, 231, 183, 0.50)" : "rgba(16, 185, 129, 0.42)";
  const blueFill = isNightTheme ? "rgba(147, 197, 253, 0.55)" : "rgba(59, 130, 246, 0.40)";

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
          {/* Swaying cherry blossom branch in top-left margin */}
          <motion.svg
            viewBox="0 0 340 240"
            className="absolute -top-4 -left-6 w-80 h-56 pointer-events-none opacity-85"
            animate={animateAllowed ? { rotate: [-1.5, 2, -1.5], y: [0, 4, 0] } : false}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Main branch and twigs */}
            <path
              d="M -10 10 Q 70 30 140 75 T 270 125 M 135 70 Q 185 45 230 35 M 65 28 Q 110 85 165 115 M 190 100 Q 230 140 250 165"
              fill="none"
              stroke={branchColor}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* Blossoms & fresh leaves */}
            <circle cx="140" cy="75" r="6" fill={petalFill} />
            <circle cx="230" cy="35" r="7" fill={petalFill} />
            <circle cx="270" cy="125" r="6" fill={petalFill} />
            <circle cx="165" cy="115" r="5" fill={greenFill} />
            <circle cx="195" cy="50" r="5.5" fill={petalFill} />
            <circle cx="95" cy="52" r="5" fill={greenFill} />
            <circle cx="250" cy="165" r="5.5" fill={petalFill} />
          </motion.svg>

          {/* Gentle Gliding Songbird across the upper sky */}
          <motion.div
            className="absolute top-16 left-0 pointer-events-none opacity-60"
            animate={
              animateAllowed
                ? {
                    x: ["-10vw", "105vw"],
                    y: [10, 40, 15, 30],
                  }
                : false
            }
            transition={{ duration: 46, repeat: Infinity, ease: "linear", delay: 2 }}
          >
            <svg viewBox="0 0 60 30" className="w-12 h-6">
              <path
                d="M 5 20 Q 20 5 35 15 Q 50 5 55 20 Q 40 12 35 18 Q 20 12 5 20 Z"
                fill={strokeColor}
              />
            </svg>
          </motion.div>

          {/* Lazily drifting flower petals */}
          {[
            { id: "p1", xStart: "12%", delay: 0, dur: 22 },
            { id: "p2", xStart: "78%", delay: 6, dur: 28 },
            { id: "p3", xStart: "42%", delay: 12, dur: 25 },
            { id: "p4", xStart: "88%", delay: 3, dur: 30 },
            { id: "p5", xStart: "25%", delay: 16, dur: 24 },
          ].map((item) => (
            <motion.div
              key={item.id}
              className="absolute pointer-events-none opacity-70"
              style={{ left: item.xStart, top: "-5%" }}
              animate={
                animateAllowed
                  ? {
                      y: ["-5vh", "110vh"],
                      x: [0, 45, -35, 20],
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
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path
                  d="M 12 2 C 18 6 20 14 12 22 C 4 14 6 6 12 2 Z"
                  fill={petalFill}
                />
              </svg>
            </motion.div>
          ))}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. FANTASY: Rotating celestial runes & drifting starlight motes   */}
      {/* ------------------------------------------------------------------ */}
      {genreCategory === "fantasy" && (
        <>
          {/* Ethereal runic astrolabe in top right */}
          <motion.svg
            viewBox="0 0 200 200"
            className="absolute top-8 -right-10 w-52 h-52 pointer-events-none opacity-55"
            animate={animateAllowed ? { rotate: [0, 360] } : false}
            transition={{ duration: 110, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="100" cy="100" r="80" fill="none" stroke={accentFill} strokeWidth="1.5" strokeDasharray="8 10" />
            <circle cx="100" cy="100" r="55" fill="none" stroke={accentFill} strokeWidth="1" />
            <polygon points="100,28 160,132 40,132" fill="none" stroke={accentFill} strokeWidth="1" />
            <polygon points="100,172 160,68 40,68" fill="none" stroke={accentFill} strokeWidth="1" />
            <circle cx="100" cy="100" r="5" fill={accentFill} />
          </motion.svg>

          {/* Floating starlight motes */}
          {[
            { id: "f1", top: "16%", left: "8%", delay: 0, dur: 16 },
            { id: "f2", top: "42%", left: "90%", delay: 4, dur: 20 },
            { id: "f3", top: "68%", left: "10%", delay: 8, dur: 18 },
            { id: "f4", top: "84%", left: "86%", delay: 2, dur: 22 },
          ].map((mote) => (
            <motion.div
              key={mote.id}
              className="absolute pointer-events-none opacity-75"
              style={{ top: mote.top, left: mote.left }}
              animate={
                animateAllowed
                  ? {
                      scale: [0.8, 1.4, 0.8],
                      opacity: [0.3, 0.9, 0.3],
                    }
                  : false
              }
              transition={{ duration: 4.5, delay: mote.delay, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  d="M 12 0 L 14.5 9.5 L 24 12 L 14.5 14.5 L 12 24 L 9.5 14.5 L 0 12 L 9.5 9.5 Z"
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
            viewBox="0 0 320 320"
            className="absolute top-16 -left-16 w-84 h-84 pointer-events-none opacity-45"
            animate={animateAllowed ? { rotate: [0, 360] } : false}
            transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          >
            <ellipse cx="160" cy="160" rx="140" ry="55" fill="none" stroke={blueFill} strokeWidth="1.4" strokeDasharray="10 14" />
            <ellipse cx="160" cy="160" rx="105" ry="40" fill="none" stroke={blueFill} strokeWidth="1" />
            <circle cx="300" cy="160" r="4" fill={blueFill} />
            <circle cx="160" cy="160" r="10" fill={blueFill} opacity="0.4" />
          </motion.svg>

          {/* Gentle constellation lines in right margin */}
          <svg viewBox="0 0 180 280" className="absolute top-40 right-4 w-48 h-72 pointer-events-none opacity-50">
            <polyline
              points="40,30 80,70 140,60 120,150 70,210 110,250"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeDasharray="5 7"
            />
            {[[40, 30], [80, 70], [140, 60], [120, 150], [70, 210], [110, 250]].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="3" fill={blueFill} />
            ))}
          </svg>
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. ROMANCE: Falling rose petals & warm shimmer                     */}
      {/* ------------------------------------------------------------------ */}
      {genreCategory === "romance" && (
        <>
          {[
            { id: "r1", left: "10%", delay: 0, dur: 22 },
            { id: "r2", left: "84%", delay: 5, dur: 26 },
            { id: "r3", left: "36%", delay: 10, dur: 24 },
            { id: "r4", left: "70%", delay: 3, dur: 29 },
          ].map((item) => (
            <motion.div
              key={item.id}
              className="absolute pointer-events-none opacity-65"
              style={{ left: item.left, top: "-5%" }}
              animate={
                animateAllowed
                  ? {
                      y: ["-5vh", "110vh"],
                      x: [0, 40, -30, 0],
                      rotate: [0, 160, 320],
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
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  d="M 12 2 C 17 6 22 13 12 22 C 2 13 7 6 12 2 Z"
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
            className="absolute -top-6 left-0 w-full h-48 pointer-events-none opacity-40"
            animate={animateAllowed ? { x: [-35, 35, -35] } : false}
            transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
          >
            <path
              d="M 0 100 Q 150 40 300 90 T 600 80 L 600 200 L 0 200 Z"
              fill={strokeColor}
            />
          </motion.svg>

          {/* Distant soaring owl/raven silhouette */}
          <motion.div
            className="absolute top-24 left-0 pointer-events-none opacity-50"
            animate={
              animateAllowed
                ? {
                    x: ["105vw", "-10vw"],
                    y: [10, 35, 15],
                  }
                : false
            }
            transition={{ duration: 54, repeat: Infinity, ease: "linear", delay: 6 }}
          >
            <svg viewBox="0 0 50 25" className="w-10 h-5">
              <path
                d="M 0 15 Q 15 5 25 12 Q 35 5 50 15 Q 35 10 25 16 Q 15 10 0 15 Z"
                fill={strokeColor}
              />
            </svg>
          </motion.div>
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. ADVENTURE & HISTORICAL: Mountain skyline & soaring falcon        */}
      {/* ------------------------------------------------------------------ */}
      {genreCategory === "adventure" && (
        <>
          <svg viewBox="0 0 800 120" className="absolute bottom-0 left-0 w-full h-32 pointer-events-none opacity-30">
            <path
              d="M 0 120 L 0 75 L 120 35 L 220 85 L 360 15 L 480 80 L 620 30 L 740 70 L 800 45 L 800 120 Z"
              fill={strokeColor}
            />
          </svg>

          {/* Soaring falcon high in the sky */}
          <motion.div
            className="absolute top-14 left-0 pointer-events-none opacity-55"
            animate={
              animateAllowed
                ? {
                    x: ["-10vw", "105vw"],
                    y: [15, 40, 10, 25],
                  }
                : false
            }
            transition={{ duration: 58, repeat: Infinity, ease: "linear", delay: 1 }}
          >
            <svg viewBox="0 0 60 25" className="w-12 h-6">
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
