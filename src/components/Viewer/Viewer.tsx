"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Comic, FitMode, ReadingDirection, ReadingMode } from "@/lib/library";
import { comicHref } from "@/lib/library";
import ThumbnailStrip from "@/components/Viewer/ThumbnailStrip";
import Toolbar from "@/components/Viewer/Toolbar";
import { useKeyboardNav } from "@/components/Viewer/useKeyboardNav";
import { useReadingProgress } from "@/components/Viewer/useReadingProgress";
import ZoomPanImage, { type ZoomPanHandle } from "@/components/Viewer/ZoomPanImage";

interface ViewerProps {
  comic: Comic;
}

export default function Viewer({ comic }: ViewerProps) {
  const router = useRouter();
  const { progress, loaded, save } = useReadingProgress(comic.slug);
  const [currentPage, setCurrentPage] = useState(0);
  const [mode, setMode] = useState<ReadingMode>("single");
  const [direction, setDirection] = useState<ReadingDirection>(comic.direction);
  const [fit, setFit] = useState<FitMode>("screen");
  const [zoom, setZoom] = useState(1);
  const [thumbnailsVisible, setThumbnailsVisible] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageHandles = useRef(new Map<number, ZoomPanHandle>());
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollFrame = useRef<number | null>(null);
  const scrolledPageRef = useRef(false);

  const revealUi = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), 3200);
  }, []);

  useEffect(() => {
    if (!loaded || initialized) return;
    const requestedPage = Number(new URLSearchParams(window.location.search).get("page"));
    const hasRequestedPage = Number.isInteger(requestedPage) && requestedPage >= 1;
    const savedPage = progress?.page ?? 1;
    const startPage = hasRequestedPage ? requestedPage : savedPage;
    // URL and localStorage are browser-only inputs, so initialize after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(Math.max(0, Math.min(startPage - 1, comic.pages.length - 1)));
    if (progress) {
      setMode(progress.mode);
      setDirection(progress.direction);
    }
    setInitialized(true);
  }, [comic.pages.length, initialized, loaded, progress]);

  useEffect(() => {
    if (initialized) save({ page: currentPage + 1, mode, direction });
  }, [currentPage, direction, initialized, mode, save]);

  useEffect(() => {
    if (!initialized || !comic.pages.length) return;
    for (const index of [currentPage - 1, currentPage + 1, currentPage + 2]) {
      const page = comic.pages[index];
      if (!page) continue;
      const image = new Image();
      image.src = page.src;
    }
  }, [comic.pages, currentPage, initialized]);

  useEffect(() => {
    if (!initialized || mode !== "vertical") return;
    if (scrolledPageRef.current) {
      scrolledPageRef.current = false;
      return;
    }
    requestAnimationFrame(() => {
      const page = stageRef.current?.querySelector<HTMLElement>(`[data-page-index="${currentPage}"]`);
      page?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, [currentPage, initialized, mode]);

  useEffect(() => {
    if (initialized && mode !== "spread") {
      setZoom(imageHandles.current.get(currentPage)?.getScale() ?? 1);
    }
  }, [currentPage, initialized, mode]);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
  }, []);

  const pageCount = comic.pages.length;
  const changePage = useCallback((amount: number) => {
    const step = mode === "spread" ? 2 : 1;
    const nextPage = Math.max(0, Math.min(pageCount - 1, currentPage + amount * step));
    setCurrentPage(nextPage);
    revealUi();
  }, [currentPage, mode, pageCount, revealUi]);

  const previous = useCallback(() => changePage(-1), [changePage]);
  const next = useCallback(() => changePage(1), [changePage]);
  const first = useCallback(() => setCurrentPage(0), []);
  const last = useCallback(() => setCurrentPage(Math.max(0, pageCount - 1)), [pageCount]);

  const zoomControl = useCallback((action: "in" | "out" | "reset") => {
    const handle = imageHandles.current.get(currentPage);
    if (!handle) return;
    if (action === "in") handle.zoomIn();
    else if (action === "out") handle.zoomOut();
    else handle.reset();
    revealUi();
  }, [currentPage, revealUi]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error("Could not toggle fullscreen mode.", error);
    }
    revealUi();
  }, [revealUi]);

  const exitReader = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      router.push(comicHref(comic.slug));
    }
  }, [comic.slug, router]);

  useKeyboardNav({
    direction,
    onPrevious: previous,
    onNext: next,
    onFirst: first,
    onLast: last,
    onZoom: zoomControl,
    onFullscreen: () => void toggleFullscreen(),
    onExit: exitReader,
    onActivity: revealUi,
  });

  const visiblePages = useMemo(() => {
    if (mode !== "spread") return [currentPage];
    const secondPage = currentPage + 1;
    return secondPage < pageCount ? [currentPage, secondPage] : [currentPage];
  }, [currentPage, mode, pageCount]);

  const handleStageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest(".viewer-chrome, button, select, input")) return;
    const zoomImage = target.closest<HTMLElement>(".zoom-pan-image");
    if (zoomImage && Number(zoomImage.dataset.scale ?? 1) > 1) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = (event.clientX - bounds.left) / bounds.width;
    if (position < 0.25) {
      if (direction === "rtl") next();
      else previous();
    } else if (position > 0.75) {
      if (direction === "rtl") previous();
      else next();
    }
    else revealUi();
  };

  const handleVerticalScroll = () => {
    if (scrollFrame.current !== null) return;
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;
      const container = stageRef.current;
      if (!container) return;
      const centerY = container.getBoundingClientRect().top + container.clientHeight / 2;
      const pages = [...container.querySelectorAll<HTMLElement>("[data-page-index]")];
      let closestIndex = currentPage;
      let closestDistance = Number.POSITIVE_INFINITY;
      for (const page of pages) {
        const bounds = page.getBoundingClientRect();
        const distance = Math.abs(bounds.top + bounds.height / 2 - centerY);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = Number(page.dataset.pageIndex);
        }
      }
      if (closestIndex !== currentPage) {
        scrolledPageRef.current = true;
        setCurrentPage(closestIndex);
      }
    });
  };

  const handleZoomChange = (index: number, scale: number) => {
    if (index === currentPage) setZoom(scale);
  };

  const pageImage = (index: number, allowTouchScroll = false) => {
    const page = comic.pages[index];
    if (!page) return null;
    return (
      <ZoomPanImage
        key={`${page.src}-${fit}`}
        ref={(handle) => {
          if (handle) imageHandles.current.set(index, handle);
          else imageHandles.current.delete(index);
        }}
        page={page}
        fit={fit}
        allowTouchScroll={allowTouchScroll}
        onSwipe={(swipeDirection) => swipeDirection === "next" ? next() : previous()}
        onZoomChange={(scale) => handleZoomChange(index, scale)}
        onTap={(clientX) => {
          const bounds = stageRef.current?.getBoundingClientRect();
          if (!bounds) return;
          const position = (clientX - bounds.left) / bounds.width;
          if (position < 0.25) {
            if (direction === "rtl") next();
            else previous();
          } else if (position > 0.75) {
            if (direction === "rtl") previous();
            else next();
          }
          else revealUi();
        }}
      />
    );
  };

  return (
    <main
      className={`viewer-root${uiVisible ? "" : " ui-hidden"}`}
      onMouseMove={revealUi}
      onTouchStart={revealUi}
      onClick={handleStageClick}
      aria-label={`${comic.title} reader`}
    >
      <Toolbar
        title={comic.title}
        author={comic.author}
        currentPage={pageCount ? currentPage + 1 : 0}
        pageCount={pageCount}
        mode={mode}
        direction={direction}
        fit={fit}
        zoom={zoom}
        thumbnailsVisible={thumbnailsVisible}
        onModeChange={(value) => { setMode(value); revealUi(); }}
        onDirectionToggle={() => {
          setDirection((value) => value === "ltr" ? "rtl" : "ltr");
          revealUi();
        }}
        onFitChange={(value) => { setFit(value); revealUi(); }}
        onZoom={zoomControl}
        onToggleThumbnails={() => { setThumbnailsVisible((value) => !value); revealUi(); }}
        onToggleFullscreen={() => void toggleFullscreen()}
      />

      <section
        className={`viewer-stage${mode === "vertical" ? " vertical-pages" : ""}`}
        ref={stageRef}
        onScroll={mode === "vertical" ? handleVerticalScroll : undefined}
        aria-label="Comic pages"
      >
        {pageCount === 0 ? (
          <p className="viewer-empty">This comic has no reading pages yet.</p>
        ) : mode === "vertical" ? (
          comic.pages.slice(Math.max(0, currentPage - 2), Math.min(pageCount, currentPage + 3)).map((page, offset) => {
            const index = Math.max(0, currentPage - 2) + offset;
            return (
              <div className="vertical-page" data-page-index={index} key={page.src}>
                {pageImage(index, true)}
              </div>
            );
          })
        ) : mode === "spread" ? (
          <div className="viewer-spread" style={{ flexDirection: direction === "rtl" ? "row-reverse" : "row" }}>
            {visiblePages.map((index) => pageImage(index))}
          </div>
        ) : (
          <div className="viewer-page">{pageImage(currentPage)}</div>
        )}
      </section>

      <footer className="viewer-controls viewer-chrome">
        <div className="viewer-progress-row">
          <span className="viewer-progress-label">{pageCount ? `${currentPage + 1} / ${pageCount}` : "0 / 0"}</span>
          <label className="sr-only" htmlFor="page-progress">Current page</label>
          <input
            id="page-progress"
            className="viewer-slider"
            type="range"
            min="1"
            max={Math.max(1, pageCount)}
            value={pageCount ? currentPage + 1 : 1}
            onChange={(event) => {
              setCurrentPage(Number(event.target.value) - 1);
              revealUi();
            }}
            disabled={pageCount === 0}
          />
        </div>
        <div className="viewer-bottom-row">
          <span className="viewer-bottom-meta">
            {mode === "vertical" ? "Scroll to read" : `Page ${currentPage + 1} of ${pageCount}`}
            <span className="hide-mobile"> · {direction === "rtl" ? "RTL" : "LTR"}</span>
          </span>
          <div className="viewer-bottom-actions">
            <button className="viewer-button" type="button" onClick={previous} disabled={currentPage === 0} aria-label="Previous page">
              ←
            </button>
            <button className="viewer-button" type="button" onClick={next} disabled={currentPage >= pageCount - 1} aria-label="Next page">
              →
            </button>
            <button
              className="viewer-button hide-mobile"
              type="button"
              onClick={() => { setThumbnailsVisible((value) => !value); revealUi(); }}
              aria-expanded={thumbnailsVisible}
              aria-label={thumbnailsVisible ? "Hide thumbnails" : "Show thumbnails"}
            >
              Pages
            </button>
          </div>
        </div>
        {thumbnailsVisible && (
          <ThumbnailStrip
            pages={comic.pages}
            currentPage={currentPage}
            onSelect={(index) => { setCurrentPage(index); revealUi(); }}
          />
        )}
      </footer>
    </main>
  );
}
