"use client";

import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { FitMode, ComicPage } from "@/lib/library";

export interface ZoomPanHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  getScale: () => number;
}

interface ZoomPanImageProps {
  page: ComicPage;
  fit: FitMode;
  onSwipe: (direction: "next" | "previous") => void;
  onZoomChange: (scale: number) => void;
  onTap: (clientX: number) => void;
  allowTouchScroll?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ZoomPanImage = forwardRef<ZoomPanHandle, ZoomPanImageProps>(function ZoomPanImage(
  { page, fit, onSwipe, onZoomChange, onTap, allowTouchScroll = false },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const pointerStart = useRef<Point | null>(null);
  const offsetStart = useRef<Point>({ x: 0, y: 0 });
  const offset = useRef<Point>({ x: 0, y: 0 });
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const lastTap = useRef<{ time: number; point: Point } | null>(null);
  const lastTouchZoom = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);
  const suppressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (suppressTimer.current) clearTimeout(suppressTimer.current);
  }, []);

  const clampOffset = useCallback((next: Point, nextScale: number): Point => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return next;
    const maxX = Math.max(0, (image.offsetWidth * nextScale - container.clientWidth) / 2);
    const maxY = Math.max(0, (image.offsetHeight * nextScale - container.clientHeight) / 2);
    return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }, []);

  const hasOverflow = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    return Boolean(
      container &&
      image &&
      (image.offsetWidth > container.clientWidth || image.offsetHeight > container.clientHeight),
    );
  }, []);

  const zoomTo = useCallback(
    (requestedScale: number, clientPoint?: Point) => {
      const nextScale = clamp(requestedScale, 1, 5);
      const rect = containerRef.current?.getBoundingClientRect();
      const localPoint = rect && clientPoint
        ? { x: clientPoint.x - rect.left - rect.width / 2, y: clientPoint.y - rect.top - rect.height / 2 }
        : { x: 0, y: 0 };
      const nextPan = {
        x: localPoint.x - (localPoint.x - offset.current.x) * (nextScale / scale),
        y: localPoint.y - (localPoint.y - offset.current.y) * (nextScale / scale),
      };
      const boundedPan = clampOffset(nextPan, nextScale);
      offset.current = boundedPan;
      setPan(boundedPan);
      setScale(nextScale);
      onZoomChange(nextScale);
    },
    [clampOffset, onZoomChange, scale],
  );

  useImperativeHandle(ref, () => ({
    zoomIn: () => zoomTo(scale + 0.25),
    zoomOut: () => zoomTo(scale - 0.25),
    reset: () => zoomTo(1),
    getScale: () => scale,
  }), [scale, zoomTo]);

  const pointerDistance = (first: Point, second: Point) =>
    Math.hypot(first.x - second.x, first.y - second.y);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = { x: event.clientX, y: event.clientY };
    if (event.pointerType === "touch") {
      const now = Date.now();
      const previous = lastTap.current;
      if (previous && now - previous.time < 300 && pointerDistance(point, previous.point) < 36) {
        if (tapTimer.current) clearTimeout(tapTimer.current);
        suppressClick.current = true;
        lastTouchZoom.current = now;
        if (suppressTimer.current) clearTimeout(suppressTimer.current);
        suppressTimer.current = setTimeout(() => { suppressClick.current = false; }, 350);
        zoomTo(scale > 1 ? 1 : 2.5, point);
        lastTap.current = null;
        return;
      }
      lastTap.current = { time: now, point };
    }

    pointers.current.set(event.pointerId, point);
    if (pointers.current.size === 1) {
      pointerStart.current = point;
      offsetStart.current = offset.current;
      if (scale > 1 || hasOverflow() || event.pointerType !== "touch" || !allowTouchScroll) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    } else if (pointers.current.size === 2) {
      const [first, second] = [...pointers.current.values()];
      pinchStart.current = { distance: pointerDistance(first, second), scale };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);

    if (pointers.current.size >= 2 && pinchStart.current) {
      const [first, second] = [...pointers.current.values()];
      const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      const nextScale = pinchStart.current.scale * pointerDistance(first, second) / pinchStart.current.distance;
      zoomTo(nextScale, center);
      return;
    }

    const start = pointerStart.current;
    if (!start || (scale <= 1 && !hasOverflow())) return;
    const nextPan = clampOffset({
      x: offsetStart.current.x + point.x - start.x,
      y: offsetStart.current.y + point.y - start.y,
    }, scale);
    offset.current = nextPan;
    setPan(nextPan);
    setDragging(true);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    const end = pointers.current.get(event.pointerId);
    const wasPinching = pointers.current.size > 1;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    pointerStart.current = null;
    setDragging(false);
    if (start && end && !wasPinching && scale <= 1 && !hasOverflow() && event.pointerType === "touch") {
      const deltaX = end.x - start.x;
      if (Math.abs(deltaX) > 65) {
        suppressClick.current = true;
        onSwipe(deltaX < 0 ? "next" : "previous");
        if (suppressTimer.current) clearTimeout(suppressTimer.current);
        suppressTimer.current = setTimeout(() => { suppressClick.current = false; }, 350);
      }
    }
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    zoomTo(scale * Math.exp(-event.deltaY * 0.002), { x: event.clientX, y: event.clientY });
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (scale === 1 && !hasOverflow()) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      const clientX = event.clientX;
      tapTimer.current = setTimeout(() => onTap(clientX), 180);
    }
  };

  const imageStyle: React.CSSProperties = {
    ...(fit === "width"
      ? { width: "100%", height: "auto", maxWidth: "none", maxHeight: "none" }
      : fit === "height"
        ? { width: "auto", height: "100%", maxWidth: "none", maxHeight: "none" }
        : fit === "original"
          ? { width: page.width, height: "auto", maxWidth: "none", maxHeight: "none" }
          : { width: "auto", height: "auto", maxWidth: "100%", maxHeight: "100%" }),
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
    transition: dragging ? "none" : "transform 180ms ease-out",
    touchAction: allowTouchScroll && scale === 1 ? "pan-y" : "none",
  };

  return (
    <div
      className="zoom-pan-image"
      ref={containerRef}
      data-scale={scale}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (Date.now() - lastTouchZoom.current < 450) return;
        if (tapTimer.current) clearTimeout(tapTimer.current);
        zoomTo(scale > 1 ? 1 : 2.5, { x: event.clientX, y: event.clientY });
      }}
      onClick={handleClick}
    >
      <Image
        ref={imageRef}
        src={page.src}
        alt=""
        draggable={false}
        width={page.width}
        height={page.height}
        unoptimized
        style={imageStyle}
      />
    </div>
  );
});

export default ZoomPanImage;
