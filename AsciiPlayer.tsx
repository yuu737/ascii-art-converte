/// <reference lib="dom" />
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';

interface AsciiPlayerProps {
  frames: string[];
  fps: number;
  isPlaying: boolean;
}

export const AsciiPlayer: React.FC<AsciiPlayerProps> = ({ frames, fps, isPlaying }) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [fontSize, setFontSize] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentFrameIndex(0);
  }, [frames]);

  useEffect(() => {
    if (isPlaying && frames.length > 0) {
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

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (frames.length === 0 || !container) return;
      
      const { width, height } = container.getBoundingClientRect();
      if(width === 0 || height === 0) return;

      const firstFrame = frames[0];
      const lines = firstFrame.split('\n');
      const asciiWidthChars = lines[0]?.length || 1;
      const asciiHeightChars = lines.length || 1;
      
      const charAspectRatio = 0.6; 
      
      const widthBasedFontSize = (width / asciiWidthChars) / charAspectRatio;
      const heightBasedFontSize = height / asciiHeightChars;
      
      const newSize = Math.floor(Math.min(widthBasedFontSize, heightBasedFontSize));
      setFontSize(Math.max(1, newSize));
    });

    observer.observe(container);
    
    if (container.clientWidth > 0 && container.clientHeight > 0 && frames.length > 0) {
        const { width, height } = container.getBoundingClientRect();
        const firstFrame = frames[0];
        const lines = firstFrame.split('\n');
        const asciiWidthChars = lines[0]?.length || 1;
        const asciiHeightChars = lines.length || 1;
        const charAspectRatio = 0.6;
        const widthBasedFontSize = (width / asciiWidthChars) / charAspectRatio;
        const heightBasedFontSize = height / asciiHeightChars;
        const newSize = Math.floor(Math.min(widthBasedFontSize, heightBasedFontSize));
        setFontSize(Math.max(1, newSize));
    }

    return () => observer.disconnect();
  }, [frames]);
  
  if (frames.length === 0) {
    return null;
  }

  const frameText = frames[currentFrameIndex];

  return (
    <div ref={containerRef} className="w-full h-full bg-white rounded-md flex items-center justify-center overflow-hidden p-1">
      {frameText && <pre
        className="font-mono leading-none text-black font-bold"
        style={{ fontSize: `${fontSize}px` }}
        aria-live="polite"
        aria-atomic="true"
      >
        {frameText}
      </pre>}
    </div>
  );
};
