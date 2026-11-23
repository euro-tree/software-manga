"use client";

import Link from "next/link";
import { readerHref, type Comic } from "@/lib/library";
import { useReadingProgress } from "@/components/Viewer/useReadingProgress";

export default function ComicDetailActions({ comic }: { comic: Comic }) {
  const { progress } = useReadingProgress(comic.slug);
  const page = Math.min(progress?.page ?? 1, comic.pageCount || 1);
  const canContinue = progress !== null;

  return (
    <Link className="primary-button detail-start" href={readerHref(comic.slug, canContinue ? page : 1)}>
      {canContinue ? `Continue from page ${page}` : "Start reading"}
      <span aria-hidden="true">→</span>
    </Link>
  );
}
