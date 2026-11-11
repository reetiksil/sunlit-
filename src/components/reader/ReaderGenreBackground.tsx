"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import type { GenreSlug, ReaderTheme, AnimationIntensity } from "@/types";

export type GenrePreset =
  | "fantasy"
  | "romance"
  | "mystery"
  | "sci-fi"
  | "slice-of-life"
  | "horror"
  | "poetry"
  | "children"
  | "historical"
  | "neutral";

interface ReaderGenreBackgroundProps {
  genres?: (GenreSlug | string)[];
  theme?: ReaderTheme;
  isDark?: boolean;
  intensity?: AnimationIntensity;
}

function matchSingleGenre(raw: string): GenrePreset | null {
  const g = raw.toLowerCase().trim();
  if (!g) return null;
  if (g.includes("fantasy") || g.includes("magic") || g.includes("myth") || g.includes("arcane")) return "fantasy";
  if (g.includes("romance") || g.includes("romantic") || g.includes("love") || g.includes("shoujo")) return "romance";
  if (g.includes("mystery") || g.includes("detective") || g.includes("thriller") || g.includes("crime") || g.includes("suspense") || g.includes("noir")) return "mystery";
  if (g.includes("sci") || g.includes("space") || g.includes("cyberpunk") || g.includes("futur") || g.includes("galaxy")) return "sci-fi";
  if (g.includes("horror") || g.includes("gothic") || g.includes("dark") || g.includes("terror") || g.includes("supernatural") || g.includes("paranormal")) return "horror";
  if (g.includes("poetry") || g.includes("philosophy") || g.includes("philosophical") || g.includes("verse") || g.includes("spiritual")) return "poetry";
  if (g.includes("child") || g.includes("fairy") || g.includes("fable") || g.includes("kid") || g.includes("ya") || g.includes("young-adult")) return "children";
  if (g.includes("historic") || g.includes("period") || g.includes("classic") || g.includes("victorian") || g.includes("ancient") || g.includes("adventure")) return "historical";
  if (g.includes("slice") || g.includes("cozy") || g.includes("life") || g.includes("contemporary") || g.includes("drama")) return "slice-of-life";
  return null;
}

/**
 * Resolves the primary genre preset from book metadata with a calm neutral fallback.
 */
export function detectGenrePreset(genres: (GenreSlug | string)[] = []): GenrePreset {
  if (!Array.isArray(genres) || !genres.length) return "neutral";
  for (const item of genres) {
    const matched = matchSingleGenre(String(item));
    if (matched) return matched;
  }
  return "neutral";
}

export function ReaderGenreBackground({
  genres = [],
  theme = "day",
  isDark = false,
  intensity = "ambient",
}: ReaderGenreBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  // Mount inside document.body (or a fullscreen sub-element if non-root), so animations never disappear or unmount in fullscreen mode
  useEffect(() => {
    const updateTarget = () => {
      const fs = document.fullscreenElement as HTMLElement | null;
      setPortalNode(fs && fs !== document.documentElement ? fs : document.body);
    };
    updateTarget();
    document.addEventListener("fullscreenchange", updateTarget);
    return () => document.removeEventListener("fullscreenchange", updateTarget);
  }, []);

  // Pause animations cleanly when tab is hidden
  useEffect(() => {
    const handleVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const preset = useMemo(() => detectGenrePreset(genres), [genres]);
  const isNight = isDark || theme === "night" || theme === "true-dark";
  const animateAllowed = !shouldReduceMotion && isTabVisible;

  if (intensity === "off" || !portalNode) {
    return null;
  }

  const rootOpacity = intensity === "subtle" ? 0.5 : 1;

  // Seamless dark / light theme palette adapting smoothly across transitions
  const palette = {
    silhouette: isNight ? "rgba(226, 232, 240, 0.16)" : "rgba(65, 48, 25, 0.13)",
    silhouetteSoft: isNight ? "rgba(203, 213, 225, 0.11)" : "rgba(75, 58, 35, 0.09)",
    accentGold: isNight ? "#FCD34D" : "#E6A832",
    accentRose: isNight ? "#F9A8D4" : "#E27D99",
    accentViolet: isNight ? "#C4B5FD" : "#8B6FC9",
    accentCyan: isNight ? "#67E8F9" : "#4A90B8",
    accentSage: isNight ? "#86EFAC" : "#5F8D70",
    accentBurgundy: isNight ? "#FDA4AF" : "#9F4554",
    cloudFill: isNight ? "rgba(30, 41, 59, 0.45)" : "rgba(255, 255, 255, 0.75)",
    breezeStroke: isNight ? "rgba(148, 163, 184, 0.16)" : "rgba(180, 130, 60, 0.22)",
  };

  const transitionStyle: React.CSSProperties = {
    transition: "color 500ms ease, fill 500ms ease, stroke 500ms ease, opacity 500ms ease",
  };

  return createPortal(
    <div
      key={preset}
      aria-hidden="true"
      className="reader-genre-bg pointer-events-none fixed inset-0 z-[1] h-screen w-screen overflow-hidden select-none"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 1,
        overflow: "hidden",
        backgroundColor: "transparent",
        opacity: rootOpacity,
        transition: "opacity 500ms ease",
      }}
    >
      {/* ================================================================== */}
      {/* 1. FANTASY: Clean Gliding Dragon Silhouette + Muted Ember Motes    */}
      {/* ================================================================== */}
      {preset === "fantasy" && (
        <>
          {/* Soft high breeze current */}
          <motion.svg
            viewBox="0 0 1200 180"
            animate={animateAllowed ? { x: [-40, 40, -40] } : false}
            transition={{ duration: 48, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-14 left-0 w-[130vw] max-w-none h-40 opacity-75"
          >
            <path
              d="M 0 90 Q 250 40 520 85 T 1040 75 T 1200 95"
              fill="none"
              stroke={palette.breezeStroke}
              strokeWidth="1.4"
              strokeDasharray="10 16"
              strokeLinecap="round"
              style={transitionStyle}
            />
          </motion.svg>

          {/* Clean Gliding Dragon Silhouette with Soft Wing Beat & Warm Flame Wisp */}
          <motion.div
            animate={
              animateAllowed
                ? {
                    x: ["108vw", "-24vw"],
                    y: [36, 18, 52, 26],
                  }
                : { x: "55vw", y: 30 }
            }
            transition={{ duration: 64, repeat: Infinity, ease: "linear", delay: 1 }}
            className="absolute top-12 left-0 w-52 h-28"
          >
            <svg viewBox="0 0 240 120" className="w-full h-full -scale-x-100">
              <defs>
                <linearGradient id="readerDragonFlame" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor={palette.accentGold} stopOpacity="0.65" />
                  <stop offset="50%" stopColor={palette.accentRose} stopOpacity="0.35" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Wing */}
              <motion.path
                animate={
                  animateAllowed
                    ? {
                        d: [
                          "M 110 55 C 100 20 135 5 155 0 C 145 25 175 25 185 10 C 170 35 195 38 190 60 C 150 50 125 52 110 55 Z",
                          "M 110 55 C 95 35 125 25 145 20 C 135 40 165 42 175 30 C 160 50 185 52 180 65 C 145 56 122 55 110 55 Z",
                          "M 110 55 C 100 20 135 5 155 0 C 145 25 175 25 185 10 C 170 35 195 38 190 60 C 150 50 125 52 110 55 Z",
                        ],
                      }
                    : undefined
                }
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                fill={palette.silhouette}
                style={transitionStyle}
              />
              {/* Serpentine Body & Tail */}
              <path
                fill={palette.silhouette}
                style={transitionStyle}
                d="M 12 48 Q 25 46 32 40 Q 28 35 20 34 Q 35 32 46 37 Q 55 42 70 48 Q 90 52 110 56 Q 130 58 145 64 Q 165 72 180 70 Q 195 68 205 78 Q 215 88 210 98 Q 200 102 190 92 Q 185 85 198 84 Q 180 82 165 76 Q 140 70 120 64 Q 85 58 60 54 Q 45 50 30 52 L 12 50 Z"
              />
              {/* Horns */}
              <path fill={palette.silhouette} style={transitionStyle} d="M 32 38 Q 42 28 48 24 Q 44 32 42 36 Z" />
              {/* Soft Ember Breath */}
              <motion.path
                animate={
                  animateAllowed
                    ? { opacity: [0, 0.7, 0.85, 0.2, 0], scaleX: [0.6, 1.3, 1.5, 1.7, 1.2], x: [-4, -12, -20, -28, -36] }
                    : false
                }
                transition={{ duration: 6, repeat: Infinity, ease: "easeOut", repeatDelay: 3 }}
                d="M 12 49 Q -15 42 -35 48 Q -15 56 12 51 Z"
                fill="url(#readerDragonFlame)"
              />
            </svg>
          </motion.div>

          {/* 3 Quiet Firefly Motes */}
          {[
            { id: "fm1", left: "9%", top: "30%", c: palette.accentGold, dur: 18, delay: 0 },
            { id: "fm2", left: "89%", top: "60%", c: palette.accentViolet, dur: 22, delay: 4 },
            { id: "fm3", left: "12%", top: "76%", c: palette.accentSage, dur: 20, delay: 8 },
          ].map((m) => (
            <motion.div
              key={m.id}
              className="absolute h-2.5 w-2.5 rounded-full"
              style={{
                left: m.left,
                top: m.top,
                background: `radial-gradient(circle, ${m.c} 0%, transparent 75%)`,
              }}
              animate={animateAllowed ? { y: [0, -28, 12, 0], x: [0, 18, -12, 0], opacity: [0.2, 0.65, 0.2] } : { opacity: 0.4 }}
              transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </>
      )}

      {/* ================================================================== */}
      {/* 2. ROMANCE: Paired Songbirds Gliding + Soft Drifting Blossoms      */}
      {/* ================================================================== */}
      {preset === "romance" && (
        <>
          {/* Paired Minimal Songbird Silhouettes */}
          <motion.div
            animate={animateAllowed ? { x: ["-16vw", "112vw"], y: [45, 22, 50, 28] } : { x: "30vw", y: 35 }}
            transition={{ duration: 54, repeat: Infinity, ease: "linear" }}
            className="absolute top-16 left-0 flex items-center gap-6"
          >
            <svg viewBox="0 0 80 40" className="w-16 h-8">
              <path
                fill={palette.silhouette}
                style={transitionStyle}
                d="M 8 24 Q 26 8 42 18 Q 58 8 72 22 Q 52 16 42 23 Q 26 16 8 24 Z"
              />
            </svg>
            <svg viewBox="0 0 80 40" className="w-12 h-6 translate-y-4">
              <path
                fill={palette.silhouetteSoft}
                style={transitionStyle}
                d="M 8 24 Q 26 8 42 18 Q 58 8 72 22 Q 52 16 42 23 Q 26 16 8 24 Z"
              />
            </svg>
          </motion.div>

          {/* 4 Minimal Pastel Petals Drifting Slowly in Outer Margins */}
          {[
            { id: "rp1", left: "7%", dur: 22, delay: 0 },
            { id: "rp2", left: "90%", dur: 27, delay: 5 },
            { id: "rp3", left: "13%", dur: 25, delay: 11 },
            { id: "rp4", left: "86%", dur: 29, delay: 16 },
          ].map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{ left: p.left, top: "-4%" }}
              animate={
                animateAllowed
                  ? {
                      y: ["-4vh", "105vh"],
                      x: [0, 32, -22, 12],
                      rotate: [0, 140, 280],
                      opacity: [0, 0.55, 0.65, 0],
                    }
                  : { opacity: 0.4 }
              }
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path
                  d="M12 3 C17 7, 19 14, 12 21 C5 14, 7 7, 12 3 Z"
                  fill={palette.accentRose}
                  fillOpacity="0.65"
                  style={transitionStyle}
                />
              </svg>
            </motion.div>
          ))}
        </>
      )}

      {/* ================================================================== */}
      {/* 3. MYSTERY: Silent Night Owl Gliding + Horizon Breeze Line         */}
      {/* ================================================================== */}
      {preset === "mystery" && (
        <>
          <motion.svg
            viewBox="0 0 1200 180"
            animate={animateAllowed ? { x: [40, -40, 40] } : false}
            transition={{ duration: 46, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-8 left-0 w-[130vw] max-w-none h-36 opacity-65"
          >
            <path
              d="M 0 110 Q 300 60 600 100 T 1200 85"
              fill="none"
              stroke={palette.breezeStroke}
              strokeWidth="1.4"
              strokeDasharray="8 16"
              style={transitionStyle}
            />
          </motion.svg>

          {/* Silent Night Owl Silhouette */}
          <motion.div
            animate={animateAllowed ? { x: ["108vw", "-20vw"], y: [40, 18, 45, 25] } : { x: "60vw", y: 30 }}
            transition={{ duration: 58, repeat: Infinity, ease: "linear" }}
            className="absolute top-16 left-0 w-36 h-20"
          >
            <svg viewBox="0 0 160 80" className="w-full h-full">
              <motion.path
                animate={
                  animateAllowed
                    ? {
                        d: [
                          "M 80 42 C 55 15 25 8 6 20 C 28 24 45 34 64 46 Q 80 54 96 46 C 115 34 132 24 154 20 C 135 8 105 15 80 42 Z",
                          "M 80 44 C 55 28 25 32 8 44 C 30 40 48 44 64 48 Q 80 54 96 48 C 112 44 130 40 152 44 C 135 32 105 28 80 44 Z",
                          "M 80 42 C 55 15 25 8 6 20 C 28 24 45 34 64 46 Q 80 54 96 46 C 115 34 132 24 154 20 C 135 8 105 15 80 42 Z",
                        ],
                      }
                    : undefined
                }
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                fill={palette.silhouette}
                style={transitionStyle}
              />
              {/* Soft Owl Body */}
              <ellipse cx="80" cy="46" rx="10" ry="6" fill={palette.silhouette} style={transitionStyle} />
            </svg>
          </motion.div>

          {/* 3 Muted Amber Motes */}
          {[
            { id: "mm1", left: "10%", top: "36%", dur: 22, delay: 0 },
            { id: "mm2", left: "89%", top: "68%", dur: 26, delay: 5 },
          ].map((m) => (
            <motion.div
              key={m.id}
              className="absolute h-2 w-2 rounded-full"
              style={{
                left: m.left,
                top: m.top,
                background: `radial-gradient(circle, ${palette.accentGold} 0%, transparent 75%)`,
              }}
              animate={animateAllowed ? { y: [0, -24, 10, 0], opacity: [0.2, 0.6, 0.2] } : { opacity: 0.4 }}
              transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </>
      )}

      {/* ================================================================== */}
      {/* 4. SCI-FI: Minimalist Gliding Starship + Clean Twinkling Stars     */}
      {/* ================================================================== */}
      {preset === "sci-fi" && (
        <>
          {/* Clean Twinkling Stars in Outer Margins */}
          {[
            { id: "sc1", left: "8%", top: "18%", size: 4, dur: 5, delay: 0 },
            { id: "sc2", left: "91%", top: "24%", size: 3.5, dur: 6.5, delay: 1.5 },
            { id: "sc3", left: "12%", top: "66%", size: 4, dur: 5.8, delay: 2.5 },
            { id: "sc4", left: "88%", top: "74%", size: 3.5, dur: 7, delay: 0.8 },
            { id: "sc5", left: "6%", top: "44%", size: 3, dur: 6, delay: 3.2 },
          ].map((st) => (
            <motion.span
              key={st.id}
              className="absolute rounded-full"
              style={{
                left: st.left,
                top: st.top,
                width: st.size,
                height: st.size,
                backgroundColor: palette.accentCyan,
                ...transitionStyle,
              }}
              animate={animateAllowed ? { opacity: [0.15, 0.75, 0.15], scale: [0.85, 1.25, 0.85] } : { opacity: 0.45 }}
              transition={{ duration: st.dur, delay: st.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          {/* Gliding Minimal Paper-Voyager Vessel */}
          <motion.div
            animate={animateAllowed ? { x: ["-15vw", "112vw"], y: [70, 35, 60, 30] } : { x: "35vw", y: 40 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-16 left-0 w-36 h-12"
          >
            <svg viewBox="0 0 180 60" className="w-full h-full">
              <defs>
                <linearGradient id="readerCometTrail" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="100%" stopColor={palette.accentCyan} stopOpacity="0.45" />
                </linearGradient>
              </defs>
              <path d="M 0 30 L 110 28 L 110 32 Z" fill="url(#readerCometTrail)" />
              <path
                d="M 110 30 L 165 30 L 112 18 L 122 30 L 112 42 Z"
                fill={palette.silhouette}
                style={transitionStyle}
              />
            </svg>
          </motion.div>
        </>
      )}

      {/* ================================================================== */}
      {/* 5. SLICE OF LIFE / LITERARY: Swaying Botanical Sprig + Songbird    */}
      {/* ================================================================== */}
      {preset === "slice-of-life" && (
        <>
          {/* Clean Botanical Sprig swaying gently in top-left corner */}
          <motion.svg
            viewBox="0 0 280 200"
            className="absolute -top-2 -left-4 w-72 h-52"
            animate={animateAllowed ? { rotate: [-1.5, 2, -1.5] } : false}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "top left" }}
          >
            <path
              d="M -10 10 Q 75 35 145 78 T 240 120 M 95 52 Q 140 32 185 30 M 65 34 Q 100 80 135 108"
              fill="none"
              stroke={palette.silhouette}
              strokeWidth="2.4"
              strokeLinecap="round"
              style={transitionStyle}
            />
            <ellipse cx="145" cy="78" rx="10" ry="5" transform="rotate(-20 145 78)" fill={palette.accentSage} fillOpacity="0.45" style={transitionStyle} />
            <ellipse cx="185" cy="30" rx="10" ry="5" transform="rotate(-10 185 30)" fill={palette.accentSage} fillOpacity="0.4" style={transitionStyle} />
            <ellipse cx="240" cy="120" rx="11" ry="5" transform="rotate(15 240 120)" fill={palette.accentGold} fillOpacity="0.45" style={transitionStyle} />
            <ellipse cx="135" cy="108" rx="9" ry="4.5" transform="rotate(35 135 108)" fill={palette.accentSage} fillOpacity="0.45" style={transitionStyle} />
          </motion.svg>

          {/* Calm Songbird Gliding Across Sky */}
          <motion.div
            animate={animateAllowed ? { x: ["-12vw", "110vw"], y: [25, 45, 20, 35] } : { x: "40vw", y: 30 }}
            transition={{ duration: 52, repeat: Infinity, ease: "linear", delay: 2 }}
            className="absolute top-16 left-0 w-14 h-8"
          >
            <svg viewBox="0 0 60 30" className="w-full h-full">
              <path
                d="M 5 20 Q 20 5 35 15 Q 50 5 55 20 Q 40 12 35 18 Q 20 12 5 20 Z"
                fill={palette.silhouette}
                style={transitionStyle}
              />
            </svg>
          </motion.div>

          {/* 2 Drifting Autumn Leaves */}
          {[
            { id: "sl1", left: "88%", dur: 24, delay: 2 },
            { id: "sl2", left: "10%", dur: 29, delay: 11 },
          ].map((lf) => (
            <motion.div
              key={lf.id}
              className="absolute"
              style={{ left: lf.left, top: "-4%" }}
              animate={
                animateAllowed
                  ? { y: ["-4vh", "105vh"], x: [0, 28, -20, 10], rotate: [0, 120, 260], opacity: [0, 0.55, 0.6, 0] }
                  : { opacity: 0.4 }
              }
              transition={{ duration: lf.dur, delay: lf.delay, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path
                  d="M12 2 C17 7, 18 15, 12 21 C6 15, 7 7, 12 2 Z"
                  fill={palette.accentGold}
                  fillOpacity="0.55"
                  style={transitionStyle}
                />
              </svg>
            </motion.div>
          ))}
        </>
      )}

      {/* ================================================================== */}
      {/* 6. HORROR / GOTHIC: Silent Raven + Clean Crescent Moon             */}
      {/* ================================================================== */}
      {preset === "horror" && (
        <>
          {/* Clean Soft Crescent Moon in Upper Right */}
          <svg viewBox="0 0 100 100" className="absolute top-12 right-[10%] h-12 w-12 opacity-40">
            <path
              d="M 50 12 A 38 38 0 1 0 88 50 A 30 30 0 1 1 50 12 Z"
              fill={isNight ? "#E2E8F0" : "#64748B"}
              style={transitionStyle}
            />
          </svg>

          {/* Subtle Horizon Mist Curve */}
          <motion.svg
            viewBox="0 0 800 120"
            animate={animateAllowed ? { x: [-30, 30, -30] } : false}
            transition={{ duration: 42, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-full h-24 opacity-45"
          >
            <path d="M 0 80 Q 220 35 440 70 T 800 55 L 800 120 L 0 120 Z" fill={palette.silhouetteSoft} style={transitionStyle} />
          </motion.svg>

          {/* Gliding Raven Silhouette */}
          <motion.div
            animate={animateAllowed ? { x: ["108vw", "-18vw"], y: [24, 42, 20, 36] } : { x: "55vw", y: 30 }}
            transition={{ duration: 56, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 left-0 w-24 h-12"
          >
            <svg viewBox="0 0 100 50" className="w-full h-full">
              <path
                d="M 8 28 Q 32 10 50 22 Q 68 10 92 28 Q 68 20 50 28 Q 32 20 8 28 Z"
                fill={palette.silhouette}
                style={transitionStyle}
              />
            </svg>
          </motion.div>
        </>
      )}

      {/* ================================================================== */}
      {/* 7. POETRY / PHILOSOPHY: Paper Crane Silhouette + Breeze Line       */}
      {/* ================================================================== */}
      {preset === "poetry" && (
        <>
          <motion.svg
            viewBox="0 0 1200 180"
            animate={animateAllowed ? { x: [-35, 35, -35] } : false}
            transition={{ duration: 44, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-28 left-0 w-[130vw] max-w-none h-40 opacity-65"
          >
            <path
              d="M 0 80 Q 300 120 620 75 T 1200 90"
              fill="none"
              stroke={palette.accentViolet}
              strokeOpacity="0.25"
              strokeWidth="1.2"
              strokeDasharray="6 14"
              style={transitionStyle}
            />
          </motion.svg>

          {/* Minimal Origami Crane Gliding Serenely */}
          <motion.div
            animate={animateAllowed ? { x: ["-15vw", "112vw"], y: [30, 52, 25, 42] } : { x: "40vw", y: 36 }}
            transition={{ duration: 58, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 left-0 w-20 h-14"
          >
            <svg viewBox="0 0 100 70" className="w-full h-full">
              <polygon points="15,40 48,38 35,10" fill={palette.silhouette} style={transitionStyle} />
              <polygon points="48,38 78,24 90,26 62,44" fill={palette.silhouette} style={transitionStyle} />
              <polygon points="24,42 52,42 36,60" fill={palette.silhouetteSoft} style={transitionStyle} />
            </svg>
          </motion.div>

          {[
            { id: "po1", left: "10%", top: "40%", c: palette.accentViolet, dur: 20, delay: 0 },
            { id: "po2", left: "88%", top: "65%", c: palette.accentCyan, dur: 24, delay: 6 },
          ].map((m) => (
            <motion.div
              key={m.id}
              className="absolute h-2.5 w-2.5 rounded-full"
              style={{ left: m.left, top: m.top, background: `radial-gradient(circle, ${m.c} 0%, transparent 75%)` }}
              animate={animateAllowed ? { y: [0, -24, 12, 0], opacity: [0.2, 0.6, 0.2] } : { opacity: 0.4 }}
              transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </>
      )}

      {/* ================================================================== */}
      {/* 8. CHILDREN'S FICTION: Noble Griffin Silhouette + Storybook Clouds */}
      {/* ================================================================== */}
      {preset === "children" && (
        <>
          {/* Clean Soft Drifting Storybook Clouds */}
          <motion.svg
            viewBox="0 0 700 220"
            animate={animateAllowed ? { x: [-30, 40, -30] } : false}
            transition={{ duration: 55, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-8 -left-12 h-40 w-[34rem] opacity-55"
          >
            <path
              fill={palette.cloudFill}
              style={transitionStyle}
              d="M 60 160 Q 40 130 75 110 Q 95 80 145 90 Q 185 45 250 60 Q 315 35 375 70 Q 440 55 485 95 Q 545 90 565 130 Q 610 145 590 175 Q 570 200 520 195 L 80 195 Z"
            />
          </motion.svg>

          {/* Soaring Griffin with Soft Feathers */}
          <motion.div
            animate={animateAllowed ? { x: ["-20vw", "115vw"], y: [45, 70, 35, 60] } : { x: "35vw", y: 50 }}
            transition={{ duration: 72, repeat: Infinity, ease: "linear", delay: 1 }}
            className="absolute top-16 left-0 w-44 h-24"
          >
            <svg viewBox="0 0 200 110" className="w-full h-full">
              <path
                fill={palette.silhouette}
                style={transitionStyle}
                d="M 175 42 Q 185 45 192 48 Q 182 52 176 53 Q 165 58 152 56 Q 140 54 125 58 Q 110 65 95 68 Q 80 70 70 76 Q 60 84 52 82 Q 48 76 56 72 Q 68 68 80 62 Q 95 56 115 52 Q 135 48 150 44 Q 165 38 175 42 Z"
              />
              <path
                fill="none"
                stroke={palette.silhouette}
                strokeWidth="2.5"
                strokeLinecap="round"
                style={transitionStyle}
                d="M 52 82 Q 35 90 28 80 Q 22 70 30 62"
              />
              <circle cx="30" cy="62" r="3.5" fill={palette.silhouette} style={transitionStyle} />
              <path fill={palette.silhouette} style={transitionStyle} d="M 176 42 Q 186 35 194 40 Q 198 42 190 46 Q 182 48 176 45 Z" />
              <motion.path
                animate={
                  animateAllowed
                    ? {
                        d: [
                          "M 130 52 C 120 18 100 0 75 2 C 85 22 70 28 55 25 C 72 38 65 48 60 62 C 85 58 110 55 130 52 Z",
                          "M 130 52 C 122 30 108 18 88 18 C 94 32 82 36 70 35 C 84 44 78 52 72 62 C 92 58 112 55 130 52 Z",
                          "M 130 52 C 120 18 100 0 75 2 C 85 22 70 28 55 25 C 72 38 65 48 60 62 C 85 58 110 55 130 52 Z",
                        ],
                      }
                    : undefined
                }
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                fill={palette.silhouette}
                style={transitionStyle}
              />
            </svg>
          </motion.div>
        </>
      )}

      {/* ================================================================== */}
      {/* 9. HISTORICAL / ADVENTURE: Horizon Ridge + Soaring Falcon          */}
      {/* ================================================================== */}
      {preset === "historical" && (
        <>
          {/* Clean Distant Horizon Ridge */}
          <svg viewBox="0 0 800 120" className="absolute bottom-0 left-0 w-full h-28 opacity-45">
            <path
              d="M 0 120 L 0 78 L 130 42 L 240 82 L 380 28 L 510 76 L 650 38 L 760 72 L 800 50 L 800 120 Z"
              fill={palette.silhouetteSoft}
              style={transitionStyle}
            />
          </svg>

          {/* Soaring Falcon High in Sky */}
          <motion.div
            animate={animateAllowed ? { x: ["-14vw", "112vw"], y: [25, 45, 18, 34] } : { x: "38vw", y: 28 }}
            transition={{ duration: 56, repeat: Infinity, ease: "linear", delay: 1 }}
            className="absolute top-14 left-0 w-16 h-8"
          >
            <svg viewBox="0 0 60 25" className="w-full h-full">
              <path
                d="M 5 18 Q 20 2 30 12 Q 40 2 55 18 Q 38 10 30 15 Q 22 10 5 18 Z"
                fill={palette.silhouette}
                style={transitionStyle}
              />
            </svg>
          </motion.div>

          {/* Warm Antique Sun Motes */}
          {[
            { id: "hm1", left: "10%", top: "28%", dur: 22, delay: 0 },
            { id: "hm2", left: "90%", top: "62%", dur: 26, delay: 5 },
          ].map((m) => (
            <motion.div
              key={m.id}
              className="absolute h-2.5 w-2.5 rounded-full"
              style={{
                left: m.left,
                top: m.top,
                background: `radial-gradient(circle, ${palette.accentGold} 0%, transparent 75%)`,
              }}
              animate={animateAllowed ? { y: [0, -24, 12, 0], opacity: [0.25, 0.65, 0.25] } : { opacity: 0.45 }}
              transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </>
      )}

      {/* ================================================================== */}
      {/* 10. NEUTRAL: Tranquil Songbird + Gentle Breeze Current             */}
      {/* ================================================================== */}
      {preset === "neutral" && (
        <>
          <motion.svg
            viewBox="0 0 1200 180"
            animate={animateAllowed ? { x: [-35, 35, -35] } : false}
            transition={{ duration: 48, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-0 w-[130vw] max-w-none h-40 opacity-65"
          >
            <path
              d="M 0 90 Q 250 45 520 85 T 1040 75 T 1200 95"
              fill="none"
              stroke={palette.breezeStroke}
              strokeWidth="1.3"
              strokeDasharray="8 16"
              style={transitionStyle}
            />
          </motion.svg>

          <motion.div
            animate={animateAllowed ? { x: ["-12vw", "110vw"], y: [25, 42, 20, 34] } : { x: "42vw", y: 30 }}
            transition={{ duration: 54, repeat: Infinity, ease: "linear" }}
            className="absolute top-16 left-0 w-14 h-8"
          >
            <svg viewBox="0 0 60 30" className="w-full h-full">
              <path
                d="M 5 20 Q 20 5 35 15 Q 50 5 55 20 Q 40 12 35 18 Q 20 12 5 20 Z"
                fill={palette.silhouette}
                style={transitionStyle}
              />
            </svg>
          </motion.div>
        </>
      )}
    </div>,
    portalNode
  );
}
