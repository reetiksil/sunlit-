"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, X, Shield, LogOut, BookPlus } from "lucide-react";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "./ThemeToggle";
import { searchBooks } from "@/services/api";
import { Book } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { RequestBookModal } from "@/components/book/RequestBookModal";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Catalog" },
  { href: "/bookshelf", label: "Bookshelf" },
  { href: "/read-your-own", label: "Read your own" },
];

function SunGlyph() {
  return (
    <svg
      className="wordmark-sun h-7 w-7 text-primary shrink-0"
      width={28}
      height={28}
      style={{ width: 28, height: 28 }}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="6.2" fill="currentColor" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x="15"
          y="2.5"
          width="2"
          height="5"
          rx="1"
          fill="currentColor"
          transform={`rotate(${i * 45} 16 16)`}
          opacity={i % 2 ? 0.55 : 1}
        />
      ))}
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      try {
        const res = await searchBooks(query);
        if (!cancelled) setResults(res);
      } catch {
        if (!cancelled) setResults([]);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  if (pathname.includes("/chapter/")) return null;

  const isAdmin = user?.role === "admin";
  const isAdminPage = pathname.startsWith("/admin");
  const submitSearch = () => {
    if (!query.trim()) return;
    router.push(`/browse?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const signOut = async () => {
    await logout();
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={`site-header sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled ? "border-b border-border/80 bg-bg/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 lg:px-8 ${scrolled ? "h-16" : "h-20"}`}>
        <Link href="/" className="flex items-center gap-2 rounded-xl py-1" aria-label={`${siteConfig.name} home`}>
          <SunGlyph />
          <span className="font-serif text-[1.35rem] leading-none tracking-tight">
            <span className="italic font-medium">Sunlit</span> <span className="font-semibold">Pages</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {isAdminPage ? (
            <>
              <Link href="/" className="nav-link">Home</Link>
              <Link href="/browse" className="nav-link">Catalog</Link>
              <Link
                href="/admin"
                className="nav-link inline-flex items-center gap-1.5 font-bold text-primary"
                aria-current="page"
              >
                <Shield className="h-3.5 w-3.5" aria-hidden /> Curator Console
              </Link>
            </>
          ) : (
            <>
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="nav-link" aria-current={pathname === l.href ? "page" : undefined}>
                  {l.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setRequestModalOpen(true)}
                className="nav-link inline-flex items-center gap-1.5"
              >
                <BookPlus className="h-3.5 w-3.5 text-primary" aria-hidden /> Request a Book
              </button>
              {isAdmin && (
                <Link href="/admin" className="nav-link inline-flex items-center gap-1.5" aria-current={pathname.startsWith("/admin") ? "page" : undefined}>
                  <Shield className="h-3.5 w-3.5" aria-hidden /> Curator studio
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div ref={searchRef} className="relative hidden w-52 sm:block md:w-64">
            <label htmlFor="site-search" className="sr-only">Search books</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              id="site-search"
              type="search"
              value={query}
              autoComplete="off"
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
                if (e.key === "Escape") setSearchOpen(false);
              }}
              placeholder="Search title or author"
              className="input h-10 rounded-full pl-9 pr-4 text-xs"
            />
            {searchOpen && results.length > 0 && (
              <ul className="menu-in card absolute left-0 right-0 top-12 z-50 overflow-hidden p-1.5">
                {results.map((book) => (
                  <li key={book.id}>
                    <Link href={`/book/${book.slug}`} onClick={() => setSearchOpen(false)} className="menu-item flex-col items-start gap-0">
                      <span>{book.title}</span>
                      <span className="text-[11px] font-normal text-text-muted">{book.author}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ThemeToggle />

          <div className="hidden items-center gap-2 sm:flex">
            {status === "loading" ? (
              <span className="h-10 w-24" aria-hidden />
            ) : user ? (
              <>
                <span className="max-w-[9rem] truncate text-xs font-semibold text-text-muted" title={user.email}>
                  {user.name.split(" ")[0]}
                </span>
                <button type="button" onClick={signOut} className="btn btn-ghost btn-sm">
                  <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link">Sign in</Link>
                <Link href="/register" className="btn btn-primary btn-sm">Join</Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="icon-btn lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="menu-in border-t border-border bg-bg/95 backdrop-blur-md lg:hidden">
          <nav aria-label="Mobile" className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            <div className="relative mb-2 sm:hidden">
              <label htmlFor="m-search" className="sr-only">Search books</label>
              <input id="m-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()} placeholder="Search title or author" className="input rounded-full" />
            </div>
            {isAdminPage ? (
              <>
                <Link href="/" className="menu-item">Home</Link>
                <Link href="/browse" className="menu-item">Catalog</Link>
                <Link href="/admin" className="menu-item font-bold text-primary">
                  <span>Curator Console</span>
                  <Shield className="h-4 w-4" aria-hidden />
                </Link>
              </>
            ) : (
              <>
                {NAV_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className="menu-item" aria-current={pathname === l.href ? "page" : undefined}>{l.label}</Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setRequestModalOpen(true);
                  }}
                  className="menu-item text-left flex items-center justify-between"
                >
                  <span>Request a Book</span>
                  <BookPlus className="h-4 w-4 text-primary" aria-hidden />
                </button>
                {isAdmin && <Link href="/admin" className="menu-item"><span>Curator studio</span><Shield className="h-4 w-4" aria-hidden /></Link>}
              </>
            )}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              {user ? (
                <button type="button" onClick={signOut} className="btn btn-ghost flex-1"><LogOut className="h-4 w-4" aria-hidden /> Sign out ({user.name.split(" ")[0]})</button>
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost flex-1">Sign in</Link>
                  <Link href="/register" className="btn btn-primary flex-1">Join</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
      <RequestBookModal isOpen={requestModalOpen} onClose={() => setRequestModalOpen(false)} />
    </header>
  );
}
