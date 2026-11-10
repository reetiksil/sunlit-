"use client";

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Book } from "@/types";
import { SvgCover } from "./SvgCover";

interface BookCardProps {
  book: Book;
  rank?: number;
}

export function BookCard({ book, rank }: BookCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl p-2 transition-transform duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary">
      {rank !== undefined && (
        <span className="absolute left-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-fg shadow-sm pointer-events-none">
          {rank}
        </span>
      )}
      <Link href={`/book/${book.slug}`} className="block overflow-hidden rounded-2xl focus:outline-none">
        <div className="overflow-hidden rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]">
          <SvgCover
            title={book.title}
            author={book.author}
            styleConfig={book.coverStyle}
            coverImageUrl={book.coverImageUrl}
          />
        </div>
        <div className="mt-3 px-1">
          <h3 className="font-serif text-base font-semibold leading-snug text-text line-clamp-1 hover:text-primary transition-colors">
            {book.title}
          </h3>
        </div>
      </Link>
      <div className="px-1 space-y-1 mt-1">
        <Link
          href={`/browse?author=${encodeURIComponent(book.author)}`}
          className="text-xs text-text-muted hover:text-primary hover:underline line-clamp-1 inline-block transition-colors"
          title={`View all books by ${book.author}`}
        >
          {book.author}
        </Link>
        <div className="flex items-center gap-2 pt-0.5 text-xs text-text-muted">
          {book.rating > 0 && (
            <>
              <span className="inline-flex items-center gap-1 font-medium text-text">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                {book.rating}
              </span>
              <span>·</span>
            </>
          )}
          <span className="capitalize">{book.status}</span>
          {book.views > 0 && (
            <>
              <span>·</span>
              <span title={`${book.views} total views`}>
                {book.views >= 1000 ? `${(book.views / 1000).toFixed(1)}k` : book.views} views
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
