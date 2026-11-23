"use client";

import { useEffect } from "react";
import type { ReadingDirection } from "@/lib/library";

interface KeyboardNavOptions {
  direction: ReadingDirection;
  onPrevious: () => void;
  onNext: () => void;
  onFirst: () => void;
  onLast: () => void;
  onZoom: (action: "in" | "out" | "reset") => void;
  onFullscreen: () => void;
  onExit: () => void;
  onActivity: () => void;
}

export function useKeyboardNav({
  direction,
  onPrevious,
  onNext,
  onFirst,
  onLast,
  onZoom,
  onFullscreen,
  onExit,
  onActivity,
}: KeyboardNavOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))
      ) return;

      onActivity();
      const previousKey = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      const nextKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";

      if (event.key === previousKey) {
        event.preventDefault();
        onPrevious();
      } else if (event.key === nextKey || event.key === " ") {
        event.preventDefault();
        if (event.shiftKey && event.key === " ") onPrevious();
        else onNext();
      } else if (event.key === "Home") {
        event.preventDefault();
        onFirst();
      } else if (event.key === "End") {
        event.preventDefault();
        onLast();
      } else if (event.key === "+" || event.key === "=") {
        onZoom("in");
      } else if (event.key === "-") {
        onZoom("out");
      } else if (event.key === "0") {
        onZoom("reset");
      } else if (event.key.toLowerCase() === "f") {
        onFullscreen();
      } else if (event.key === "Escape") {
        onExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, onActivity, onExit, onFirst, onFullscreen, onLast, onNext, onPrevious, onZoom]);
}
