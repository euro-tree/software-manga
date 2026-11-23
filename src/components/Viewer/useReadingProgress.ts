"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReadingDirection, ReadingMode } from "@/lib/library";

export interface ReadingProgress {
  page: number;
  mode: ReadingMode;
  direction: ReadingDirection;
}

interface StoredProgress {
  page: number;
  mode: ReadingMode;
  direction: ReadingDirection;
}

function isReadingProgress(value: unknown): value is StoredProgress {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.page === "number" &&
    Number.isInteger(record.page) &&
    record.page >= 1 &&
    (record.mode === "single" || record.mode === "spread" || record.mode === "vertical") &&
    (record.direction === "ltr" || record.direction === "rtl")
  );
}

export function useReadingProgress(slug: string) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loaded, setLoaded] = useState(false);
  const progressRef = useRef<ReadingProgress | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`manga-progress:${slug}`);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isReadingProgress(parsed)) {
          progressRef.current = parsed;
          // The saved value is browser-only state loaded after hydration.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setProgress(parsed);
        }
      }
    } catch (error) {
      console.error(`Could not read saved progress for "${slug}".`, error);
    } finally {
      setLoaded(true);
    }
  }, [slug]);

  const save = useCallback(
    (update: Partial<ReadingProgress>) => {
      const next = {
        page: progressRef.current?.page ?? 1,
        mode: progressRef.current?.mode ?? "single",
        direction: progressRef.current?.direction ?? "ltr",
        ...update,
      };
      progressRef.current = next;
      setProgress(next);
      try {
        window.localStorage.setItem(`manga-progress:${slug}`, JSON.stringify(next));
      } catch (error) {
        console.error(`Could not save reading progress for "${slug}".`, error);
      }
    },
    [slug],
  );

  return { progress, loaded, save };
}
