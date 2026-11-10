"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";

const STARS = [
  { id: 1, top: "10%", left: "14%", size: 2, delay: 0 },
  { id: 2, top: "22%", left: "78%", size: 2.5, delay: 1.4 },
  { id: 3, top: "8%", left: "48%", size: 2, delay: 2.8 },
  { id: 4, top: "34%", left: "92%", size: 1.8, delay: 0.7 },
  { id: 5, top: "42%", left: "8%", size: 2.5, delay: 3.2 },
  { id: 6, top: "16%", left: "32%", size: 2, delay: 4.1 },
  { id: 7, top: "58%", left: "86%", size: 2, delay: 1.9 },
  { id: 8, top: "26%", left: "64%", size: 2.2, delay: 2.2 },
  { id: 9, top: "18%", left: "88%", size: 1.5, delay: 3.8 },
  { id: 10, top: "48%", left: "25%", size: 2, delay: 1.1 },
];

export function AmbientBackground() {
  const { resolvedTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    const handleVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  if (!mounted) return null;
  const isDark = resolvedTheme === "dark";
  const animateAllowed = !shouldReduceMotion && isTabVisible;

  // Theme-aware color palettes
  const silhouetteColor = isDark ? "rgba(226, 232, 240, 0.16)" : "rgba(55, 40, 20, 0.12)";
  const griffinColor = isDark ? "rgba(203, 213, 225, 0.14)" : "rgba(65, 48, 25, 0.11)";
  const windStroke = isDark ? "rgba(148, 163, 184, 0.15)" : "rgba(217, 163, 76, 0.22)";
  const featherFill = isDark ? "rgba(241, 245, 249, 0.3)" : "rgba(180, 130, 60, 0.35)";

  return (
    <div
      aria-hidden="true"
      className="ambient-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. Celestial Ambience & Ambient Glows (Light & Dark)          */}
      {/* ------------------------------------------------------------- */}
      {/* Primary Warm Sunbeam / Twilight Aurora */}
      <motion.div
        animate={
          animateAllowed
            ? {
                x: [0, 35, -25, 0],
                y: [0, -25, 20, 0],
                scale: [1, 1.05, 0.98, 1],
              }
            : false
        }
        transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-40"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(255, 210, 138, 0.18) 0%, rgba(30, 41, 59, 0.05) 70%, transparent 100%)"
            : "radial-gradient(circle, rgba(246, 185, 76, 0.32) 0%, rgba(253, 241, 220, 0.5) 50%, transparent 80%)",
        }}
      />

      {/* Secondary Sky / Twilight Drift */}
      <motion.div
        animate={
          animateAllowed
            ? {
                x: [0, -45, 25, 0],
                y: [0, 30, -20, 0],
              }
            : false
        }
        transition={{ duration: 52, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 -right-28 h-[34rem] w-[34rem] rounded-full blur-3xl opacity-35"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(127, 181, 230, 0.16) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(142, 201, 232, 0.30) 0%, rgba(247, 183, 163, 0.20) 55%, transparent 75%)",
        }}
      />

      {/* Light Mode: Morning Sun Corona */}
      {!isDark && (
        <div
          className="absolute top-8 right-[12%] h-36 w-36 rounded-full opacity-35 blur-2xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #F6B94C 0%, #FFF3D6 45%, transparent 70%)" }}
        />
      )}

      {/* Dark Mode: Moon Glow & Celestial Stars */}
      {isDark && (
        <>
          <div
            className="absolute top-12 right-[12%] h-28 w-28 rounded-full opacity-30 blur-xl"
            style={{ background: "radial-gradient(circle, #FFD28A 0%, rgba(255, 210, 138, 0.2) 50%, transparent 75%)" }}
          />
          {/* Crescent Moon Silhouette */}
          <svg
            viewBox="0 0 100 100"
            className="absolute top-14 right-[13.5%] h-12 w-12 opacity-40 drop-shadow-sm"
          >
            <path
              d="M 50 10 A 40 40 0 1 0 90 50 A 32 32 0 1 1 50 10 Z"
              fill="#FFD28A"
            />
          </svg>

          {STARS.map((star) => (
            <motion.span
              key={star.id}
              animate={animateAllowed ? { opacity: [0.15, 0.85, 0.15], scale: [0.9, 1.2, 0.9] } : { opacity: 0.5 }}
              transition={{
                duration: 5,
                delay: star.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
              }}
              className="absolute rounded-full bg-primary"
            />
          ))}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. Layered Drifting Clouds (Both Light & Dark Mode)          */}
      {/* ------------------------------------------------------------- */}
      {/* Cloud 1: High Cumulus Cloud Bank (Left Horizon) */}
      <motion.svg
        viewBox="0 0 700 220"
        animate={animateAllowed ? { x: [-30, 45, -30] } : false}
        transition={{ duration: 55, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 -left-12 h-44 w-[38rem] opacity-45 dark:opacity-20 drop-shadow-sm"
      >
        <path
          fill={isDark ? "#1E293B" : "#FFFFFF"}
          d="M 60 160 Q 40 130 75 110 Q 95 80 145 90 Q 185 45 250 60 Q 315 35 375 70 Q 440 55 485 95 Q 545 90 565 130 Q 610 145 590 175 Q 570 200 520 195 L 80 195 Z"
        />
      </motion.svg>

      {/* Cloud 2: Gentle Peach/Violet Drift (Center/Right Horizon) */}
      <motion.svg
        viewBox="0 0 650 200"
        animate={animateAllowed ? { x: [35, -40, 35] } : false}
        transition={{ duration: 62, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-28 right-4 h-40 w-[34rem] opacity-40 dark:opacity-15 drop-shadow-sm"
      >
        <path
          fill={isDark ? "#2A3756" : "#FDF1DC"}
          d="M 80 140 Q 60 100 110 85 Q 140 50 200 65 Q 260 30 320 60 Q 380 40 430 75 Q 490 70 510 110 Q 550 125 540 155 L 90 155 Z"
        />
      </motion.svg>

      {/* Cloud 3: Lower Ethereal Cloud Layer */}
      <motion.svg
        viewBox="0 0 800 180"
        animate={animateAllowed ? { x: [-20, 30, -20] } : false}
        transition={{ duration: 70, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-72 left-1/3 h-32 w-[42rem] opacity-30 dark:opacity-10"
      >
        <path
          fill={isDark ? "#1D2742" : "#FFF7EB"}
          d="M 50 120 Q 30 90 80 75 Q 120 40 180 55 Q 250 25 320 50 Q 390 35 450 65 Q 520 50 580 85 Q 640 80 660 115 L 60 120 Z"
        />
      </motion.svg>

      {/* ------------------------------------------------------------- */}
      {/* 3. Subtle & Soothing Wind Breeze Currents                     */}
      {/* ------------------------------------------------------------- */}
      <motion.svg
        viewBox="0 0 1200 300"
        animate={animateAllowed ? { x: [-60, 60, -60] } : false}
        transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-24 left-0 w-[140vw] max-w-none h-60 opacity-60"
      >
        {/* Breeze Streamline 1 */}
        <path
          d="M 0 100 Q 200 50 420 90 T 840 80 T 1200 110"
          fill="none"
          stroke={windStroke}
          strokeWidth="1.6"
          strokeDasharray="12 18"
          strokeLinecap="round"
        />
        {/* Breeze Streamline 2 (Graceful swirl) */}
        <path
          d="M 120 180 Q 320 130 520 170 Q 640 195 720 160 Q 750 140 730 125 Q 700 125 710 145 Q 730 170 880 150 T 1200 165"
          fill="none"
          stroke={windStroke}
          strokeWidth="1.2"
          strokeDasharray="8 14"
          strokeLinecap="round"
        />
        {/* Breeze Streamline 3 (Distant high current) */}
        <path
          d="M 50 40 Q 300 10 550 45 T 1050 35"
          fill="none"
          stroke={windStroke}
          strokeWidth="1"
          strokeDasharray="6 20"
          strokeOpacity="0.7"
        />
      </motion.svg>

      {/* ------------------------------------------------------------- */}
      {/* 4. Fantastical Mythical Dragon with Ethereal Flame Wisp       */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        animate={
          animateAllowed
            ? {
                x: ["110vw", "-25vw"],
                y: [40, 20, 60, 30],
              }
            : false
        }
        transition={{
          duration: 68,
          repeat: Infinity,
          ease: "linear",
          delay: 2,
        }}
        className="absolute top-16 left-0 z-0 pointer-events-none"
      >
        <div className="relative w-52 h-28">
          {/* Dragon Silhouette SVG */}
          <svg
            viewBox="0 0 240 120"
            className="w-full h-full transform -scale-x-100"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.06))" }}
          >
            <defs>
              <linearGradient id="dragonBreath" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor={isDark ? "#FFD28A" : "#F6B94C"} stopOpacity="0.8" />
                <stop offset="40%" stopColor={isDark ? "#F43F5E" : "#F7B7A3"} stopOpacity="0.5" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Dragon Wings with subtle flapping motion */}
            <motion.path
              animate={animateAllowed ? { d: [
                "M 110 55 C 100 20 135 5 155 0 C 145 25 175 25 185 10 C 170 35 195 38 190 60 C 150 50 125 52 110 55 Z",
                "M 110 55 C 95 35 125 25 145 20 C 135 40 165 42 175 30 C 160 50 185 52 180 65 C 145 56 122 55 110 55 Z",
                "M 110 55 C 100 20 135 5 155 0 C 145 25 175 25 185 10 C 170 35 195 38 190 60 C 150 50 125 52 110 55 Z",
              ] } : undefined}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              fill={silhouetteColor}
            />

            {/* Dragon Head, Long Serpentine Neck, Torso & Looping Tail */}
            <path
              fill={silhouetteColor}
              d="M 12 48 Q 25 46 32 40 Q 28 35 20 34 Q 35 32 46 37 Q 55 42 70 48 Q 90 52 110 56 Q 130 58 145 64 Q 165 72 180 70 Q 195 68 205 78 Q 215 88 210 98 Q 200 102 190 92 Q 185 85 198 84 Q 180 82 165 76 Q 140 70 120 64 Q 85 58 60 54 Q 45 50 30 52 L 12 50 Z"
            />
            {/* Dragon Horns & Crest */}
            <path
              fill={silhouetteColor}
              d="M 32 38 Q 42 28 48 24 Q 44 32 42 36 Z"
            />

            {/* Gentle Dragon Fire Breath Wisp */}
            <motion.path
              animate={
                animateAllowed
                  ? {
                      opacity: [0, 0.75, 0.9, 0.2, 0],
                      scaleX: [0.6, 1.3, 1.6, 1.8, 1.2],
                      x: [-4, -12, -22, -32, -40],
                    }
                  : false
              }
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeOut",
                times: [0, 0.2, 0.45, 0.75, 1],
                repeatDelay: 2,
              }}
              d="M 12 49 Q -15 42 -35 48 Q -15 56 12 51 Z"
              fill="url(#dragonBreath)"
            />
          </svg>
        </div>
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 5. Noble Griffin Soaring with Falling Feather Breeze         */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        animate={
          animateAllowed
            ? {
                x: ["-20vw", "115vw"],
                y: [120, 150, 110, 140],
              }
            : false
        }
        transition={{
          duration: 76,
          repeat: Infinity,
          ease: "linear",
          delay: 14,
        }}
        className="absolute top-36 left-0 z-0 pointer-events-none"
      >
        <div className="relative w-44 h-24">
          {/* Griffin Silhouette SVG */}
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {/* Eagle-Lion Griffin Body */}
            <path
              fill={griffinColor}
              d="M 175 42 Q 185 45 192 48 Q 182 52 176 53 Q 165 58 152 56 Q 140 54 125 58 Q 110 65 95 68 Q 80 70 70 76 Q 60 84 52 82 Q 48 76 56 72 Q 68 68 80 62 Q 95 56 115 52 Q 135 48 150 44 Q 165 38 175 42 Z"
            />
            {/* Curved Feline Tail with tuft */}
            <path
              fill="none"
              stroke={griffinColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              d="M 52 82 Q 35 90 28 80 Q 22 70 30 62"
            />
            <circle cx="30" cy="62" r="3.5" fill={griffinColor} />

            {/* Eagle Head & Beak */}
            <path
              fill={griffinColor}
              d="M 176 42 Q 186 35 194 40 Q 198 42 190 46 Q 182 48 176 45 Z"
            />

            {/* Flapping Griffin Wings */}
            <motion.path
              animate={animateAllowed ? {
                d: [
                  "M 130 52 C 120 18 100 0 75 2 C 85 22 70 28 55 25 C 72 38 65 48 60 62 C 85 58 110 55 130 52 Z",
                  "M 130 52 C 122 30 108 18 88 18 C 94 32 82 36 70 35 C 84 44 78 52 72 62 C 92 58 112 55 130 52 Z",
                  "M 130 52 C 120 18 100 0 75 2 C 85 22 70 28 55 25 C 72 38 65 48 60 62 C 85 58 110 55 130 52 Z",
                ]
              } : undefined}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              fill={griffinColor}
            />
          </svg>

          {/* Drifting Loose Feathers Shed from the Griffin */}
          {[
            { id: "f1", startX: 70, startY: 60, dur: 12, delay: 0 },
            { id: "f2", startX: 85, startY: 55, dur: 14, delay: 3.5 },
            { id: "f3", startX: 60, startY: 65, dur: 11, delay: 6.8 },
          ].map((feather) => (
            <motion.div
              key={feather.id}
              animate={
                animateAllowed
                  ? {
                      x: [-feather.startX, -feather.startX - 80, -feather.startX - 150],
                      y: [feather.startY, feather.startY + 50, feather.startY + 110],
                      rotate: [0, 45, -30, 60],
                      opacity: [0, 0.75, 0.6, 0],
                    }
                  : false
              }
              transition={{
                duration: feather.dur,
                delay: feather.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute pointer-events-none"
              style={{ left: feather.startX, top: feather.startY }}
            >
              {/* Delicate Quill Feather Silhouette */}
              <svg viewBox="0 0 24 36" className="w-4 h-6">
                <path
                  d="M 12 2 C 16 8 18 18 14 28 L 12 34 L 10 28 C 6 18 8 8 12 2 Z"
                  fill={featherFill}
                />
                <line x1="12" y1="4" x2="12" y2="34" stroke={featherFill} strokeWidth="0.8" />
              </svg>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 6. Gentle Floating Storybook Motes & Golden Foliage Wisps     */}
      {/* ------------------------------------------------------------- */}
      {[
        { id: "m1", top: "25%", left: "20%", delay: 0, dur: 18 },
        { id: "m2", top: "45%", left: "60%", delay: 4, dur: 22 },
        { id: "m3", top: "70%", left: "35%", delay: 8, dur: 20 },
        { id: "m4", top: "35%", left: "80%", delay: 2, dur: 24 },
        { id: "m5", top: "60%", left: "15%", delay: 6, dur: 19 },
      ].map((mote) => (
        <motion.div
          key={mote.id}
          animate={
            animateAllowed
              ? {
                  x: [0, 30, -20, 0],
                  y: [0, -35, 15, 0],
                  opacity: [0.15, 0.55, 0.2, 0.15],
                  rotate: [0, 180, 360],
                }
              : false
          }
          transition={{
            duration: mote.dur,
            delay: mote.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: mote.top, left: mote.left }}
          className="absolute pointer-events-none"
        >
          {/* Subtle Golden Leaf / Starlight Particle */}
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: isDark
                ? "radial-gradient(circle, rgba(255, 210, 138, 0.45) 0%, transparent 80%)"
                : "radial-gradient(circle, rgba(246, 185, 76, 0.5) 0%, rgba(247, 183, 163, 0.2) 60%, transparent 80%)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
