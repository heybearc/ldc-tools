'use client';

import { useState } from 'react';

type FaceBox = { x: number; y: number; width: number; height: number };

type Detector = {
  detect: (source: CanvasImageSource) => Promise<Array<{ boundingBox: FaceBox }>>;
};

function faceDetector(): Detector | null {
  const FaceDetectorCtor = (window as unknown as {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => Detector;
  }).FaceDetector;
  if (!FaceDetectorCtor) return null;
  return new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 5 });
}

async function largestFace(source: CanvasImageSource) {
  const detector = faceDetector();
  if (!detector) return null;
  try {
    const faces = await detector.detect(source);
    if (!faces.length) return null;
    return faces.reduce((best, face) => (
      face.boundingBox.width * face.boundingBox.height > best.width * best.height ? face.boundingBox : best
    ), faces[0].boundingBox);
  } catch {
    return null;
  }
}

function percent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export async function cropPhotoAroundFace(bitmap: ImageBitmap) {
  const face = await largestFace(bitmap);
  const limit = Math.min(bitmap.width, bitmap.height);
  let side = limit;
  let sx = (bitmap.width - side) / 2;
  let sy = bitmap.height > bitmap.width ? 0 : (bitmap.height - side) / 2;
  if (face) {
    const centerX = face.x + face.width / 2;
    const centerY = face.y + face.height / 2;
    side = Math.min(limit, Math.max(face.width, face.height) * 2.4);
    sx = Math.min(bitmap.width - side, Math.max(0, centerX - side / 2));
    sy = Math.min(bitmap.height - side, Math.max(0, centerY - side / 2));
  }
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not read that photo');
  context.drawImage(bitmap, sx, sy, side, side, 0, 0, 256, 256);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function ProfilePhoto({ src, className }: { src: string; className?: string }) {
  const [position, setPosition] = useState('center center');

  return (
    <img
      src={src}
      alt=""
      className={className}
      style={{ objectPosition: position }}
      onLoad={(event) => {
        const image = event.currentTarget;
        if (image.naturalHeight > image.naturalWidth * 1.05) {
          setPosition('center 22%');
        }
        void largestFace(image).then((face) => {
          if (!face || !image.naturalWidth || !image.naturalHeight) return;
          const x = ((face.x + face.width / 2) / image.naturalWidth) * 100;
          const y = ((face.y + face.height / 2) / image.naturalHeight) * 100;
          setPosition(`${percent(x)}% ${percent(y)}%`);
        });
      }}
    />
  );
}
