"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, List, Settings2, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { getChapter, getChapters } from "@/services/api";
import { useReaderStore } from "@/stores/useReaderStore";
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { ReaderSettingsDrawer } from "@/components/reader/ReaderSettingsDrawer";
import { ReaderBlocks, ReaderColumn } from "@/components/reader/ReaderText";
import { useReaderChrome } from "@/components/reader/useReaderChrome";
import { blocksFromParagraphs } from "@/lib/textBlocks";
import { AmbientAudio } from "@/components/reader/AmbientAudio";
import { BedtimeWarmth } from "@/components/reader/BedtimeWarmth";
import { ReaderGenreBackground } from "@/components/reader/ReaderGenreBackground";

function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

export default function ChapterReaderPage() {
  const params = useParams<{ slug: string; n: string }>();
  const router = useRouter();

  // Allow chapter numbering from 0 (e.g. Chapter 0, Prologue)
  const rawN = Number(params.n);
  const chapterNumber = Number.isInteger(rawN) && rawN >= 0 ? rawN : 1;

  const settings = useReaderStore((s) => s.settings);
  const updateSettings = useReaderStore((s) => s.updateSettings);
  const updateProgress = useBookshelfStore((s) => s.updateProgress);
  const readerMode = settings.readerMode;

  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef(0);

  const { resolvedTheme, setTheme } = useTheme();
  const isNight = settings.theme === "night" || settings.theme === "true-dark" || resolvedTheme === "dark";

  // Sync reader theme onto html root so body and portals inherit CSS variables
  useEffect(() => {
    document.documentElement.setAttribute("data-reader-theme", settings.theme);
    return () => {
      document.documentElement.removeAttribute("data-reader-theme");
    };
  }, [settings.theme]);

  // Synchronized Day/Night toggle
  const toggleDayNight = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNight) {
      updateSettings({ theme: "day" });
      setTheme("light");
    } else {
      updateSettings({ theme: "night" });
      setTheme("dark");
    }
  }, [isNight, updateSettings, setTheme]);

  useReaderChrome(readerMode);

  // Full-screen distraction-free reader mode via double-click
  const toggleFullscreenReader = useCallback(() => {
    const nextMode = !readerMode;
    updateSettings({ readerMode: nextMode });
    if (nextMode) {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [readerMode, updateSettings]);

  // Sync browser fullscreen exit (e.g. Esc key or browser UI) back with readerMode state
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && readerMode) {
        updateSettings({ readerMode: false });
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [readerMode, updateSettings]);

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

  // Sorted chapters to support arbitrary chapter numbering schemes (e.g. starting from 0)
  const sortedChapters = useMemo(
    () => [...allChapters].sort((a, b) => a.number - b.number),
    [allChapters]
  );
  const currentIndex = sortedChapters.findIndex((c) => c.number === chapterNumber);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

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

  // Persist progress (debounced so scrolling doesn't hammer storage)
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
    if (prevChapter) router.push(`/book/${params.slug}/chapter/${prevChapter.number}`);
  }, [prevChapter, params.slug, router]);

  const goNext = useCallback(() => {
    if (nextChapter) router.push(`/book/${params.slug}/chapter/${nextChapter.number}`);
  }, [nextChapter, params.slug, router]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || settingsOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape" && readerMode) toggleFullscreenReader();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext, settingsOpen, readerMode, toggleFullscreenReader]);

  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const showChrome = !readerMode;

  return (
    <div
      data-reader-theme={settings.theme}
      data-reader-mode={readerMode ? "on" : "off"}
      className="reader-shell min-h-screen relative selection:bg-primary/30 transition-colors duration-300"
      style={{ backgroundColor: "var(--reader-bg)", color: "var(--reader-text)" }}
      onDoubleClick={toggleFullscreenReader}
    >
      <a href="#chapter-text" className="skip-link">Skip to chapter text</a>

      {/* Genre-based calming background animation layer */}
      <ReaderGenreBackground
        genres={data?.book.genres}
        theme={settings.theme}
        isDark={isNight}
      />

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
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
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
              <button
                type="button"
                onClick={() => setChaptersOpen((o) => !o)}
                aria-label="Open chapter list"
                aria-expanded={chaptersOpen}
                className="reader-icon-btn"
              >
                <List className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Open reader appearance settings"
                className="reader-icon-btn"
              >
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
        className={`relative z-10 px-5 pb-28 transition-[padding] duration-300 ${readerMode ? "pt-[10vh]" : "pt-28"}`}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] opacity-75" style={{ color: "var(--reader-text)" }}>
                  Chapter {data.chapter.number} of {data.totalChapters} · ~{Math.max(1, Math.ceil((data.chapter.wordCount || 1000) / 220))} min read
                </span>
                <span className="hidden sm:inline font-sans text-[11px] font-medium opacity-50" style={{ color: "var(--reader-text)" }}>
                  Double-click anywhere for full-screen reading
                </span>
              </div>
              <h1 className="mt-3 font-serif text-[1.9em] font-semibold leading-tight" style={{ color: "var(--reader-text)" }}>
                {data.chapter.title}
              </h1>
            </header>

            <ReaderBlocks blocks={blocks} settings={settings} />

            {!readerMode && (
              <nav
                aria-label="Chapter pagination"
                className="mt-16 flex items-center justify-between gap-4 border-t pt-8 font-sans"
                style={{ borderColor: "var(--reader-border)", fontSize: 14, fontWeight: 500 }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!prevChapter}
                  className="btn btn-reader disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous Chapter
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!nextChapter}
                  className="btn btn-primary disabled:opacity-40"
                >
                  Next Chapter <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </ReaderColumn>
        )}
      </main>

      {chaptersOpen && showChrome && (
        <aside
          aria-label="Table of contents"
          className="fixed inset-y-0 left-0 z-50 w-80 max-w-[86vw] overflow-y-auto border-r border-border bg-surface p-6 text-text shadow-calm-hover drawer-in-left"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="font-serif text-lg font-semibold">Chapters</h2>
            <button type="button" onClick={() => setChaptersOpen(false)} className="btn btn-ghost btn-sm">Close</button>
          </div>
          <ul className="mt-4 space-y-1.5">
            {sortedChapters.map((ch) => (
              <li key={ch.id}>
                <Link
                  href={`/book/${params.slug}/chapter/${ch.number}`}
                  onClick={() => setChaptersOpen(false)}
                  aria-current={ch.number === chapterNumber ? "page" : undefined}
                  className={`block rounded-xl px-3.5 py-2.5 text-sm ${
                    ch.number === chapterNumber ? "bg-primary font-semibold text-primary-fg" : "hover:bg-surface-soft"
                  }`}
                >
                  Ch. {ch.number}: {ch.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <ReaderSettingsDrawer open={settingsOpen} onClose={closeSettings} />
    </div>
  );
}
