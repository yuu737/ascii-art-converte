import React from 'react';

interface LoaderProps {
  progress?: number;
  statusText?: string;
}

export const Loader: React.FC<LoaderProps> = ({ progress, statusText }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-gray-600">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-gray-200"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
          />
          <circle
            className="text-emerald-500"
            strokeWidth="10"
            strokeDasharray={251.2}
            strokeDashoffset={251.2 - (progress || 0) / 100 * 251.2}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-emerald-600">
            {progress !== undefined ? `${progress}%` : ''}
        </span>
      </div>
      {statusText && <p className="mt-4 text-xs font-bold tracking-wider uppercase text-gray-400 animate-pulse">{statusText}</p>}
    </div>
  );
};