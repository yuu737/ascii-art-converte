/// <reference lib="dom" />
import React, { useState, useRef } from 'react';
import { UploadIcon, PhotoIcon, FilmIcon } from '../Icons';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
  accept?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, disabled, accept }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0]);
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`group relative flex flex-col items-center justify-center w-full min-h-[300px] border-2 border-dashed rounded-2xl transition-all cursor-pointer bg-gray-50 
        ${isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' : 'border-gray-300 hover:border-emerald-400 hover:bg-white'} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className={`p-5 rounded-full bg-white shadow-sm border border-gray-100 transition-colors ${isDragging ? 'text-emerald-500' : 'text-gray-400 group-hover:text-emerald-500'}`}>
            <UploadIcon className="w-10 h-10" />
        </div>
        <div className="text-center">
            <p className="text-lg font-bold text-gray-700">クリックまたはドラッグ＆ドロップ</p>
            <p className="text-sm text-gray-400 mt-1">動画ファイル・画像ファイルをここに選択</p>
        </div>
        <div className="flex gap-4 mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span className="flex items-center gap-1"><FilmIcon className="w-4 h-4" /> Video</span>
            <span className="flex items-center gap-1"><PhotoIcon className="w-4 h-4" /> Image</span>
        </div>
      </div>
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={e => e.target.files?.[0] && onFileSelect(e.target.files[0])} disabled={disabled} />
    </div>
  );
};