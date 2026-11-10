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
    <Link
      href={`/book/${book.slug}`}
      className="group relative flex flex-col rounded-2xl p-2 transition-transform duration-300 hover:-translate-y-1 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {rank !== undefined && (
        <span className="absolute left-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-fg shadow-sm">
          {rank}
        </span>
      )}
      <div className="overflow-hidden rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]">
        <SvgCover
          title={book.title}
          author={book.author}
          styleConfig={book.coverStyle}
          coverImageUrl={book.coverImageUrl}
        />
      </div>
      <div className="mt-3 space-y-1 px-1">
        <h3 className="font-serif text-base font-semibold leading-snug text-text line-clamp-1">
          {book.title}
        </h3>
        <p className="text-xs text-text-muted line-clamp-1">{book.author}</p>
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
        </div>
      </div>
    </Link>
  );
}