import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="site-footer mt-24 border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div className="max-w-sm space-y-2">
          <p className="font-serif text-lg font-semibold">{siteConfig.name}</p>
          <p className="text-sm leading-relaxed text-text-muted">{siteConfig.tagline}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-text-muted">
          <Link href="/browse" className="link-underline hover:text-text">Browse</Link>
          <Link href="/read-your-own" className="link-underline hover:text-text">Read your own</Link>
          <Link href="/bookshelf" className="link-underline hover:text-text">Bookshelf</Link>
        </nav>
      </div>
    </footer>
  );
}
