'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const VIEW = 180;

export type PhotoPositionerHandle = {
  crop: () => Promise<string>;
};

const PhotoPositioner = forwardRef<PhotoPositionerHandle, {
  src: string;
  onAdjust: () => void;
}>(function PhotoPositioner({ src, onAdjust }, ref) {
  const imageRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const cover = natural.width
    ? Math.max(VIEW / natural.width, VIEW / natural.height)
    : 1;
  const scale = cover * zoom;
  const displayWidth = natural.width * scale;
  const displayHeight = natural.height * scale;

  function clamp(x: number, y: number) {
    return {
      x: Math.min(0, Math.max(VIEW - displayWidth, x)),
      y: Math.min(0, Math.max(VIEW - displayHeight, y)),
    };
  }

  useEffect(() => {
    setZoom(1);
  }, [src]);

  useEffect(() => {
    if (!natural.width) return;
    const width = natural.width * cover;
    const height = natural.height * cover;
    const next = {
      x: (VIEW - width) / 2,
      y: (VIEW - height) / 2,
    };
    if (natural.height > natural.width) {
      next.y = Math.min(0, next.y + height * 0.06);
    }
    setOffset({
      x: Math.min(0, Math.max(VIEW - width, next.x)),
      y: Math.min(0, Math.max(VIEW - height, next.y)),
    });
  }, [natural.width, natural.height, cover, src]);

  useImperativeHandle(ref, () => ({
    async crop() {
      const image = imageRef.current;
      if (!image || !natural.width) throw new Error('Photo is still loading');
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not crop that photo');
      const sourceX = -offset.x / scale;
      const sourceY = -offset.y / scale;
      const sourceSize = VIEW / scale;
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 256, 256);
      let dataUrl = '';
      try {
        dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      } catch {
        throw new Error('Replace the photo with a file, then place the face in the circle.');
      }
      if (dataUrl.length > 400_000) throw new Error('That photo is too large');
      return dataUrl;
    },
  }), [natural.width, offset.x, offset.y, scale]);

  return (
    <div>
      <div
        className="relative mx-auto h-[180px] w-[180px] cursor-grab touch-none overflow-hidden rounded-full bg-gray-200 active:cursor-grabbing"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const next = clamp(
            drag.current.ox + event.clientX - drag.current.x,
            drag.current.oy + event.clientY - drag.current.y
          );
          setOffset(next);
          onAdjust();
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt=""
          draggable={false}
          className="absolute max-w-none select-none"
          style={{ width: displayWidth || undefined, height: displayHeight || undefined, left: offset.x, top: offset.y }}
          onLoad={(event) => {
            setNatural({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            });
          }}
        />
      </div>
      <label className="mt-3 block text-sm text-gray-700">
        Zoom
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          className="mt-1 w-full"
          onChange={(event) => {
            const nextZoom = Number(event.target.value);
            const nextScale = cover * nextZoom;
            const nextWidth = natural.width * nextScale;
            const nextHeight = natural.height * nextScale;
            const focusX = (VIEW / 2 - offset.x) / scale;
            const focusY = (VIEW / 2 - offset.y) / scale;
            setZoom(nextZoom);
            setOffset({
              x: Math.min(0, Math.max(VIEW - nextWidth, VIEW / 2 - focusX * nextScale)),
              y: Math.min(0, Math.max(VIEW - nextHeight, VIEW / 2 - focusY * nextScale)),
            });
            onAdjust();
          }}
        />
      </label>
      <p className="mt-1 text-xs text-gray-500">Drag the photo until the face sits in the circle. Save crops it there.</p>
    </div>
  );
});

export default PhotoPositioner;
