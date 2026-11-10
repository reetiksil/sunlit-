"use client";

import React, { useState } from "react";
import { CoverStyle } from "@/types";

interface SvgCoverProps {
  title: string;
  author: string;
  styleConfig?: CoverStyle;
  coverImageUrl?: string;
  className?: string;
}

export function SvgCover({ title, author, styleConfig, coverImageUrl, className = "" }: SvgCoverProps) {
  const [imgError, setImgError] = useState(false);

  // If a valid uploaded cover image exists, render it with calm aspect ratio & smooth hover scaling
  if (coverImageUrl && !imgError) {
    return (
      <div
        className={`relative aspect-[2/3] w-full overflow-hidden rounded-2xl shadow-calm bg-surface-soft select-none ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImageUrl}
          alt={`Book cover for ${title} by ${author}`}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Elegant royal inner border overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 dark:ring-white/10" />
      </div>
    );
  }

  const {
    gradientFrom = "#FCE7B2",
    gradientTo = "#F7C59F",
    accentColor = "#2F3B4A",
    motif = "sun",
  } = styleConfig || {};
  const gradId = `grad-${title.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`;

  return (
    <div
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-2xl shadow-calm select-none ${className}`}
    >
      <svg
        viewBox="0 0 300 450"
        className="h-full w-full object-cover"
        role="img"
        aria-label={`Book cover for ${title} by ${author}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>

        <rect width="300" height="450" fill={`url(#${gradId})`} />

        {/* Subtle Inner Frame */}
        <rect
          x="18"
          y="18"
          width="264"
          height="414"
          rx="12"
          fill="none"
          stroke={accentColor}
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />

        {/* Minimalist Calm Motif */}
        {motif === "sun" && (
          <circle cx="150" cy="155" r="46" fill={accentColor} fillOpacity="0.28" />
        )}
        {motif === "moon" && (
          <path
            d="M165 115 A45 45 0 1 0 195 185 A38 38 0 1 1 165 115 Z"
            fill={accentColor}
            fillOpacity="0.32"
          />
        )}
        {motif === "arch" && (
          <path
            d="M95 220 L95 140 A55 55 0 0 1 205 140 L205 220 Z"
            fill={accentColor}
            fillOpacity="0.22"
          />
        )}
        {motif === "waves" && (
          <path
            d="M40 175 Q95 145 150 175 T260 175"
            fill="none"
            stroke={accentColor}
            strokeWidth="6"
            strokeOpacity="0.35"
            strokeLinecap="round"
          />
        )}
        {motif === "leaf" && (
          <path
            d="M150 105 C190 130 190 180 150 210 C110 180 110 130 150 105 Z"
            fill={accentColor}
            fillOpacity="0.28"
          />
        )}
        {motif === "stars" && (
          <g fill={accentColor} fillOpacity="0.35">
            <circle cx="150" cy="145" r="6" />
            <circle cx="115" cy="170" r="3.5" />
            <circle cx="185" cy="130" r="4" />
            <circle cx="170" cy="180" r="3" />
          </g>
        )}
      </svg>

      {/* Overlay Typography */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 text-center">
        <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#2F3B4A]/75">
          Sunlit Edition
        </span>
        <div className="my-auto pt-16">
          <h3 className="font-serif text-lg leading-snug font-semibold text-[#1F2937] line-clamp-3">
            {title}
          </h3>
          <p className="mt-2 text-xs font-medium text-[#374151]/80">{author}</p>
        </div>
        <div className="mx-auto h-1 w-8 rounded-full bg-[#2F3B4A]/20" />
      </div>
    </div>
  );
}
