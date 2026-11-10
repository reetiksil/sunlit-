"use client";

import React, { useState } from "react";
import type { ReaderSettings } from "@/types";
import type { Block } from "@/lib/textBlocks";
import { readerColumnStyle, readerTextStyle } from "@/lib/readerStyle";

const PAGE_SIZE = 200; // blocks rendered at once, so very large documents stay responsive

interface ReaderColumnProps {
  settings: ReaderSettings;
  children: React.ReactNode;
  className?: string;
  lang?: string;
}

/** Applies every typography setting. Column width is rem-based and independent of font size. */
export function ReaderColumn({ settings, children, className = "", lang = "en" }: ReaderColumnProps) {
  return (
    <div className="mx-auto w-full transition-[max-width] duration-200" style={readerColumnStyle(settings)}>
      <article lang={lang} className={`reader-article ${className} px-4 sm:px-6 py-6`} style={readerTextStyle(settings)}>
        {children}
      </article>
    </div>
  );
}

export function ReaderBlocks({ blocks, settings }: { blocks: Block[]; settings: ReaderSettings }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const gap = `${settings.paragraphSpacing}rem`;
  const shown = blocks.slice(0, visible);

  return (
    <div className="space-y-0">
      {shown.map((b, i) => {
        if (b.type === "heading") {
          const isChapter = b.level === 1;
          const size = isChapter ? "1.85em" : b.level === 2 ? "1.4em" : "1.18em";
          const Tag = (isChapter ? "h2" : b.level === 2 ? "h3" : "h4") as "h2" | "h3" | "h4";
          return (
            <div key={i} className={isChapter ? "text-center pt-8 pb-4" : "pt-4"}>
              {isChapter && (
                <div className="flex items-center justify-center gap-2 text-primary/70 mb-3 text-xs tracking-widest select-none" aria-hidden="true">
                  <span>✦</span>
                  <span className="w-12 h-px bg-primary/40 inline-block" />
                  <span>✦</span>
                </div>
              )}
              <Tag
                className="font-serif font-bold leading-tight tracking-tight"
                style={{ fontSize: size, marginBottom: gap, color: "var(--reader-text)" }}
              >
                {b.text}
              </Tag>
            </div>
          );
        }

        if (b.type === "list") {
          const List = b.ordered ? "ol" : "ul";
          return (
            <List
              key={i}
              className={`${b.ordered ? "list-decimal" : "list-disc"} pl-[1.6em] space-y-1.5`}
              style={{ marginBottom: gap, color: "var(--reader-text)" }}
            >
              {b.items.map((item, j) => (
                <li key={j} className="leading-relaxed" style={{ color: "var(--reader-text)" }}>
                  {item}
                </li>
              ))}
            </List>
          );
        }

        return (
          <p
            key={i}
            className="leading-relaxed whitespace-pre-line"
            style={{
              marginBottom: gap,
              textAlign: settings.textAlign,
              color: "var(--reader-text)",
              whiteSpace: "pre-line",
            }}
          >
            {b.text}
          </p>
        );
      })}

      {visible < blocks.length && (
        <div className="py-8 text-center font-sans">
          <button
            type="button"
            className="btn btn-reader shadow-sm"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Show more ({(blocks.length - visible).toLocaleString()} sections remaining)
          </button>
        </div>
      )}
    </div>
  );
}
