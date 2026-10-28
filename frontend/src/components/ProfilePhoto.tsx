'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const VIEW = 160;

export type PhotoPositionHandle = {
  exportCrop: () => string;
};

export default function ProfilePhoto({ src, className }: { src: string; className?: string }) {
  return <img src={src} alt="" className={`${className || ''} object-center`} />;
}

export const PhotoPositioner = forwardRef<PhotoPositionHandle, { src: string; onAdjust: () => void }>(
  function PhotoPositioner({ src, onAdjust }, ref) {
    const imageRef = useRef<HTMLImageElement>(null);
    const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
    const [natural, setNatural] = useState({ w: 0, h: 0 });
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
      setZoom(1);
      setNatural({ w: 0, h: 0 });
    }, [src]);

    function coverScale(width = natural.w, height = natural.h) {
      if (!width || !height) return 1;
      return Math.max(VIEW / width, VIEW / height);
    }

    function clamp(x: number, y: number, nextZoom: number, width = natural.w, height = natural.h) {
      const displayedWidth = width * coverScale(width, height) * nextZoom;
      const displayedHeight = height * coverScale(width, height) * nextZoom;
      return {
        x: Math.min(0, Math.max(VIEW - displayedWidth, x)),
        y: Math.min(0, Math.max(VIEW - displayedHeight, y)),
      };
    }

    useEffect(() => {
      if (!natural.w || !natural.h) return;
      const displayedWidth = natural.w * coverScale();
      const displayedHeight = natural.h * coverScale();
      setOffset({ x: (VIEW - displayedWidth) / 2, y: (VIEW - displayedHeight) / 2 });
    }, [natural.w, natural.h]);

    useImperativeHandle(ref, () => ({
      exportCrop() {
        const image = imageRef.current;
        if (!image || !natural.w || !natural.h) throw new Error('Photo is still loading');
        const scale = coverScale() * zoom;
        const sourceX = -offset.x / scale;
        const sourceY = -offset.y / scale;
        const sourceSide = VIEW / scale;
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not crop that photo');
        context.drawImage(image, sourceX, sourceY, sourceSide, sourceSide, 0, 0, 256, 256);
        return canvas.toDataURL('image/jpeg', 0.85);
      },
    }));

    const scale = coverScale() * zoom;

    return (
      <div>
        <div
          className="relative h-40 w-40 overflow-hidden rounded-full bg-gray-200 touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { px: event.clientX, py: event.clientY, ox: offset.x, oy: offset.y };
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            setOffset(clamp(
              drag.current.ox + event.clientX - drag.current.px,
              drag.current.oy + event.clientY - drag.current.py,
              zoom
            ));
            onAdjust();
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          <img
            ref={imageRef}
            src={src}
            alt=""
            draggable={false}
            crossOrigin="anonymous"
            onLoad={(event) => setNatural({
              w: event.currentTarget.naturalWidth,
              h: event.currentTarget.naturalHeight,
            })}
            className="absolute max-w-none select-none"
            style={{
              width: natural.w ? natural.w * scale : undefined,
              height: natural.h ? natural.h * scale : undefined,
              left: offset.x,
              top: offset.y,
            }}
          />
        </div>
        <label className="mt-2 block text-xs text-gray-500">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            className="mt-1 block w-40"
            onChange={(event) => {
              const nextZoom = Number(event.target.value);
              setZoom(nextZoom);
              setOffset((current) => clamp(current.x, current.y, nextZoom));
              onAdjust();
            }}
          />
        </label>
        <p className="mt-1 text-xs text-gray-500">Drag so the face sits in the circle. Save crops it there.</p>
      </div>
    );
  }
);
