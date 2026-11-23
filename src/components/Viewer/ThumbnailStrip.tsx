"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { ComicPage } from "@/lib/library";

interface ThumbnailStripProps {
  pages: ComicPage[];
  currentPage: number;
  onSelect: (index: number) => void;
}

export default function ThumbnailStrip({ pages, currentPage, onSelect }: ThumbnailStripProps) {
  const activeThumb = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeThumb.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [currentPage]);

  return (
    <div className="thumbnail-strip" aria-label="Page thumbnails">
      {pages.map((page, index) => (
        <button
          key={page.src}
          className="strip-thumb"
          type="button"
          aria-label={`Go to page ${index + 1}`}
          aria-current={index === currentPage ? "page" : undefined}
          onClick={() => onSelect(index)}
          ref={index === currentPage ? activeThumb : undefined}
        >
          <Image
            src={page.src}
            alt=""
            width={page.width}
            height={page.height}
            sizes="56px"
            loading="lazy"
          />
          <span>{index + 1}</span>
        </button>
      ))}
    </div>
  );
}
