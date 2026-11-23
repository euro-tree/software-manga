"use client";

import Link from "next/link";
import type { FitMode, ReadingDirection, ReadingMode } from "@/lib/library";

interface ToolbarProps {
  title: string;
  author?: string;
  currentPage: number;
  pageCount: number;
  mode: ReadingMode;
  direction: ReadingDirection;
  fit: FitMode;
  zoom: number;
  thumbnailsVisible: boolean;
  onModeChange: (mode: ReadingMode) => void;
  onDirectionToggle: () => void;
  onFitChange: (fit: FitMode) => void;
  onZoom: (action: "in" | "out" | "reset") => void;
  onToggleThumbnails: () => void;
  onToggleFullscreen: () => void;
}

export default function Toolbar({
  title,
  author,
  currentPage,
  pageCount,
  mode,
  direction,
  fit,
  zoom,
  thumbnailsVisible,
  onModeChange,
  onDirectionToggle,
  onFitChange,
  onZoom,
  onToggleThumbnails,
  onToggleFullscreen,
}: ToolbarProps) {
  return (
    <header className="viewer-toolbar viewer-chrome">
      <div className="viewer-toolbar-left">
        <Link className="viewer-back" href="/" aria-label="Exit reader and return to library" title="Back to library">
          ←
        </Link>
        <div className="viewer-title-block">
          <span className="viewer-title">{title}</span>
          <span className="viewer-subtitle">
            {author ? `${author} · ` : ""}{currentPage} / {pageCount}
          </span>
        </div>
      </div>

      <div className="viewer-toolbar-right">
        <select
          className="viewer-select"
          value={mode}
          onChange={(event) => onModeChange(event.target.value as ReadingMode)}
          aria-label="Reading mode"
        >
          <option value="single">Single page</option>
          <option value="spread">Double page</option>
          <option value="vertical">Vertical scroll</option>
        </select>
        <select
          className="viewer-select"
          value={fit}
          onChange={(event) => onFitChange(event.target.value as FitMode)}
          aria-label="Image fit mode"
        >
          <option value="screen">Fit screen</option>
          <option value="width">Fit width</option>
          <option value="height">Fit height</option>
          <option value="original">Original size</option>
        </select>
        <button
          className="viewer-button"
          type="button"
          onClick={onDirectionToggle}
          aria-label={`Reading direction ${direction === "ltr" ? "left to right" : "right to left"}. Toggle direction`}
          title="Toggle reading direction"
        >
          {direction.toUpperCase()}
        </button>
        <div className="viewer-button-group" aria-label="Zoom controls">
          <button className="viewer-button" type="button" onClick={() => onZoom("out")} aria-label="Zoom out" title="Zoom out">
            −
          </button>
          <span className="viewer-zoom-value" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button className="viewer-button" type="button" onClick={() => onZoom("in")} aria-label="Zoom in" title="Zoom in">
            +
          </button>
          <button className="viewer-button" type="button" onClick={() => onZoom("reset")} aria-label="Reset zoom" title="Reset zoom">
            Reset
          </button>
        </div>
        <button
          className="viewer-button hide-mobile"
          type="button"
          onClick={onToggleThumbnails}
          aria-label={thumbnailsVisible ? "Hide page thumbnails" : "Show page thumbnails"}
          aria-pressed={thumbnailsVisible}
          title="Toggle thumbnails"
        >
          ▦
        </button>
        <button className="viewer-button" type="button" onClick={onToggleFullscreen} aria-label="Toggle fullscreen" title="Toggle fullscreen">
          ⛶
        </button>
      </div>
    </header>
  );
}
