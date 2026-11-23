import generatedLibrary from "@/generated/library.json";

export type ReadingDirection = "ltr" | "rtl";
export type ReadingMode = "single" | "spread" | "vertical";
export type FitMode = "screen" | "width" | "height" | "original";

export interface ComicPage {
  src: string;
  width: number;
  height: number;
}

export interface Comic {
  slug: string;
  title: string;
  author?: string;
  direction: ReadingDirection;
  cover: string;
  pageCount: number;
  pages: ComicPage[];
}

function parseDirection(value: string): ReadingDirection {
  if (value === "ltr" || value === "rtl") return value;
  throw new Error(`Invalid generated reading direction: "${value}"`);
}

export const comics: Comic[] = generatedLibrary.map((comic) => ({
  ...comic,
  direction: parseDirection(comic.direction),
}));

export function getComic(slug: string): Comic | undefined {
  return comics.find((comic) => comic.slug === slug);
}

export function comicHref(slug: string): string {
  return `/comic/${encodeURIComponent(slug)}/`;
}

export function readerHref(slug: string, page = 1): string {
  return `/read/${encodeURIComponent(slug)}/?page=${page}`;
}
