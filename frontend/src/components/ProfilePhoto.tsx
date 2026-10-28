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
