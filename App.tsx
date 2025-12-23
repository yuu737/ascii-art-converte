
/// <reference lib="dom" />
import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { Dropzone } from './components/Dropzone';
import { FlipbookViewer } from './FlipbookViewer';
import { AsciiPlayer } from './AsciiPlayer';
import { Loader } from './Loader';
import { DownloadIcon, FilmIcon, SparklesIcon, XCircleIcon, MonochromeIcon, PencilIcon, PhotoIcon, CelShadingIcon, AnimationSketchIcon, ChevronDownIcon, EightBitIcon, AsciiArtIcon, ClipboardIcon, SilhouetteIcon, TransparentBgIcon, ImageIcon, PlayIcon, PauseIcon, LineArtIcon, CheckIcon } from './Icons';
import { applyPencilSketchEffect, applyCelShadingEffect, applyGengaEffect, apply8BitEffect, convertImageToAscii, applySilhouetteEffect, applyLineArtEffect, applyChromaKeyTransparency, applyFloodFillTransparency } from './services/imageEffects';

// --- Type Definitions ---
type Status = 'idle' | 'loading' | 'processing' | 'success' | 'error';
type Effect = 'none' | 'monochrome' | 'pencil' | 'cel' | 'genga' | '8bit' | 'ascii' | 'silhouette' | 'lineart' | 'transparency';
type TransparencyMode = 'chroma' | 'flood';

interface RangeBounds {
  min: number;
  max: number;
}

// --- Components ---
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 p-1 rounded-full">
                    <XCircleIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="p-6 overflow-y-auto leading-relaxed text-slate-600 text-sm space-y-4">
                {children}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
                    閉じる
                </button>
            </div>
        </div>
    </div>
);

const AdPlaceholder: React.FC<{ className?: string, label?: string }> = ({ className = "", label = "Advertisement" }) => (
    <div className={`w-full bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-xs font-bold tracking-widest uppercase select-none ${className}`}>
        {label}
    </div>
);

const SeoContent: React.FC = () => (
    <section className="max-w-4xl mx-auto px-6 py-20 border-t border-gray-100">
        <h2 className="text-3xl font-black text-slate-900 mb-10 text-center tracking-tight">
            なぜ「アート変換スタジオ」が選ばれるのか？
        </h2>
        
        <div className="grid md:grid-cols-2 gap-12">
            <article>
                <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <TransparentBgIcon className="w-6 h-6 text-emerald-500" />
                    高精度な背景透過・切り抜き
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                    従来のクロマキー処理に加え、高度な「領域拡張法（Flood Fill）」アルゴリズムを搭載。
                    被写体の内側にある同系色を誤って消すことなく、輪郭を認識して背景だけを綺麗に透明化します。
                    ECサイトの商品画像作成や、コラージュ素材の制作に最適です。
                </p>
            </article>

            <article>
                <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <AsciiArtIcon className="w-6 h-6 text-emerald-500" />
                    動画も変換できるアスキーアート
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                    静止画だけでなく、動画ファイル（MP4等）をそのまま動くアスキーアートに変換できます。
                    SNSでのシェアや、レトロなWebサイト演出に使えるユニークなテキストデータを瞬時に生成。
                    クリップボードへのコピーもワンクリックです。
                </p>
            </article>

            <article>
                <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <AnimationSketchIcon className="w-6 h-6 text-emerald-500" />
                    アニメ原画・線画抽出機能
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                    実写映像からエッジを検出し、アニメの原画や線画のようなスタイルに加工します。
                    イラスト作成のトレス素材として、あるいは映像作品のアクセントとして利用可能です。
                    すべての処理はブラウザ上で完結するため、巨大なファイルをアップロードする待ち時間もありません。
                </p>
            </article>

            <article>
                <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-emerald-500" />
                    完全無料・登録不要・安心安全
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                    当サイトはサーバーに画像を送信しません。すべての画像処理はお使いの端末（ブラウザ）のJavaScriptで行われます。
                    プライベートな写真や機密情報を含む画像でも、外部に流出する心配がなく安心してご利用いただけます。
                </p>
            </article>
        </div>
    </section>
);

const ImageAsciiViewer: React.FC<{ text: string }> = ({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(10);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !text) return;

    const updateFontSize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      const lines = text.split('\n');
      const asciiWidthChars = lines[0]?.length || 1;
      const asciiHeightChars = lines.length || 1;
      const charAspectRatio = 0.6; 

      const widthBasedFontSize = (width / asciiWidthChars) / charAspectRatio;
      const heightBasedFontSize = height / asciiHeightChars;
      
      const newSize = Math.floor(Math.min(widthBasedFontSize, heightBasedFontSize));
      setFontSize(Math.max(1, newSize));
    };

    updateFontSize();
    const observer = new ResizeObserver(updateFontSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div ref={containerRef} id="ascii-canvas-target" className="w-full h-full flex items-center justify-center bg-white overflow-hidden p-2 rounded-lg border border-slate-100 shadow-inner">
      <pre className="font-mono leading-none text-slate-900 font-bold select-all" style={{ fontSize: `${fontSize}px` }}>
        {text}
      </pre>
    </div>
  );
};

const Navbar: React.FC = () => (
    <nav className="w-full border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2.5">
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg p-1.5 shadow-lg shadow-emerald-200/50">
                        <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900">アート変換スタジオ</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 hidden sm:block">
                    v2.0.0
                </div>
            </div>
        </div>
    </nav>
);

interface FooterProps {
    onOpenModal: (type: 'terms' | 'privacy') => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenModal }) => (
    <footer className="bg-slate-50 border-t border-slate-200 py-16">
        {/* Ad Space above footer */}
        <div className="max-w-6xl mx-auto px-6 mb-12">
            <AdPlaceholder className="h-[90px]" label="Advertisement (Footer)" />
        </div>

        <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-slate-500" />
                </div>
            </div>
            <p className="text-slate-500 text-sm mb-6">
                アート変換スタジオは、クリエイターのための<br className="sm:hidden" />無料ブラウザツールです。
            </p>
            <div className="flex justify-center gap-6 text-sm text-slate-400 mb-8">
                <button onClick={() => onOpenModal('terms')} className="hover:text-emerald-600 transition-colors">利用規約</button>
                <button onClick={() => onOpenModal('privacy')} className="hover:text-emerald-600 transition-colors">プライバシー</button>
            </div>
            <div className="text-xs text-slate-300">
                &copy; {new Date().getFullYear()} Art Converter Studio. All rights reserved.
            </div>
        </div>
    </footer>
);

interface EffectButtonProps {
    label: string;
    icon?: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    disabled: boolean;
    description?: string;
}
const EffectButton: React.FC<EffectButtonProps> = ({ label, icon, isActive, onClick, disabled, description }) => {
    return (
        <button 
            type="button" 
            onClick={onClick} 
            disabled={disabled} 
            className={`
                group relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 w-full h-full min-h-[100px]
                ${isActive 
                    ? 'bg-emerald-50 border-emerald-500 shadow-[0_0_0_2px_#10b981] z-10' 
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <div className={`
                p-2.5 rounded-full mb-2 transition-colors
                ${isActive ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'}
            `}>
                {icon}
            </div>
            <span className={`font-bold text-xs sm:text-sm ${isActive ? 'text-emerald-900' : 'text-slate-600'}`}>{label}</span>
            {isActive && <div className="absolute top-2 right-2 text-emerald-500"><CheckIcon className="w-4 h-4" /></div>}
        </button>
    );
};

interface RangeSliderProps { min: number; max: number; value: number; onChange: (v: number) => void; disabled: boolean; }
const SimpleSlider: React.FC<RangeSliderProps> = ({ min, max, value, onChange, disabled }) => (
    <div className="flex items-center gap-4 w-full">
        <div className="flex-grow relative h-2 bg-slate-100 rounded-full overflow-hidden">
             <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{ width: `${((value - min) / (max - min)) * 100}%` }}></div>
             <input 
                type="range" 
                min={min} max={max} 
                value={Math.max(min, Math.min(max, value))} 
                onChange={e => onChange(parseInt(e.target.value))} 
                disabled={disabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
        </div>
        <span className="text-emerald-600 font-mono font-bold w-12 text-right bg-emerald-50 px-2 py-1 rounded text-xs">{value}</span>
    </div>
);

// --- Main App Component ---
export default function App(): React.ReactNode {
  const [status, setStatus] = useState<Status>('idle');
  const [loadingText, setLoadingText] = useState('');
  const [progress, setProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [originalFrames, setOriginalFrames] = useState<string[]>([]);
  const [processedFrames, setProcessedFrames] = useState<string[]>([]);
  const [asciiFrames, setAsciiFrames] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processedAsciiText, setProcessedAsciiText] = useState<string>('');
  
  // Effects Config
  const [effect, setEffect] = useState<Effect>('ascii');
  const [fps, setFps] = useState(12);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Settings Visibility
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Modal State
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  // Detailed ASCII Config Values
  const [asciiWidth, setAsciiWidth] = useState<number>(200);
  const [asciiInvertColors, setAsciiInvertColors] = useState(true);
  const [asciiOutlineMode, setAsciiOutlineMode] = useState(true);
  const [asciiTransparentBg, setAsciiTransparentBg] = useState(true);

  const [eightBitPixelSize, setEightBitPixelSize] = useState(8);
  const [genericThreshold, setGenericThreshold] = useState(150);
  const [gengaColorfulLines, setGengaColorfulLines] = useState(true);

  // Transparency Settings
  const [bgThreshold, setBgThreshold] = useState(90);
  const [transparencyMode, setTransparencyMode] = useState<TransparencyMode>('flood');

  // Detailed Bounds Config (Limits)
  const [asciiWidthBounds, setAsciiWidthBounds] = useState<RangeBounds>({ min: 40, max: 300 });
  const [eightBitPixelSizeBounds, setEightBitPixelSizeBounds] = useState<RangeBounds>({ min: 2, max: 24 });
  const [genericThresholdBounds, setGenericThresholdBounds] = useState<RangeBounds>({ min: 10, max: 255 });
  const [bgThresholdBounds, setBgThresholdBounds] = useState<RangeBounds>({ min: 1, max: 200 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasFile = !!videoFile || !!imageFile;
  const isProcessing = status === 'processing' || status === 'loading';

  const isTransparentFormat = effect === 'transparency';

  // --- Logic Handlers ---
  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setVideoFile(null); setImageFile(null); setVideoPreviewUrl(null); setImagePreviewUrl(null);
    setOriginalFrames([]); setProcessedFrames([]); setAsciiFrames([]);
    setProcessedImageUrl(null); setProcessedAsciiText('');
    if (file.type.startsWith('video/')) {
        setVideoFile(file); 
        const url = URL.createObjectURL(file);
        setVideoPreviewUrl(url);
    } else if (file.type.startsWith('image/')) {
        setImageFile(file); setImagePreviewUrl(URL.createObjectURL(file));
    }
    setStatus('idle');
    // Auto scroll to result area slightly if needed (optional)
  };

  const getDownloadFilename = (extension: string) => {
    const file = videoFile || imageFile;
    const fileName = file ? file.name : "converted";
    const namePart = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
    return `${namePart}_art.${extension}`;
  };

  const handleDownloadAsciiImage = () => {
    if (!processedAsciiText) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const lines = processedAsciiText.split('\n');
    const fontSize = 24; 
    ctx.font = `bold ${fontSize}px monospace`;
    
    const maxLineWidth = lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);
    const padding = 40;
    canvas.width = maxLineWidth + padding * 2;
    canvas.height = (lines.length * fontSize) + padding * 2;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Black text
    ctx.fillStyle = '#111827';
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textBaseline = 'top';
    
    lines.forEach((line, i) => {
        ctx.fillText(line, padding, padding + (i * fontSize));
    });
    
    const link = document.createElement('a');
    link.download = getDownloadFilename('png');
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const applyEffectOnFrames = useCallback(async (sourceFrames: string[]) => {
    if (sourceFrames.length === 0 || !canvasRef.current) return;
    setLoadingText('エフェクト適用中...');
    setStatus('processing');
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const total = sourceFrames.length;
    
    if (effect === 'ascii') {
        const results: string[] = [];
        for(let i=0; i<total; i++) {
            const img = new Image(); img.src = sourceFrames[i];
            await new Promise(r => img.onload = r);
            canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0);
            results.push(convertImageToAscii(
                ctx, 
                img.width, 
                img.height, 
                asciiWidth, 
                asciiOutlineMode ? { threshold: genericThreshold } : undefined, 
                asciiTransparentBg ? { threshold: bgThreshold } : undefined, 
                asciiInvertColors
            ));
            setProgress(Math.round(((i+1)/total)*100));
        }
        setAsciiFrames(results);
        setProcessedFrames([]);
    } else {
        const results: string[] = [];
        for(let i=0; i<total; i++) {
            const img = new Image(); img.src = sourceFrames[i];
            await new Promise(r => img.onload = r);
            canvas.width = img.width; canvas.height = img.height;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.filter = effect === 'monochrome' ? 'grayscale(100%)' : 'none';
            ctx.drawImage(img, 0, 0);
            
            if (effect === 'pencil') applyPencilSketchEffect(ctx, canvas.width, canvas.height);
            else if (effect === '8bit') apply8BitEffect(ctx, canvas.width, canvas.height, eightBitPixelSize);
            else if (effect === 'cel') applyCelShadingEffect(ctx, canvas.width, canvas.height);
            else if (effect === 'genga') applyGengaEffect(ctx, canvas.width, canvas.height, {outline: gengaColorfulLines ? 'colorful' : '#000000', shadow: '#555555', highlight: '#ffffff'}, true, genericThreshold);
            else if (effect === 'silhouette') applySilhouetteEffect(ctx, canvas.width, canvas.height, genericThreshold);
            else if (effect === 'lineart') applyLineArtEffect(ctx, canvas.width, canvas.height, genericThreshold);
            else if (effect === 'transparency') {
                if (transparencyMode === 'flood') {
                    applyFloodFillTransparency(ctx, canvas.width, canvas.height, bgThreshold);
                } else {
                    applyChromaKeyTransparency(ctx, canvas.width, canvas.height, bgThreshold);
                }
            }

            results.push(canvas.toDataURL(isTransparentFormat ? 'image/png' : 'image/jpeg', 0.8));
            setProgress(Math.round(((i+1)/total)*100));
        }
        setProcessedFrames(results);
        setAsciiFrames([]);
    }
    setStatus('success');
  }, [effect, asciiWidth, asciiInvertColors, asciiOutlineMode, asciiTransparentBg, eightBitPixelSize, genericThreshold, bgThreshold, isTransparentFormat, transparencyMode, gengaColorfulLines]);

  const handleVideoExtract = useCallback(async () => {
    if (!videoPreviewUrl || !videoRef.current || !canvasRef.current) return;
    setStatus('processing');
    setLoadingText('ビデオを解析中...');
    setProgress(0);
    
    const video = videoRef.current;
    if (video.src !== videoPreviewUrl) video.src = videoPreviewUrl;
    
    if (video.readyState < 1) {
      await new Promise(r => video.onloadedmetadata = r);
    }

    const duration = video.duration;
    const interval = 1 / fps;
    const frames: string[] = [];
    
    const scale = Math.min(1, 400 / video.videoWidth);
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    let currentTime = 0;
    while (currentTime < duration) {
        video.currentTime = currentTime;
        await new Promise<void>((resolve) => {
            let resolved = false;
            const onSeeked = () => {
                if (resolved) return;
                resolved = true;
                video.removeEventListener('seeked', onSeeked);
                resolve();
            };
            video.addEventListener('seeked', onSeeked);
            setTimeout(onSeeked, 500);
        });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.6));
        currentTime += interval;
        setProgress(Math.round(Math.min(100, (currentTime / duration) * 100)));
    }
    setOriginalFrames(frames);
    await applyEffectOnFrames(frames);
  }, [videoPreviewUrl, fps, applyEffectOnFrames]);

  const handleImageEffect = useCallback(async () => {
    if (!imagePreviewUrl || !canvasRef.current) return;
    setStatus('processing'); setLoadingText('処理中...');
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d')!;
    const img = new Image(); img.src = imagePreviewUrl;
    await new Promise(r => img.onload = r);
    canvas.width = img.width; canvas.height = img.height;

    if (effect === 'ascii') {
        ctx.drawImage(img, 0, 0);
        setProcessedAsciiText(convertImageToAscii(
            ctx, 
            img.width, 
            img.height, 
            asciiWidth, 
            asciiOutlineMode ? { threshold: genericThreshold } : undefined, 
            asciiTransparentBg ? { threshold: bgThreshold } : undefined, 
            asciiInvertColors
        ));
        setProcessedImageUrl(null);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = effect === 'monochrome' ? 'grayscale(100%)' : 'none';
        ctx.drawImage(img, 0, 0);
        
        if (effect === 'pencil') applyPencilSketchEffect(ctx, canvas.width, canvas.height);
        else if (effect === '8bit') apply8BitEffect(ctx, canvas.width, canvas.height, eightBitPixelSize);
        else if (effect === 'cel') applyCelShadingEffect(ctx, canvas.width, canvas.height);
        else if (effect === 'genga') applyGengaEffect(ctx, canvas.width, canvas.height, {outline: gengaColorfulLines ? 'colorful' : '#000000', shadow: '#555555', highlight: '#ffffff'}, true, genericThreshold);
        else if (effect === 'silhouette') applySilhouetteEffect(ctx, canvas.width, canvas.height, genericThreshold);
        else if (effect === 'lineart') applyLineArtEffect(ctx, canvas.width, canvas.height, genericThreshold);
        else if (effect === 'transparency') {
             if (transparencyMode === 'flood') {
                applyFloodFillTransparency(ctx, canvas.width, canvas.height, bgThreshold);
            } else {
                applyChromaKeyTransparency(ctx, canvas.width, canvas.height, bgThreshold);
            }
        }

        setProcessedImageUrl(canvas.toDataURL(isTransparentFormat ? 'image/png' : 'image/jpeg', 0.9));
        setProcessedAsciiText('');
    }
    setStatus('success');
  }, [imagePreviewUrl, effect, asciiWidth, asciiInvertColors, asciiOutlineMode, asciiTransparentBg, eightBitPixelSize, genericThreshold, bgThreshold, isTransparentFormat, transparencyMode, gengaColorfulLines]);

  useEffect(() => {
    if (isProcessing) return;
    setProcessedImageUrl(null);
    setProcessedAsciiText('');
    setProcessedFrames([]);
    setAsciiFrames([]);
    setStatus('idle');
  }, [effect]);

  useEffect(() => {
      if (videoFile && !isProcessing) handleVideoExtract();
  }, [videoFile, fps]);

  useEffect(() => { 
    if (imageFile && !isProcessing) handleImageEffect(); 
    if (originalFrames.length > 0 && !isProcessing) applyEffectOnFrames(originalFrames);
  }, [imageFile, originalFrames, effect, asciiWidth, asciiInvertColors, asciiOutlineMode, asciiTransparentBg, eightBitPixelSize, genericThreshold, bgThreshold, transparencyMode, gengaColorfulLines]);

  const renderAdvancedSettings = () => (
    <div className="mt-6 p-5 bg-slate-50 rounded-xl border border-slate-200 text-sm animate-fade-in shadow-inner">
      <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <SparklesIcon className="w-4 h-4 text-emerald-500" />
        パラメータの上級者設定
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 block">アスキーアート最大文字幅</label>
          <div className="flex gap-2">
            <input type="number" value={asciiWidthBounds.min} onChange={e => setAsciiWidthBounds({...asciiWidthBounds, min: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Min" />
            <input type="number" value={asciiWidthBounds.max} onChange={e => setAsciiWidthBounds({...asciiWidthBounds, max: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Max" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 block">8bitピクセルサイズ範囲</label>
          <div className="flex gap-2">
            <input type="number" value={eightBitPixelSizeBounds.min} onChange={e => setEightBitPixelSizeBounds({...eightBitPixelSizeBounds, min: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Min" />
            <input type="number" value={eightBitPixelSizeBounds.max} onChange={e => setEightBitPixelSizeBounds({...eightBitPixelSizeBounds, max: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Max" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 block">輪郭しきい値の範囲</label>
          <div className="flex gap-2">
            <input type="number" value={genericThresholdBounds.min} onChange={e => setGenericThresholdBounds({...genericThresholdBounds, min: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Min" />
            <input type="number" value={genericThresholdBounds.max} onChange={e => setGenericThresholdBounds({...genericThresholdBounds, max: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Max" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 block">透過許容量の範囲</label>
          <div className="flex gap-2">
             <input type="number" value={bgThresholdBounds.min} onChange={e => setBgThresholdBounds({...bgThresholdBounds, min: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Min" />
             <input type="number" value={bgThresholdBounds.max} onChange={e => setBgThresholdBounds({...bgThresholdBounds, max: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Max" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfig = () => (
    <div className="bg-white rounded-2xl overflow-hidden">
        {/* Effect Grid */}
        <div className="p-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block px-2">スタイルを選択</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3">
                <EffectButton label="アスキー" isActive={effect === 'ascii'} onClick={() => setEffect('ascii')} disabled={isProcessing} icon={<AsciiArtIcon className="w-6 h-6" />} />
                <EffectButton label="背景透過" isActive={effect === 'transparency'} onClick={() => setEffect('transparency')} disabled={isProcessing} icon={<TransparentBgIcon className="w-6 h-6" />} />
                <EffectButton label="鉛筆画" isActive={effect === 'pencil'} onClick={() => setEffect('pencil')} disabled={isProcessing} icon={<PencilIcon className="w-6 h-6" />} />
                <EffectButton label="8bit" isActive={effect === '8bit'} onClick={() => setEffect('8bit')} disabled={isProcessing} icon={<EightBitIcon className="w-6 h-6" />} />
                <EffectButton label="モノクロ" isActive={effect === 'monochrome'} onClick={() => setEffect('monochrome')} disabled={isProcessing} icon={<MonochromeIcon className="w-6 h-6" />} />
                <EffectButton label="シルエット" isActive={effect === 'silhouette'} onClick={() => setEffect('silhouette')} disabled={isProcessing} icon={<SilhouetteIcon className="w-6 h-6" />} />
                <EffectButton label="線画" isActive={effect === 'lineart'} onClick={() => setEffect('lineart')} disabled={isProcessing} icon={<LineArtIcon className="w-6 h-6" />} />
                <EffectButton label="セル画" isActive={effect === 'cel'} onClick={() => setEffect('cel')} disabled={isProcessing} icon={<CelShadingIcon className="w-6 h-6" />} />
                <EffectButton label="アニメ原画" isActive={effect === 'genga'} onClick={() => setEffect('genga')} disabled={isProcessing} icon={<AnimationSketchIcon className="w-6 h-6" />} />
            </div>
        </div>
        
        {/* Settings Panel */}
        <div className="mt-8 bg-slate-50/80 border border-slate-100 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
                 <h4 className="text-sm font-black text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    詳細調整
                 </h4>
                 <button onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${showAdvancedSettings ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
                     {showAdvancedSettings ? '閉じる' : '上級者設定'}
                 </button>
            </div>
            
            <div className="space-y-6">
                {effect === 'ascii' && (
                    <div className="space-y-6">
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-2">解像度（文字幅）</span>
                            <SimpleSlider min={asciiWidthBounds.min} max={asciiWidthBounds.max} value={asciiWidth} onChange={setAsciiWidth} disabled={isProcessing} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${asciiInvertColors ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                                <input type="checkbox" checked={asciiInvertColors} onChange={e => setAsciiInvertColors(e.target.checked)} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
                                <span className={`text-sm font-bold ${asciiInvertColors ? 'text-emerald-900' : 'text-slate-600'}`}>色を反転</span>
                            </label>
                            <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${asciiOutlineMode ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                                <input type="checkbox" checked={asciiOutlineMode} onChange={e => setAsciiOutlineMode(e.target.checked)} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
                                <span className={`text-sm font-bold ${asciiOutlineMode ? 'text-emerald-900' : 'text-slate-600'}`}>輪郭抽出モード</span>
                            </label>
                            <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${asciiTransparentBg ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                                <input type="checkbox" checked={asciiTransparentBg} onChange={e => setAsciiTransparentBg(e.target.checked)} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
                                <span className={`text-sm font-bold ${asciiTransparentBg ? 'text-emerald-900' : 'text-slate-600'}`}>背景透過モード</span>
                            </label>
                        </div>
                        
                        {(asciiOutlineMode || asciiTransparentBg) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                                {asciiOutlineMode && (
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 block mb-2">輪郭のしきい値</span>
                                        <SimpleSlider min={genericThresholdBounds.min} max={genericThresholdBounds.max} value={genericThreshold} onChange={setGenericThreshold} disabled={isProcessing} />
                                    </div>
                                )}
                                {asciiTransparentBg && (
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 block mb-2">透過の許容範囲</span>
                                        <SimpleSlider min={bgThresholdBounds.min} max={bgThresholdBounds.max} value={bgThreshold} onChange={setBgThreshold} disabled={isProcessing} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {effect === 'transparency' && (
                    <div className="space-y-6">
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-3">透過アルゴリズム</span>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${transparencyMode === 'flood' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    <input type="radio" name="transMode" checked={transparencyMode === 'flood'} onChange={() => setTransparencyMode('flood')} className="hidden" />
                                    <span className="font-bold text-sm">領域拡張 (推奨)</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${transparencyMode === 'chroma' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    <input type="radio" name="transMode" checked={transparencyMode === 'chroma'} onChange={() => setTransparencyMode('chroma')} className="hidden" />
                                    <span className="font-bold text-sm">クロマキー (全体)</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-2">色の許容範囲（感度）</span>
                            <SimpleSlider min={bgThresholdBounds.min} max={bgThresholdBounds.max} value={bgThreshold} onChange={setBgThreshold} disabled={isProcessing} />
                            <p className="text-[10px] text-slate-400 mt-1 text-right">※ 左上のピクセル色を基準に判定します</p>
                        </div>
                    </div>
                )}

                {effect === '8bit' && (
                    <div>
                        <span className="text-xs font-bold text-slate-500 block mb-2">ピクセルサイズ（粗さ）</span>
                        <SimpleSlider min={eightBitPixelSizeBounds.min} max={eightBitPixelSizeBounds.max} value={eightBitPixelSize} onChange={setEightBitPixelSize} disabled={isProcessing} />
                    </div>
                )}

                {effect === 'genga' && (
                    <div className="space-y-6">
                         <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${gengaColorfulLines ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                            <input type="checkbox" checked={gengaColorfulLines} onChange={e => setGengaColorfulLines(e.target.checked)} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
                            <span className={`text-sm font-bold ${gengaColorfulLines ? 'text-emerald-900' : 'text-slate-600'}`}>元の画像の色で線を描画</span>
                        </label>
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-2">エフェクト強度（しきい値）</span>
                            <SimpleSlider min={genericThresholdBounds.min} max={genericThresholdBounds.max} value={genericThreshold} onChange={setGenericThreshold} disabled={isProcessing} />
                        </div>
                    </div>
                )}

                {(effect === 'silhouette' || effect === 'lineart') && (
                    <div>
                        <span className="text-xs font-bold text-slate-500 block mb-2">エフェクト強度（しきい値）</span>
                        <SimpleSlider min={genericThresholdBounds.min} max={genericThresholdBounds.max} value={genericThreshold} onChange={setGenericThreshold} disabled={isProcessing} />
                    </div>
                )}
                
                {videoFile && (
                   <div className="pt-4 border-t border-slate-200/50">
                       <span className="text-xs font-bold text-slate-500 block mb-2">動画フレームレート (FPS)</span>
                       <SimpleSlider min={1} max={30} value={fps} onChange={setFps} disabled={isProcessing} />
                   </div>
                )}
                
                {['pencil', 'cel', 'monochrome'].includes(effect) && (
                     <div className="text-center py-4">
                        <p className="text-sm text-slate-400">このスタイルには調整可能な基本設定はありません</p>
                    </div>
                )}
            </div>

            {showAdvancedSettings && renderAdvancedSettings()}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-50 border-b border-slate-100">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-transparent to-transparent opacity-70"></div>
        <div className="max-w-4xl mx-auto px-6 py-20 sm:py-24 text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                画像と動画を、<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">一瞬でアートにする。</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                インストール不要、完全無料。アスキーアート、背景透過、アニメ風加工など、
                あなたのクリエイティブをブラウザひとつで加速させます。
            </p>
            <div className="flex justify-center gap-4 text-sm font-bold text-slate-500 mb-10">
                <span className="flex items-center gap-1.5"><CheckIcon className="w-4 h-4 text-emerald-500" /> 登録不要</span>
                <span className="flex items-center gap-1.5"><CheckIcon className="w-4 h-4 text-emerald-500" /> 完全無料</span>
                <span className="flex items-center gap-1.5"><CheckIcon className="w-4 h-4 text-emerald-500" /> プライバシー保護</span>
            </div>

            {/* Ad Space below Hero */}
            <div className="max-w-2xl mx-auto">
                <AdPlaceholder className="h-[90px]" label="Advertisement (Top Banner)" />
            </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-16 flex-grow">
        
        <div className="space-y-16">
            {/* STEP 1: Process Selection */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-slate-200">1</div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">スタイルと設定を決める</h2>
                </div>
                {renderConfig()}
            </section>

            {/* STEP 2: File Upload / Result */}
            <section>
                <div className="flex justify-between items-end mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-slate-200">2</div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {hasFile ? '変換結果' : 'ファイルをアップロード'}
                        </h2>
                    </div>
                    {hasFile && (
                        <button onClick={() => {setVideoFile(null); setImageFile(null); setStatus('idle');}} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors">
                            やり直す
                        </button>
                    )}
                </div>

                {!hasFile ? (
                    <Dropzone onFileSelect={handleFileSelect} disabled={isProcessing} accept="video/*,image/*" />
                ) : (
                    <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-10">
                            <div className="flex-1 min-w-0">
                                <div className="aspect-video bg-white rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center relative shadow-sm">
                                    {isProcessing ? <Loader progress={progress} statusText={loadingText} /> : 
                                     status === 'success' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2YxZjVZjkiPjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgLz48L3N2Zz4=')]">
                                            {effect === 'ascii' ? (
                                                imageFile ? (processedAsciiText && <ImageAsciiViewer text={processedAsciiText} />) : (asciiFrames.length > 0 && <AsciiPlayer frames={asciiFrames} fps={fps} isPlaying={isPlaying} />)
                                            ) : (
                                                imageFile ? (processedImageUrl && <img src={processedImageUrl} className="max-w-full max-h-full object-contain" />) : (processedFrames.length > 0 && <FlipbookViewer frames={processedFrames} fps={fps} isPlaying={isPlaying} />)
                                            )}
                                        </div>
                                     ) : <div className="text-slate-300 flex flex-col items-center"><PhotoIcon className="w-24 h-24 mb-4" /><span className="text-sm font-medium">プレビュー待機中...</span></div>}
                                </div>
                                {videoFile && status === 'success' && (
                                    <div className="mt-6 flex justify-center">
                                        <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-black hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                            {isPlaying ? <><PauseIcon className="w-5 h-5" /> ストップ</> : <><PlayIcon className="w-5 h-5" /> 再生する</>}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {(status === 'success' && (effect === 'ascii' ? processedAsciiText : (processedImageUrl || processedFrames.length > 0))) && (
                                <div className="w-full lg:w-80 flex flex-col gap-6">
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">ダウンロード・共有</h3>
                                        <div className="space-y-3">
                                            {effect === 'ascii' && processedAsciiText && (
                                                <>
                                                <button onClick={() => {navigator.clipboard.writeText(processedAsciiText); alert('コピーしました！');}} className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all active:scale-95"><ClipboardIcon className="w-5 h-5" /> テキストをコピー</button>
                                                <button onClick={handleDownloadAsciiImage} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"><PhotoIcon className="w-5 h-5" /> 画像として保存</button>
                                                </>
                                            )}
                                            {effect !== 'ascii' && processedImageUrl && (
                                                <a href={processedImageUrl} download={getDownloadFilename(isTransparentFormat ? "png" : "jpg")} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-black shadow-lg shadow-slate-200 transition-all active:scale-95"><DownloadIcon className="w-5 h-5" /> {isTransparentFormat ? "PNGで保存" : "JPEGで保存"}</a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <p className="text-xs text-emerald-800 leading-relaxed">
                                            <strong>Tips:</strong><br/>
                                            変換処理はすべてあなたのブラウザ内で行われました。<br/>
                                            画像データが外部サーバーに送信されることはありません。
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

             {/* Ad Space Bottom (After Result) */}
             <div className="flex justify-center py-8">
                <AdPlaceholder className="w-full max-w-3xl h-[250px]" label="Advertisement" />
            </div>
        </div>
      </main>
      
      <SeoContent />
      <Footer onOpenModal={setActiveModal} />

      {/* Modals */}
      {activeModal === 'terms' && (
        <Modal title="利用規約" onClose={() => setActiveModal(null)}>
            <h4 className="font-bold text-slate-900">1. 本サービスの利用について</h4>
            <p>アート変換スタジオ（以下、当サービス）は、ユーザーがブラウザ上で画像や動画を加工できる無料ツールです。商用・非商用問わずご自由にお使いいただけます。</p>
            <h4 className="font-bold text-slate-900">2. 免責事項</h4>
            <p>当サービスを利用した結果生じたいかなる損害（データの損失、業務の中断、精神的苦痛等）についても、運営者は一切の責任を負いません。加工した画像の使用はユーザー自身の責任で行ってください。</p>
            <h4 className="font-bold text-slate-900">3. 禁止事項</h4>
            <p>当サービスを用いて、公序良俗に反する画像、違法な画像、他者の権利を侵害する画像を生成・公開する行為を禁止します。</p>
        </Modal>
      )}
      {activeModal === 'privacy' && (
        <Modal title="プライバシーポリシー" onClose={() => setActiveModal(null)}>
             <h4 className="font-bold text-slate-900">1. データは送信されません</h4>
             <p>当サービスは「クライアントサイド処理」を採用しています。あなたがアップロードした画像や動画ファイルが、当サービスのサーバーや外部の第三者に送信されることは一切ありません。すべての画像処理はお使いのデバイス（PC、スマホ）のブラウザ内で行われます。</p>
             
             <h4 className="font-bold text-slate-900 mt-4">2. 広告配信とCookieについて</h4>
             <p>当サイトでは、第三者配信の広告サービス「Google Adsense（グーグルアドセンス）」を利用しています。</p>
             <p className="mt-2">広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookie（クッキー）を使用することがあります。これには、ユーザーが当サイトや他のサイトに過去にアクセスした際の情報が含まれます。</p>
             <p className="mt-2">ユーザーは、広告設定でパーソナライズ広告を無効にすることができます。また、<a href="https://www.aboutads.info" target="_blank" rel="noreferrer" className="text-emerald-600 underline">www.aboutads.info</a> にアクセスすれば、パーソナライズ広告に使われる第三者配信事業者の Cookie を無効にすることができます。</p>
        </Modal>
      )}

      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
