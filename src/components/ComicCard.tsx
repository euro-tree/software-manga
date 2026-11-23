"use client";

import Image from "next/image";
import Link from "next/link";
import { comicHref, readerHref, type Comic } from "@/lib/library";
import { useReadingProgress } from "@/components/Viewer/useReadingProgress";

export default function ComicCard({ comic }: { comic: Comic }) {
  const { progress } = useReadingProgress(comic.slug);
  const hasProgress = progress !== null;
  const page = Math.min(progress?.page ?? 1, comic.pageCount || 1);

  return (
    <article className="comic-card">
      <Link
        className="comic-cover"
        href={hasProgress ? readerHref(comic.slug, page) : comicHref(comic.slug)}
        aria-label={`${hasProgress ? "Continue reading" : "View"} ${comic.title}`}
      >
        <Image
          src={comic.cover}
          alt={`Cover of ${comic.title}`}
          fill
          sizes="(max-width: 600px) 44vw, (max-width: 900px) 30vw, 220px"
          loading="lazy"
          className="cover-image"
        />
        <span className="cover-overlay" aria-hidden="true" />
      </Link>
      <div className="comic-card-copy">
        <div>
          <Link className="comic-card-title" href={comicHref(comic.slug)}>
            {comic.title}
          </Link>
          <p className="muted-copy">{comic.pageCount} pages</p>
        </div>
        {hasProgress && (
          <Link className="continue-link" href={readerHref(comic.slug, page)}>
            Continue · p. {page}
          </Link>
        )}
      </div>
    </article>
  );
}
