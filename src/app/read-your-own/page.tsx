"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  AlertCircle,
  BookOpen,
  BookText,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Eraser,
  FileText,
  Minimize2,
  Settings2,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { db } from "@/lib/db";
import { formatFromName, SUPPORTED_EXTENSIONS_LABEL, validateBookFile } from "@/lib/validations";
import { siteConfig } from "@/config/site";
import type { UploadedBook } from "@/types";
import { useReaderStore } from "@/stores/useReaderStore";
import { ReaderSettingsDrawer } from "@/components/reader/ReaderSettingsDrawer";
import { ReaderBlocks, ReaderColumn } from "@/components/reader/ReaderText";
import { useReaderChrome } from "@/components/reader/useReaderChrome";
import { THEME_OPTIONS, readerColumnStyle } from "@/lib/readerStyle";
import { applyEpubTypography, injectEpubBase, type EpubRenditionLike } from "@/lib/epubTheme";
import { buildPdfParagraphs } from "@/lib/pdfText";
import { AmbientAudio } from "@/components/reader/AmbientAudio";
import { BedtimeWarmth } from "@/components/reader/BedtimeWarmth";
import {
  Block,
  TEXT_LIMITS,
  blocksFromParagraphs,
  checkText,
  guessTitle,
  parseTextToBlocks,
} from "@/lib/textBlocks";

type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<{
    getTextContent: () => Promise<{ items: unknown[] }>;
    getViewport: (o: { scale: number }) => { width: number; height: number };
    render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
  }>;
  destroy?: () => Promise<void>;
};

type EpubBook = { renderTo: (el: HTMLElement, o: Record<string, unknown>) => EpubRenditionLike; destroy: () => void };

const NO_TEXT_NOTE = "No selectable text on this page. It may be a scanned image, so try the Original PDF view.";

function describeStorageError(err: unknown): string {
  if (err instanceof Error && /quota/i.test(err.name + err.message)) {
    return "Your browser's storage is full. Remove a document from your shelf and try again.";
  }
  return "Unable to save this file locally. Check your browser's storage settings and try again.";
}

export default function ReadYourOwnPage() {
  const uploadedBooks = useLiveQuery(() => db.uploadedBooks.reverse().toArray(), []);
  const settings = useReaderStore((s) => s.settings);
  const updateSettings = useReaderStore((s) => s.updateSettings);
  const { setTheme } = useTheme();
  const readerMode = settings.readerMode;
  const isNight = settings.theme === "night" || settings.theme === "true-dark";

  const toggleDayNight = () => {
    const nextTheme = isNight ? "day" : "night";
    updateSettings({ theme: nextTheme });
    setTheme(isNight ? "light" : "dark");
  };

  const [tab, setTab] = useState<"file" | "paste">("file");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");

  const [active, setActive] = useState<UploadedBook | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pdfView, setPdfView] = useState<"reading" | "original">("reading");
  const [pdfParagraphs, setPdfParagraphs] = useState<string[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmRemoveViewer, setConfirmRemoveViewer] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const epubContainerRef = useRef<HTMLDivElement | null>(null);
  const epubRef = useRef<{ book: EpubBook; rendition: EpubRenditionLike } | null>(null);
  const pdfDocRef = useRef<PdfDoc | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfCache = useRef<Map<number, string[]>>(new Map());
  const openToken = useRef(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useReaderChrome(readerMode && !!active);

  /* ------------------------------ cleanup ------------------------------ */

  const teardown = useCallback(() => {
    openToken.current++;
    try {
      epubRef.current?.rendition.destroy();
      epubRef.current?.book.destroy();
    } catch {
      /* already gone */
    }
    epubRef.current = null;
    void pdfDocRef.current?.destroy?.();
    pdfDocRef.current = null;
    pdfCache.current.clear();
  }, []);

  useEffect(() => teardown, [teardown]);

  const closeViewer = useCallback(() => {
    teardown();
    setActive(null);
    setBlocks([]);
    setPdfParagraphs(null);
    setPdfView("reading");
    setCurrentPage(1);
    setTotalPages(1);
    setConfirmRemoveViewer(false);
    setIsProcessing(false);
    if (readerMode) updateSettings({ readerMode: false });
  }, [teardown, readerMode, updateSettings]);

  // Esc leaves reader mode (and the viewer's confirmation prompt)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || settingsOpen) return;
      if (confirmRemoveViewer) setConfirmRemoveViewer(false);
      else if (readerMode && active) updateSettings({ readerMode: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readerMode, active, settingsOpen, confirmRemoveViewer, updateSettings]);

  /* ------------------------------ adding content ------------------------------ */

  const openBook = useCallback(
    async (book: UploadedBook) => {
      teardown();
      const token = ++openToken.current;
      setErrorMsg(null);
      setNotice(null);
      setBlocks([]);
      setPdfParagraphs(null);
      setPdfView("reading");
      setCurrentPage(1);
      setIsProcessing(true);
      setActive(book);

      const fail = (msg: string) => {
        if (token !== openToken.current) return;
        setErrorMsg(msg);
        setActive(null);
        setIsProcessing(false);
      };

      try {
        if (book.format === "txt") {
          const text = new TextDecoder("utf-8").decode(book.fileBlob);
          const checked = checkText(text);
          if (!checked.ok) return fail(checked.error);
          const parsed = parseTextToBlocks(checked.text);
          if (!parsed.length) return fail("There's nothing readable in this document.");
          if (token !== openToken.current) return;
          setBlocks(parsed);
          setIsProcessing(false);
        } else if (book.format === "pdf") {
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          const doc = (await pdfjs.getDocument({ data: new Uint8Array(book.fileBlob.slice(0)) }).promise) as unknown as PdfDoc;
          if (token !== openToken.current) {
            void doc.destroy?.();
            return;
          }
          pdfDocRef.current = doc;
          setTotalPages(doc.numPages);
          setIsProcessing(false);
        } else {
          // EPUB: the viewer mounts its container first; an effect below renders into it.
          setIsProcessing(false);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (/password/i.test(msg)) fail("This PDF is password-protected. Please remove the password and try again.");
        else if (book.format === "pdf") fail("Could not read this PDF. The file may be damaged.");
        else fail("Could not open this document.");
      }
    },
    [teardown]
  );

  const saveAndOpen = useCallback(
    async (entry: UploadedBook) => {
      try {
        await db.uploadedBooks.add(entry);
      } catch (err) {
        setErrorMsg(describeStorageError(err));
        return;
      }
      await openBook(entry);
    },
    [openBook]
  );

  const handleFiles = async (files: FileList | File[] | null | undefined) => {
    setErrorMsg(null);
    setNotice(null);
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    const file = list[0];

    const validation = validateBookFile({ name: file.name, size: file.size });
    if (!validation.success) {
      setErrorMsg(validation.error.issues[0].message);
      return;
    }

    try {
      const format = formatFromName(file.name);
      const buffer = await file.arrayBuffer();
      if (format === "txt") {
        const checked = checkText(new TextDecoder("utf-8").decode(buffer));
        if (!checked.ok) {
          setErrorMsg(checked.error);
          return;
        }
      }
      const title = file.name.replace(/\.(epub|pdf|txt|md|markdown)$/i, "").replace(/[_]+/g, " ").trim() || "Untitled";
      const entry: UploadedBook = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        author: "Personal Library",
        format,
        sizeBytes: file.size,
        fileBlob: buffer,
        progressPercentage: 0,
        lastLocation: "1",
        addedAt: new Date().toISOString(),
      };
      if (list.length > 1) setNotice("Only the first file was added. Add the others one at a time.");
      await saveAndOpen(entry);
    } catch (err) {
      setErrorMsg(describeStorageError(err));
    }
  };

  const handlePasteSubmit = async () => {
    setErrorMsg(null);
    setNotice(null);
    const checked = checkText(pasteText);
    if (!checked.ok) {
      setErrorMsg(checked.error);
      return;
    }
    const parsed = parseTextToBlocks(checked.text);
    const bytes = new TextEncoder().encode(checked.text);
    const entry: UploadedBook = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: pasteTitle.trim() || guessTitle(parsed, "Pasted text"),
      author: "Pasted text",
      format: "txt",
      sizeBytes: bytes.byteLength,
      fileBlob: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
      progressPercentage: 0,
      lastLocation: "1",
      addedAt: new Date().toISOString(),
    };
    await saveAndOpen(entry);
    setPasteText("");
    setPasteTitle("");
  };

  const removeBook = async (id: string) => {
    try {
      await db.uploadedBooks.delete(id);
    } catch {
      setErrorMsg("Couldn't remove that document. Please try again.");
    }
  };

  /* ------------------------------ EPUB rendering ------------------------------ */

  useEffect(() => {
    if (!active || active.format !== "epub" || isProcessing) return;
    const container = epubContainerRef.current;
    if (!container) return;
    const token = openToken.current;
    let cancelled = false;

    (async () => {
      try {
        const ePub = (await import("epubjs")).default as unknown as (data: ArrayBuffer) => EpubBook;
        if (cancelled || token !== openToken.current) return;
        const book = ePub(active.fileBlob.slice(0));
        container.innerHTML = "";
        const rendition = book.renderTo(container, {
          width: "100%",
          height: "100%",
          flow: "scrolled-doc",
          allowScriptedContent: false,
        });
        rendition.hooks.content.register((c) => injectEpubBase(c, settingsRef.current));
        epubRef.current = { book, rendition };
        applyEpubTypography(rendition, settingsRef.current);
        await rendition.display();
      } catch {
        if (cancelled) return;
        setErrorMsg("Failed to open this EPUB. It may be DRM-protected or damaged.");
        setActive(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, isProcessing]);

  // Re-apply typography to an open EPUB whenever any setting changes.
  useEffect(() => {
    if (epubRef.current) applyEpubTypography(epubRef.current.rendition, settings);
  }, [settings]);

  /* ------------------------------ PDF text (lazy, per page) ------------------------------ */

  useEffect(() => {
    if (!active || active.format !== "pdf" || isProcessing || pdfView !== "reading") return;
    const doc = pdfDocRef.current;
    if (!doc) return;
    const cached = pdfCache.current.get(currentPage);
    if (cached) {
      setPdfParagraphs(cached);
      return;
    }
    let cancelled = false;
    setPdfParagraphs(null);
    (async () => {
      try {
        const page = await doc.getPage(currentPage);
        const content = await page.getTextContent();
        const items = (content.items as Array<{ str?: string; transform?: number[]; width?: number; height?: number }>)
          .filter((it) => typeof it.str === "string" && it.transform)
          .map((it) => ({
            str: it.str as string,
            x: (it.transform as number[])[4],
            y: (it.transform as number[])[5],
            width: it.width ?? 0,
            height: it.height ?? Math.abs((it.transform as number[])[3] ?? 10),
          }));
        const paras = buildPdfParagraphs(items);
        pdfCache.current.set(currentPage, paras);
        if (!cancelled) setPdfParagraphs(paras);
      } catch {
        if (!cancelled) setPdfParagraphs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, isProcessing, pdfView, currentPage]);

  useEffect(() => {
    if (!active || active.format !== "pdf" || isProcessing || pdfView !== "original") return;
    const doc = pdfDocRef.current;
    const canvas = pdfCanvasRef.current;
    if (!doc || !canvas) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await doc.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 });
        const ctx = canvas.getContext("2d");
        if (!ctx || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch {
        if (!cancelled) setErrorMsg("Couldn't draw this page.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, isProcessing, pdfView, currentPage]);

  const pdfBlocks = useMemo(() => (pdfParagraphs ? blocksFromParagraphs(pdfParagraphs) : []), [pdfParagraphs]);
  const themeColors = THEME_OPTIONS.find((t) => t.value === settings.theme) ?? THEME_OPTIONS[0];

  /* ------------------------------ viewer ------------------------------ */

  const viewer = active && (
    <section
      data-reader-theme={settings.theme}
      aria-label={`Reading ${active.title}`}
      className="reader-shell relative rounded-3xl border p-5 sm:p-10"
      style={{ backgroundColor: "var(--reader-bg)", color: "var(--reader-text)", borderColor: "var(--reader-border)" }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-5" style={{ borderColor: "var(--reader-border)" }}>
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={closeViewer} className="btn btn-reader btn-sm" style={{ borderColor: "var(--reader-border)" }}>
            <X className="h-4 w-4" /> Close document
          </button>
          <div className="min-w-0">
            <h2 className="truncate font-serif text-lg font-semibold">{active.title}</h2>
            <p className="text-[11px] opacity-70">
              {active.format.toUpperCase()} · stored only in this browser
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AmbientAudio />
          <BedtimeWarmth />
          <button
            type="button"
            onClick={toggleDayNight}
            aria-label={isNight ? "Switch to Day mode" : "Switch to Night mode"}
            title={isNight ? "Switch to Day mode" : "Switch to Night mode"}
            className="btn btn-reader btn-sm"
            style={{ borderColor: "var(--reader-border)" }}
          >
            {isNight ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-amber-600" />}
            <span className="hidden sm:inline">{isNight ? "Night" : "Day"}</span>
          </button>
          {active.format === "pdf" && (
            <div role="group" aria-label="PDF view" className="flex rounded-full border p-0.5" style={{ borderColor: "var(--reader-border)" }}>
              {(["reading", "original"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={pdfView === v} onClick={() => setPdfView(v)} className="pill-toggle">
                  {v === "reading" ? "Reading view" : "Original PDF"}
                </button>
              ))}
            </div>
          )}
          <button type="button" aria-pressed={readerMode} onClick={() => updateSettings({ readerMode: !readerMode })}
            className="btn btn-reader btn-sm" style={{ borderColor: "var(--reader-border)" }}>
            <BookText className="h-4 w-4" /> Reader mode: {readerMode ? "On" : "Off"}
          </button>
          <button type="button" onClick={() => setSettingsOpen(true)} className="btn btn-primary btn-sm">
            <Settings2 className="h-4 w-4" /> Typography
          </button>

          {confirmRemoveViewer ? (
            <span role="alertdialog" aria-label="Confirm removal" className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs"
              style={{ borderColor: "var(--reader-border)" }}>
              Remove from library?
              <button type="button" autoFocus className="btn btn-danger btn-sm" onClick={async () => { await removeBook(active.id); closeViewer(); }}>
                Remove
              </button>
              <button type="button" className="btn btn-reader btn-sm" onClick={() => setConfirmRemoveViewer(false)}>Keep</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmRemoveViewer(true)} aria-label={`Remove ${active.title} from library`}
              className="icon-btn icon-btn-reader" style={{ borderColor: "var(--reader-border)" }}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {active.format === "pdf" && pdfView === "reading" && (
        <p className="mt-4 text-xs opacity-70">Typography settings apply to Reading view, which re-flows the PDF&apos;s text.</p>
      )}

      {isProcessing ? (
        <div className="py-24 text-center" role="status">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 font-serif text-sm opacity-70">Preparing your document…</p>
        </div>
      ) : active.format === "epub" ? (
        <div className="mx-auto mt-6 w-full" style={readerColumnStyle(settings)}>
          <div ref={epubContainerRef} className="w-full overflow-hidden rounded-xl"
            style={{ height: readerMode ? "86vh" : "70vh", background: themeColors.bg }} aria-label="EPUB content" />
        </div>
      ) : active.format === "txt" ? (
        <div className="pt-10">
          <ReaderColumn settings={settings}>
            <ReaderBlocks blocks={blocks} settings={settings} />
          </ReaderColumn>
        </div>
      ) : pdfView === "reading" ? (
        <div className="pt-10">
          {pdfParagraphs === null ? (
            <p className="text-center text-sm opacity-70" role="status">Reading page {currentPage}…</p>
          ) : pdfBlocks.length === 0 ? (
            <div className="mx-auto max-w-md space-y-3 text-center text-sm opacity-80">
              <p>{NO_TEXT_NOTE}</p>
              <button type="button" className="btn btn-reader btn-sm" onClick={() => setPdfView("original")}>Show original page</button>
            </div>
          ) : (
            <ReaderColumn settings={settings}>
              <ReaderBlocks key={currentPage} blocks={pdfBlocks} settings={settings} />
            </ReaderColumn>
          )}
        </div>
      ) : (
        <div className="flex justify-center overflow-x-auto pt-8">
          <canvas ref={pdfCanvasRef} className="h-auto max-w-full rounded-xl border shadow-lg" style={{ borderColor: "var(--reader-border)" }}
            aria-label={`PDF page ${currentPage}`} />
        </div>
      )}

      {active.format === "pdf" && !isProcessing && (
        <nav aria-label="PDF pages" className="mt-10 flex items-center justify-between border-t pt-5" style={{ borderColor: "var(--reader-border)" }}>
          <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="btn btn-reader btn-sm disabled:opacity-40" style={{ borderColor: "var(--reader-border)" }}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-xs font-medium tabular-nums opacity-70">Page {currentPage} / {totalPages}</span>
          <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="btn btn-primary btn-sm disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}

      {readerMode && (
        <button type="button" onClick={() => updateSettings({ readerMode: false })}
          className="reader-pill fixed bottom-5 left-1/2 z-40 inline-flex h-10 -translate-x-1/2 items-center gap-1.5 rounded-full border px-4 font-sans text-xs font-semibold shadow-calm backdrop-blur-md"
          style={{ backgroundColor: "var(--reader-surface)", borderColor: "var(--reader-border)", color: "var(--reader-text)" }}>
          <Minimize2 className="h-3.5 w-3.5" /> Exit reader mode
        </button>
      )}
    </section>
  );

  /* ------------------------------ library ------------------------------ */

  const library = (
    <div className="space-y-10">
      <header className="space-y-3">
        <span className="chip"><ShieldCheck className="h-3.5 w-3.5" /> Private. Never leaves your browser</span>
        <h1 className="font-serif text-fluid-h1 font-semibold leading-tight">Bring your own reading</h1>
        <p className="max-w-xl text-sm leading-relaxed text-text-muted">
          Add an EPUB, PDF, text file, or just paste a chapter. Everything is stored locally and read with the same typography controls as the catalog.
        </p>
      </header>

      <div role="tablist" aria-label="Add content" className="inline-flex rounded-full border border-border bg-surface p-1">
        {([["file", "Upload a file", UploadCloud], ["paste", "Paste text", ClipboardPaste]] as const).map(([id, label, Icon]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              tab === id ? "bg-primary text-primary-fg" : "text-text-muted hover:text-text"}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "file" ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files); }}
          className={`dropzone ${dragging ? "dropzone-active" : ""}`}
        >
          <UploadCloud className="h-9 w-9 text-primary" aria-hidden />
          <span className="mt-3 font-serif text-lg font-semibold">Drop a file, or click to browse</span>
          <span className="mt-1 text-xs text-text-muted">
            {SUPPORTED_EXTENSIONS_LABEL} · up to {siteConfig.maxUploadSizeMB} MB ({TEXT_LIMITS.maxFileBytes / (1024 * 1024)} MB for text)
          </span>
          <input type="file" accept=".epub,.pdf,.txt,.md,.markdown,application/epub+zip,application/pdf,text/plain,text/markdown"
            onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }} className="sr-only" />
        </label>
      ) : (
        <div className="card space-y-4 p-6">
          <div className="field">
            <label htmlFor="paste-title" className="label">Title <span className="font-normal text-text-muted">(optional)</span></label>
            <input id="paste-title" className="input" value={pasteTitle} maxLength={120} onChange={(e) => setPasteTitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="paste-text" className="label">Text</label>
            <textarea id="paste-text" rows={10} value={pasteText} onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Paste prose here. Blank lines start new paragraphs, # makes a heading, and - or 1. makes a list."}
              className="input min-h-[14rem] resize-y py-3 font-mono text-[13px] leading-relaxed" aria-describedby="paste-count" />
            <p id="paste-count" className={`text-xs tabular-nums ${pasteText.length > TEXT_LIMITS.maxChars ? "text-red-700 dark:text-red-300" : "text-text-muted"}`}>
              {pasteText.length.toLocaleString()} / {TEXT_LIMITS.maxChars.toLocaleString()} characters
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={handlePasteSubmit} disabled={!pasteText.trim()}>
              <FileText className="h-4 w-4" /> Read this
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setPasteText(""); setPasteTitle(""); setErrorMsg(null); }}
              disabled={!pasteText && !pasteTitle}>
              <Eraser className="h-4 w-4" /> Clear
            </button>
          </div>
        </div>
      )}

      <div aria-live="polite" className="space-y-3">
        {errorMsg && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-accent-blush/60 bg-accent-blush/25 p-4 text-sm font-medium">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{errorMsg}</span>
          </div>
        )}
        {notice && <p className="rounded-2xl bg-accent-sky/20 p-4 text-sm">{notice}</p>}
      </div>

      <section className="space-y-4" aria-labelledby="shelf-title">
        <h2 id="shelf-title" className="font-serif text-xl font-semibold">Your local shelf ({uploadedBooks?.length ?? 0})</h2>
        {uploadedBooks === undefined ? (
          <p className="text-sm text-text-muted" role="status">Loading your shelf…</p>
        ) : uploadedBooks.length === 0 ? (
          <p className="card p-8 text-center text-sm text-text-muted">Nothing here yet. Upload a file or paste some text to begin.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uploadedBooks.map((b) => (
              <li key={b.id} className="card card-hover flex flex-col justify-between p-5">
                <div className="space-y-1.5">
                  <span className="chip chip-quiet uppercase">{b.format}</span>
                  <h3 className="line-clamp-2 font-serif text-base font-semibold">{b.title}</h3>
                  <p className="text-[11px] text-text-muted">
                    {b.sizeBytes < 1024 * 1024 ? `${Math.max(1, Math.round(b.sizeBytes / 1024))} KB` : `${(b.sizeBytes / (1024 * 1024)).toFixed(2)} MB`}
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  {pendingDeleteId === b.id ? (
                    <>
                      <button type="button" autoFocus className="btn btn-danger btn-sm flex-1"
                        onClick={async () => { await removeBook(b.id); setPendingDeleteId(null); }}>Remove</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPendingDeleteId(null)}>Keep</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => openBook(b)} className="btn btn-primary btn-sm flex-1">
                        <BookOpen className="h-3.5 w-3.5" /> Read
                      </button>
                      <button type="button" onClick={() => setPendingDeleteId(b.id)} aria-label={`Remove ${b.title}`} className="icon-btn">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  return (
    <div className={`mx-auto space-y-10 px-4 py-8 sm:px-6 ${readerMode && active ? "max-w-6xl" : "max-w-5xl"}`}>
      {active ? viewer : library}
      <ReaderSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
