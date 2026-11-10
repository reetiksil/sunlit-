"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, List, Minimize2, Settings2, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { getChapter, getChapters } from "@/services/api";
import { useReaderStore } from "@/stores/useReaderStore";
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { ReaderSettingsDrawer } from "@/components/reader/ReaderSettingsDrawer";
import { ReaderBlocks, ReaderColumn } from "@/components/reader/ReaderText";
import { useReaderChrome } from "@/components/reader/useReaderChrome";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { blocksFromParagraphs } from "@/lib/textBlocks";
import { AmbientAudio } from "@/components/reader/AmbientAudio";
import { BedtimeWarmth } from "@/components/reader/BedtimeWarmth";

function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

export default function ChapterReaderPage() {
  const params = useParams<{ slug: string; n: string }>();
  const router = useRouter();
  const chapterNumber = Number(params.n) || 1;

  const settings = useReaderStore((s) => s.settings);
  const updateSettings = useReaderStore((s) => s.updateSettings);
  const updateProgress = useBookshelfStore((s) => s.updateProgress);
  const readerMode = settings.readerMode;

  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef(0);

  const { setTheme } = useTheme();
  const isNight = settings.theme === "night" || settings.theme === "true-dark";

  const toggleDayNight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNight) {
      updateSettings({ theme: "day" });
      setTheme("light");
    } else {
      updateSettings({ theme: "night" });
      setTheme("dark");
    }
  };

  useReaderChrome(readerMode);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["chapter", params.slug, chapterNumber],
    queryFn: () => getChapter(params.slug, chapterNumber),
  });

  const { data: allChapters = [] } = useQuery({
    queryKey: ["chapters", data?.book.id],
    enabled: !!data?.book.id,
    queryFn: () => getChapters(data!.book.id),
  });

  const blocks = useMemo(() => blocksFromParagraphs(data?.chapter.content ?? []), [data]);

  // Scroll tracking + auto-hiding header (header is never shown in reader mode)
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.round((y / max) * 100)) : 100;
      scrollRef.current = pct;
      setScrollProgress(pct);
      if (y > last + 18 && y > 120) setControlsVisible(false);
      else if (y < last - 10 || y < 80) setControlsVisible(true);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setScrollProgress(0);
    scrollRef.current = 0;
  }, [chapterNumber]);

  // Persist progress (debounced so scrolling doesn't hammer localStorage)
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => {
      updateProgress({
        bookId: data.book.id,
        bookSlug: data.book.slug,
        chapterNumber,
        totalChapters: data.totalChapters,
        scrollPercentage: scrollRef.current,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [data, chapterNumber, scrollProgress, updateProgress]);

  const goPrev = useCallback(() => {
    if (chapterNumber > 1) router.push(`/book/${params.slug}/chapter/${chapterNumber - 1}`);
  }, [chapterNumber, params.slug, router]);

  const goNext = useCallback(() => {
    if (data && chapterNumber < data.totalChapters) router.push(`/book/${params.slug}/chapter/${chapterNumber + 1}`);
  }, [chapterNumber, data, params.slug, router]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || settingsOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape" && readerMode) updateSettings({ readerMode: false });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext, settingsOpen, readerMode, updateSettings]);

  const showChrome = !readerMode;

  return (
    <div
      data-reader-theme={settings.theme}
      data-reader-mode={readerMode ? "on" : "off"}
      className="reader-shell min-h-screen"
      style={{ backgroundColor: "var(--reader-bg)", color: "var(--reader-text)" }}
    >
      <a href="#chapter-text" className="skip-link">Skip to chapter text</a>

      {showChrome && (
        <div className="fixed left-0 right-0 top-0 z-50 h-1" style={{ background: "var(--reader-border)" }}>
          <div
            className="h-full bg-primary transition-[width] duration-150"
            style={{ width: `${scrollProgress}%` }}
            role="progressbar"
            aria-valuenow={scrollProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Chapter reading progress"
          />
        </div>
      )}

      {showChrome && (
        <header
          className={`fixed left-0 right-0 top-1 z-40 px-3 transition-all duration-300 ${
            controlsVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-20 opacity-0"
          }`}
        >
          <div
            className="mx-auto mt-2 flex max-w-4xl items-center justify-between rounded-full border px-3 py-1.5 shadow-calm backdrop-blur-md"
            style={{ backgroundColor: "var(--reader-surface)", borderColor: "var(--reader-border)" }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Link href={`/book/${params.slug}`} aria-label="Back to book details" className="reader-icon-btn">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-xs opacity-75">{data?.book.title}</p>
                <p className="truncate font-serif text-sm font-semibold">
                  {data ? `Ch. ${chapterNumber}: ${data.chapter.title}` : "Loading…"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <AmbientAudio />
              <BedtimeWarmth />
              <button type="button" onClick={() => setChaptersOpen((o) => !o)} aria-label="Open chapter list"
                aria-expanded={chaptersOpen} className="reader-icon-btn">
                <List className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => updateSettings({ readerMode: true })}
                aria-label="Enter reader mode" aria-pressed={false} className="reader-icon-btn">
                <BookOpen className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setSettingsOpen(true)} aria-label="Open reader appearance settings"
                className="reader-icon-btn">
                <Settings2 className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={toggleDayNight}
                aria-label={isNight ? "Switch to Day reading mode" : "Switch to Night reading mode"}
                title={isNight ? "Switch to Day reading mode" : "Switch to Night reading mode"}
                className="reader-icon-btn"
              >
                {isNight ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-600" />
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      <main
        id="chapter-text"
        tabIndex={-1}
        onClick={showChrome ? () => setControlsVisible((v) => !v) : undefined}
        className={`px-5 pb-28 transition-[padding] duration-300 ${readerMode ? "pt-[14vh]" : "pt-28"}`}
      >
        {isError || (!isLoading && !data) ? (
          <div className="mx-auto max-w-md space-y-4 py-24 text-center">
            <h1 className="font-serif text-2xl font-semibold">We couldn&apos;t find this chapter</h1>
            <p className="text-sm opacity-75">It may have been removed, or the link is mistyped.</p>
            <Link href={`/book/${params.slug}`} className="btn btn-primary">Back to the book</Link>
          </div>
        ) : isLoading || !data ? (
          <div className="mx-auto max-w-xl space-y-6" aria-busy="true">
            <div className="h-10 w-2/3 animate-pulse rounded-xl" style={{ background: "var(--reader-border)" }} />
            <div className="h-48 animate-pulse rounded-xl" style={{ background: "var(--reader-border)" }} />
          </div>
        ) : (
          <ReaderColumn settings={settings}>
            <header className="mb-12 border-b pb-8" style={{ borderColor: "var(--reader-border)" }}>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] opacity-75" style={{ color: "var(--reader-text)" }}>
                Chapter {data.chapter.number} of {data.totalChapters} · ~{Math.max(1, Math.ceil((data.chapter.wordCount || 1000) / 220))} min read
              </span>
              <h1 className="mt-3 font-serif text-[1.9em] font-semibold leading-tight" style={{ color: "var(--reader-text)" }}>{data.chapter.title}</h1>
            </header>

            <ReaderBlocks blocks={blocks} settings={settings} />

            {!readerMode && (
              <nav
                aria-label="Chapter pagination"
                className="mt-16 flex items-center justify-between gap-4 border-t pt-8 font-sans"
                style={{ borderColor: "var(--reader-border)", fontSize: 14, fontWeight: 500 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button type="button" onClick={goPrev} disabled={chapterNumber <= 1}
                  className="btn btn-reader disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" /> Previous Chapter
                </button>
                <button type="button" onClick={goNext} disabled={chapterNumber >= data.totalChapters}
                  className="btn btn-primary disabled:opacity-40">
                  Next Chapter <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </ReaderColumn>
        )}
      </main>

      {readerMode && (
        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border px-1.5 py-1.5 font-sans text-xs shadow-calm backdrop-blur-md reader-pill"
          style={{ backgroundColor: "var(--reader-surface)", borderColor: "var(--reader-border)" }}>
          <button type="button" onClick={goPrev} disabled={chapterNumber <= 1} aria-label="Previous chapter"
            className="reader-icon-btn disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => setSettingsOpen(true)} aria-label="Open reader appearance settings"
            className="reader-icon-btn"><Settings2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => updateSettings({ readerMode: false })}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 font-semibold hover:bg-black/5">
            <Minimize2 className="h-3.5 w-3.5" /> Exit reader mode
          </button>
          <button type="button" onClick={goNext} disabled={!data || chapterNumber >= data.totalChapters}
            aria-label="Next chapter" className="reader-icon-btn disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {chaptersOpen && showChrome && (
        <aside aria-label="Table of contents"
          className="fixed inset-y-0 left-0 z-50 w-80 max-w-[86vw] overflow-y-auto border-r border-border bg-surface p-6 text-text shadow-calm-hover drawer-in-left">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="font-serif text-lg font-semibold">Chapters</h2>
            <button type="button" onClick={() => setChaptersOpen(false)} className="btn btn-ghost btn-sm">Close</button>
          </div>
          <ul className="mt-4 space-y-1.5">
            {allChapters.map((ch) => (
              <li key={ch.id}>
                <Link href={`/book/${params.slug}/chapter/${ch.number}`} onClick={() => setChaptersOpen(false)}
                  aria-current={ch.number === chapterNumber ? "page" : undefined}
                  className={`block rounded-xl px-3.5 py-2.5 text-sm ${
                    ch.number === chapterNumber ? "bg-primary font-semibold text-primary-fg" : "hover:bg-surface-soft"
                  }`}>
                  Ch. {ch.number}: {ch.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <ReaderSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
