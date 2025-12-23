
/// <reference lib="dom" />
import React, { useState, useEffect, useRef } from 'react';

interface FlipbookViewerProps {
  frames: string[];
  fps: number;
  isPlaying: boolean;
}

export const FlipbookViewer: React.FC<FlipbookViewerProps> = ({ frames, fps, isPlaying }) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentFrameIndex(0);
  }, [frames]);
  
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      // 再生開始時にアニメーションをリセットし、同期ズレを解消
      setCurrentFrameIndex(0);
      intervalRef.current = window.setInterval(() => {
        setCurrentFrameIndex(prevIndex => (prevIndex + 1) % frames.length);
      }, 1000 / fps);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, frames.length, fps]);
  
  if (frames.length === 0) {
    return null;
  }
  
  const frameSrc = frames[currentFrameIndex];

  return (
    <div className="w-full aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
        {frameSrc && <img
            src={frameSrc}
            alt={`Frame ${currentFrameIndex + 1}`}
            className="w-full h-full object-contain"
        />}
    </div>
  );
};