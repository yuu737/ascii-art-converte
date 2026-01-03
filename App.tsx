
/// <reference lib="dom" />
import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { Dropzone } from './components/Dropzone';
import { FlipbookViewer } from './FlipbookViewer';
import { AsciiPlayer } from './AsciiPlayer';
import { Loader } from './Loader';
import { DownloadIcon, SparklesIcon, XCircleIcon, MonochromeIcon, PencilIcon, PhotoIcon, AnimationSketchIcon, EightBitIcon, AsciiArtIcon, ClipboardIcon, SilhouetteIcon, TransparentBgIcon, PlayIcon, PauseIcon, CheckIcon } from './Icons';
import { applyPencilSketchEffect, applyCelShadingEffect, applyGengaEffect, apply8BitEffect, convertImageToAscii, applySilhouetteEffect, applyLineArtEffect, applyChromaKeyTransparency, applyFloodFillTransparency } from './services/imageEffects';

// --- Type Definitions ---
type Status = 'idle' | 'loading' | 'processing' | 'success' | 'error';
type Effect = 'none' | 'monochrome' | 'pencil' | 'cel' | 'genga' | '8bit' | 'ascii' | 'silhouette' | 'lineart' | 'transparency';
type TransparencyMode = 'chroma' | 'flood';
type Language = 'en' | 'ja';

interface RangeBounds {
  min: number;
  max: number;
}

// --- Translations ---
const TRANSLATIONS = {
    en: {
        meta_title: "Art Converter Studio | Free Image to ASCII, Transparent & Anime Style",
        meta_description: "No registration required, completely free. Instantly convert images and videos into ASCII art, remove backgrounds, or create anime-style effects. Secure browser-based processing.",
        
        app_title: "Art Converter Studio",
        hero_title_1: "Turn Images & Videos",
        hero_title_2: "Into Art Instantly.",
        hero_desc: "No install, completely free. Convert your media into ASCII art, transparent backgrounds, or anime-style effects directly in your browser.",
        
        intro_text: "Art Converter Studio is a 100% free online tool that processes your images and videos locally. From background removal to ASCII art generation, unleash your creativity securely without uploading data to any server.",

        feature_no_reg: "No Registration",
        feature_free: "Completely Free",
        feature_privacy: "Privacy Focused",
        
        step_1_title: "Choose Style & Settings",
        step_2_title: "Upload File",
        step_2_result: "Conversion Result",
        btn_retry: "Start Over",
        btn_play: "Play",
        btn_stop: "Stop",
        btn_copy: "Copy Text",
        btn_save_img: "Save as Image",
        btn_save_png: "Save as PNG",
        btn_save_jpg: "Save as JPEG",
        tips_title: "Tips:",
        tips_desc: "All processing was done within your browser. No image data was sent to any external server.",
        download_share: "Download & Share",
        
        preview_waiting: "Waiting for preview...",
        processing: "Processing...",
        analyzing_video: "Analyzing video...",
        applying_effect: "Applying effect...",
        copied: "Copied!",

        style_select: "SELECT STYLE",
        style_ascii: "ASCII Art",
        style_transparency: "Transparent",
        style_genga: "Anime Line",
        style_pencil: "Pencil",
        style_8bit: "8-Bit",
        style_monochrome: "Mono",

        settings_detail: "Detailed Adjustments",
        settings_advanced: "Advanced",
        settings_close: "Close",
        
        lbl_resolution: "Resolution (Width)",
        lbl_invert: "Invert Colors",
        lbl_outline_mode: "Outline Mode",
        lbl_bg_trans_mode: "Transparent BG",
        lbl_outline_thresh: "Outline Threshold",
        lbl_trans_tolerance: "Transparency Tolerance",
        lbl_pixel_size: "Pixel Size",
        lbl_original_color: "Use Original Colors",
        lbl_effect_strength: "Effect Strength",
        lbl_fps: "Video Frame Rate (FPS)",
        lbl_algorithm: "Algorithm",
        lbl_algo_flood: "Flood Fill (Best)",
        lbl_algo_chroma: "Chroma Key (Simple)",
        lbl_tolerance_hint: "* Based on top-left pixel color",
        
        no_settings: "No basic settings available for this style.",
        
        adv_title: "Advanced Parameters",
        adv_ascii_width: "ASCII Max Width",
        adv_8bit_size: "8-bit Pixel Size Range",
        adv_contour: "Contour Threshold Range",
        adv_trans: "Transparency Tolerance Range",
        
        footer_desc: "Art Converter Studio is a free browser tool for creators.",
        footer_terms: "Terms of Service",
        footer_privacy: "Privacy Policy",
        footer_rights: "All rights reserved.",
        
        legal_terms_title: "Terms of Service",
        legal_privacy_title: "Privacy Policy",
        legal_contact_title: "Operator / Contact",
        
        profile_name: "yuu",
        profile_title: "University Student / Web Developer",
        profile_desc: "I am a university student studying programming. I created this tool to apply what I've learned about image processing algorithms. My goal is to create useful web apps that respect user privacy.",
    },
    ja: {
        meta_title: "アート変換スタジオ | 無料で画像を背景透過・アスキーアート・アニメ風に加工",
        meta_description: "登録不要、完全無料。画像や動画をアスキーアート、背景透過、アニメ風に一瞬で変換できるWebツール。ブラウザ上で処理が完結するためプライバシーも安心です。",

        app_title: "アート変換スタジオ",
        hero_title_1: "画像と動画を、",
        hero_title_2: "一瞬でアートにする。",
        hero_desc: "インストール不要、完全無料。アスキーアート、背景透過、アニメ風加工など、あなたのクリエイティブをブラウザひとつで加速させます。",
        
        intro_text: "アート変換スタジオは、画像をサーバーに送信せず、ブラウザだけで安全に加工できる100%無料のWebツールです。背景透過からアスキーアート生成まで、登録不要ですぐに使えます。",

        feature_no_reg: "登録不要",
        feature_free: "完全無料",
        feature_privacy: "プライバシー保護",
        
        step_1_title: "スタイルと設定を決める",
        step_2_title: "ファイルをアップロード",
        step_2_result: "変換結果",
        btn_retry: "やり直す",
        btn_play: "再生する",
        btn_stop: "ストップ",
        btn_copy: "テキストをコピー",
        btn_save_img: "画像として保存",
        btn_save_png: "PNGで保存",
        btn_save_jpg: "JPEGで保存",
        tips_title: "Tips:",
        tips_desc: "変換処理はすべてあなたのブラウザ内で行われました。画像データが外部サーバーに送信されることはありません。",
        download_share: "ダウンロード・共有",
        
        preview_waiting: "プレビュー待機中...",
        processing: "処理中...",
        analyzing_video: "ビデオを解析中...",
        applying_effect: "エフェクト適用中...",
        copied: "コピーしました！",

        style_select: "スタイルを選択",
        style_ascii: "アスキー",
        style_transparency: "背景透過",
        style_genga: "アニメ原画",
        style_pencil: "鉛筆画",
        style_8bit: "8bit",
        style_monochrome: "モノクロ",

        settings_detail: "詳細調整",
        settings_advanced: "上級者設定",
        settings_close: "閉じる",
        
        lbl_resolution: "解像度（文字幅）",
        lbl_invert: "色を反転",
        lbl_outline_mode: "輪郭抽出モード",
        lbl_bg_trans_mode: "背景透過モード",
        lbl_outline_thresh: "輪郭のしきい値",
        lbl_trans_tolerance: "透過の許容範囲",
        lbl_pixel_size: "ピクセルサイズ（粗さ）",
        lbl_original_color: "元の画像の色で線を描画",
        lbl_effect_strength: "エフェクト強度（しきい値）",
        lbl_fps: "動画フレームレート (FPS)",
        lbl_algorithm: "透過アルゴリズム",
        lbl_algo_flood: "領域拡張 (推奨)",
        lbl_algo_chroma: "クロマキー (全体)",
        lbl_tolerance_hint: "※ 左上のピクセル色を基準に判定します",
        
        no_settings: "このスタイルには調整可能な基本設定はありません",
        
        adv_title: "パラメータの上級者設定",
        adv_ascii_width: "アスキーアート最大文字幅",
        adv_8bit_size: "8bitピクセルサイズ範囲",
        adv_contour: "輪郭しきい値の範囲",
        adv_trans: "透過許容量の範囲",
        
        footer_desc: "アート変換スタジオは、クリエイターのための無料ブラウザツールです。",
        footer_terms: "利用規約",
        footer_privacy: "プライバシーポリシー",
        footer_rights: "All rights reserved.",
        
        legal_terms_title: "利用規約",
        legal_privacy_title: "プライバシーポリシー",
        legal_contact_title: "運営者・お問い合わせ",

        profile_name: "yuu",
        profile_title: "大学生 / プログラミング学習中",
        profile_desc: "現在、大学に通いながらWeb開発とプログラミングを勉強しています。学習のアウトプットとして、自分が「使いたい」と思えるツールを目指して開発しました。ユーザーのプライバシーを守りつつ、便利な機能を提供できるよう日々改良を続けています。",
    }
};

// --- Components ---

// AdPlaceholderを削除し、コンテンツ（テキスト）を強化するためのコンポーネント
const SeoContent: React.FC<{ lang: Language }> = ({ lang }) => {
    // コンテンツ不足（AdSense審査落ち）を防ぐため、豊富なテキストコンテンツを提供
    if (lang === 'ja') {
        return (
            <div className="w-full bg-slate-50 border-t border-slate-200 mt-20">
                <section className="max-w-4xl mx-auto px-6 py-16">
                    <h2 className="text-3xl font-black text-slate-900 mb-8 text-center tracking-tight">
                        アート変換スタジオについて
                    </h2>
                    <p className="text-slate-600 leading-relaxed mb-12 text-center max-w-2xl mx-auto">
                        アート変換スタジオ（Art Converter Studio）は、特別なソフトをインストールすることなく、ブラウザ上だけで画像や動画を様々なアートスタイルに変換できる高機能なWebツールです。
                        アスキーアート生成、背景透過、アニメ風加工など、クリエイティブな作業を強力にサポートします。
                    </p>

                    <div className="grid md:grid-cols-2 gap-12 mb-20">
                        <article>
                            <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <TransparentBgIcon className="w-6 h-6 text-emerald-500" />
                                高精度な背景透過・切り抜き
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                画像編集ソフトを使わずに、ブラウザだけで一瞬にして画像の背景を透明にできます。
                                従来のクロマキー処理に加え、高度な「領域拡張法（Flood Fill）」アルゴリズムを搭載。
                                被写体の内側にある同系色を誤って消すことなく、輪郭を認識して背景だけを綺麗に透明化します。
                                ECサイトの商品画像作成や、資料作成の効率化に最適です。
                            </p>
                        </article>
                        <article>
                            <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <AsciiArtIcon className="w-6 h-6 text-emerald-500" />
                                動画も変換できるアスキーアート
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                静止画だけでなく、MP4などの動画ファイルをそのまま「動くアスキーアート」に変換できます。
                                文字だけで構成されたユニークな映像は、SNSでのシェアや、レトロなWebサイトの演出、プログラミング関連のデザイン素材として注目を集めること間違いありません。
                                コピーボタン一つでテキストデータとして取得可能です。
                            </p>
                        </article>
                        <article>
                            <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <AnimationSketchIcon className="w-6 h-6 text-emerald-500" />
                                アニメ原画・線画抽出機能
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                実写映像からエッジ（輪郭）を高精度に検出し、アニメの原画や線画のようなスタイルに加工します。
                                イラスト作成の下書き（トレース素材）として利用したり、マンガ背景のような効果を写真に加えることができます。
                                すべての処理はローカル（ブラウザ）上で完結するため、巨大な動画ファイルをアップロードする待ち時間もありません。
                            </p>
                        </article>
                        <article>
                            <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <SparklesIcon className="w-6 h-6 text-emerald-500" />
                                完全無料・登録不要・安心安全
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                当サイトはサーバーに画像を送信しません。すべての画像処理はお使いの端末（PCやスマートフォン）のブラウザ内でJavaScriptによって行われます。
                                そのため、プライベートな写真や機密情報を含む画像が外部サーバーに流出する心配がなく、安心してご利用いただけます。
                                面倒な会員登録やログインも一切不要です。
                            </p>
                        </article>
                    </div>

                    {/* AdSense審査対策：技術的な仕組み解説（文字数と専門性を担保） */}
                    <div className="mb-20 space-y-12 border-t border-slate-200 pt-16">
                        <div className="prose prose-slate max-w-none">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
                                本ツールの技術的な仕組み
                            </h3>
                            
                            <h4 className="text-lg font-bold text-slate-800 mt-6 mb-3">クライアントサイド・レンダリング技術</h4>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                アート変換スタジオの最大の特徴は、サーバー処理を行わない「完全クライアントサイド実行」にあります。
                                通常、画像加工サービスはユーザーがアップロードした画像をサーバーに送信し、そこでPythonやC++などで処理を行ってから結果を返します。
                                しかし、当ツールではHTML5の <code>&lt;canvas&gt;</code> APIとJavaScriptの型付き配列（Typed Arrays）を駆使し、ブラウザのメモリ上で直接ピクセルデータを操作しています。
                            </p>

                            <h4 className="text-lg font-bold text-slate-800 mt-6 mb-3">アルゴリズムの実装について</h4>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                例えば「背景透過」機能では、単純な色指定による削除だけでなく、探索アルゴリズムの一種である「領域拡張法（Flood Fill / シードフィル）」をJavaScriptで実装しています。
                                画像の四隅を始点として、隣接するピクセルの色の類似度（ユークリッド距離）を計算し、再帰的あるいはスタックを用いた処理で背景領域だけを特定して透明化します。
                                これにより、被写体の内側にある同系色を誤って削除することなく、高精度な切り抜きを実現しています。
                            </p>

                            <h4 className="text-lg font-bold text-slate-800 mt-6 mb-3">アスキーアート変換のロジック</h4>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                画像をアスキーアートに変換する際は、まず画像をグレースケール化し、各ピクセルの輝度（明るさ）を算出します。
                                次に、画像を格子状のブロックに分割し、ブロックごとの平均輝度を求めます。
                                事前に「密度（黒っぽさ）」順に並べた文字セット（例: <code>$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~&lt;&gt;i!lI;:,"^`'. </code>）の中から、その輝度に最も近い文字をマッピングすることで、テキストによる画像の再現を行っています。
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-20">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6">使い方はとても簡単です</h3>
                        <ol className="list-decimal list-inside space-y-4 text-slate-700 font-medium">
                            <li className="pl-2"><span className="font-bold text-slate-900">スタイルを選択する:</span> 画面上部のアイコンから、変換したいスタイル（アスキーアート、背景透過、アニメ原画など）を選びます。</li>
                            <li className="pl-2"><span className="font-bold text-slate-900">ファイルをアップロード:</span> 画像または動画ファイルをドラッグ＆ドロップするか、クリックして選択します。</li>
                            <li className="pl-2"><span className="font-bold text-slate-900">詳細を調整:</span> 必要に応じてスライダーを動かし、線の太さや透過のしきい値を調整します。プレビューはリアルタイムで更新されます。</li>
                            <li className="pl-2"><span className="font-bold text-slate-900">保存・共有:</span> 結果に満足したら、画像をダウンロードしたり、テキストをコピーしてSNSなどで共有しましょう。</li>
                        </ol>
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-2xl font-bold text-slate-900 text-center">よくある質問 (FAQ)</h3>
                        <div className="space-y-4">
                            <div className="bg-white p-6 rounded-xl border border-slate-200">
                                <h4 className="font-bold text-lg text-slate-800 mb-2">Q. 本当に無料ですか？</h4>
                                <p className="text-slate-600 text-sm">A. はい、すべての機能を完全に無料でご利用いただけます。課金要素もありません。</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200">
                                <h4 className="font-bold text-lg text-slate-800 mb-2">Q. アップロードした画像はどこかに保存されますか？</h4>
                                <p className="text-slate-600 text-sm">A. いいえ、保存されません。当ツールは「クライアントサイド処理」技術を使用しており、画像データがお使いのデバイスから外部のサーバーへ送信されることは一切ありません。</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200">
                                <h4 className="font-bold text-lg text-slate-800 mb-2">Q. 生成した画像は商用利用できますか？</h4>
                                <p className="text-slate-600 text-sm">A. はい、当ツールで生成した画像やテキストデータの著作権は、元の画像の権利を持つ利用者に帰属します。ご自身の作品として商用利用していただいて問題ありません。</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200">
                                <h4 className="font-bold text-lg text-slate-800 mb-2">Q. スマホでも使えますか？</h4>
                                <p className="text-slate-600 text-sm">A. はい、iPhoneやAndroidなどのスマートフォン、タブレットのブラウザでも動作します。ただし、動画変換などの重い処理は、PC環境でのご利用を推奨します。</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }
    
    // English Content
    return (
        <div className="w-full bg-slate-50 border-t border-slate-200 mt-20">
            <section className="max-w-4xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-black text-slate-900 mb-8 text-center tracking-tight">
                    About Art Converter Studio
                </h2>
                <p className="text-slate-600 leading-relaxed mb-12 text-center max-w-2xl mx-auto">
                    Art Converter Studio is a powerful web tool that allows you to convert images and videos into various art styles directly in your browser without installing any software.
                    It strongly supports creative work such as ASCII art generation, background removal, and anime-style processing.
                </p>

                <div className="grid md:grid-cols-2 gap-12 mb-20">
                    <article>
                        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <TransparentBgIcon className="w-6 h-6 text-emerald-500" />
                            High-Precision Background Removal
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            Make image backgrounds transparent instantly without using expensive photo editing software.
                            In addition to traditional chroma key processing, it is equipped with advanced "Flood Fill" algorithms.
                            It recognizes contours to cleanly remove only the background without accidentally erasing similar colors inside the subject.
                            Ideal for creating product images for e-commerce sites and improving the efficiency of document creation.
                        </p>
                    </article>
                    <article>
                        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <AsciiArtIcon className="w-6 h-6 text-emerald-500" />
                            Video to ASCII Art
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            Convert not only static images but also video files such as MP4 directly into "moving ASCII art".
                            Unique videos composed only of characters are sure to attract attention for sharing on SNS, retro website designs, and programming-related design materials.
                            You can get it as text data with a single copy button.
                        </p>
                    </article>
                    <article>
                        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <AnimationSketchIcon className="w-6 h-6 text-emerald-500" />
                            Anime Line Art Extraction
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            Detects edges (contours) from live-action footage with high precision and processes them into styles resembling anime raw drawings or line art.
                            You can use it as a draft (trace material) for illustration creation or add a manga background-like effect to photos.
                            Everything happens in the local browser, so there is no waiting time for uploading huge video files.
                        </p>
                    </article>
                    <article>
                        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-emerald-500" />
                            Free, No Registration, Secure
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            We do not send images to any server. All image processing is done by JavaScript within the browser of your device (PC or smartphone).
                            Therefore, you can use it with peace of mind without worrying about private photos or images containing confidential information leaking to external servers.
                            No troublesome membership registration or login is required.
                        </p>
                    </article>
                </div>

                {/* Technical Deep Dive for SEO and Authority */}
                <div className="mb-20 space-y-12 border-t border-slate-200 pt-16">
                    <div className="prose prose-slate max-w-none">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                             <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
                             How It Works: Technical Architecture
                        </h3>
                        
                        <h4 className="text-lg font-bold text-slate-800 mt-6 mb-3">Client-Side Rendering Technology</h4>
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            The defining feature of Art Converter Studio is its "fully client-side execution," meaning no server processing occurs.
                            Typically, image processing services send your uploaded images to a server where languages like Python or C++ process them before returning the result.
                            However, this tool leverages the HTML5 <code>&lt;canvas&gt;</code> API and JavaScript Typed Arrays to manipulate pixel data directly in your browser's memory.
                        </p>

                        <h4 className="text-lg font-bold text-slate-800 mt-6 mb-3">Implementation of Algorithms</h4>
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            For example, in the "Background Removal" feature, we implement a "Flood Fill" algorithm in pure JavaScript rather than just simple color deletion.
                            Starting from the four corners of the image, the algorithm calculates the color similarity (Euclidean distance) of adjacent pixels and uses recursion or a stack based approach to identify and make only the background transparent.
                            This allows for high-precision extraction without accidentally removing similar colors found within the subject.
                        </p>

                        <h4 className="text-lg font-bold text-slate-800 mt-6 mb-3">Logic Behind ASCII Art Conversion</h4>
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            When converting an image to ASCII art, we first convert the image to grayscale to calculate the luminance (brightness) of each pixel.
                            The image is then divided into grid blocks, and the average luminance for each block is determined.
                            We map this value to a character from a pre-defined set sorted by density (e.g., <code>$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~&lt;&gt;i!lI;:,"^`'. </code>) to reproduce the image using text.
                        </p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-20">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">How to Use</h3>
                    <ol className="list-decimal list-inside space-y-4 text-slate-700 font-medium">
                        <li className="pl-2"><span className="font-bold text-slate-900">Select Style:</span> Choose the style you want to convert (ASCII art, Transparent background, Anime line, etc.) from the icons at the top.</li>
                        <li className="pl-2"><span className="font-bold text-slate-900">Upload File:</span> Drag and drop an image or video file, or click to select one.</li>
                        <li className="pl-2"><span className="font-bold text-slate-900">Adjust Settings:</span> Use the sliders to adjust line thickness, transparency threshold, etc. The preview updates in real-time.</li>
                        <li className="pl-2"><span className="font-bold text-slate-900">Save & Share:</span> Once satisfied with the result, download the image or copy the text to share on social media.</li>
                    </ol>
                </div>

                <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-slate-900 text-center">Frequently Asked Questions (FAQ)</h3>
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-lg text-slate-800 mb-2">Q. Is it really free?</h4>
                            <p className="text-slate-600 text-sm">A. Yes, all features are completely free to use. There are no hidden charges.</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-lg text-slate-800 mb-2">Q. Are my uploaded images saved somewhere?</h4>
                            <p className="text-slate-600 text-sm">A. No, they are not saved. This tool uses "client-side processing" technology, and image data is never sent from your device to an external server.</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-lg text-slate-800 mb-2">Q. Can I use the generated images commercially?</h4>
                            <p className="text-slate-600 text-sm">A. Yes, the copyright of the images and text data generated by this tool belongs to the user who owns the original image. You can use them commercially as your own work.</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-lg text-slate-800 mb-2">Q. Can I use it on my smartphone?</h4>
                            <p className="text-slate-600 text-sm">A. Yes, it works on browsers on smartphones and tablets such as iPhones and Androids. However, for heavy processing such as video conversion, we recommend using a PC environment.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

// --- 新規コンポーネント: 常時表示される法的情報 + 運営者プロフィール ---
const LegalInformation: React.FC<{ lang: Language, t: any }> = ({ lang, t }) => {
  return (
    <div className="w-full bg-slate-100 border-t border-slate-200 py-16 text-slate-600">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-12">
        <section id="profile" className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                {t('legal_contact_title')}
            </h3>
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">
                        {t('profile_name').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-lg">{t('profile_name')}</p>
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">{t('profile_title')}</p>
                    </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 mb-4">
                    {t('profile_desc')}
                </p>
                <div className="pt-4 border-t border-slate-100">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contact</p>
                     <a href="mailto:yuu758585@gmail.com" className="text-emerald-600 underline font-medium text-sm break-all">yuu758585@gmail.com</a>
                </div>
            </div>
        </section>

        <section id="terms" className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            {t('legal_terms_title')}
          </h3>
          <div className="text-sm leading-relaxed space-y-3 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
             {lang === 'ja' ? (
                <>
                <h4 className="font-bold text-slate-800">1. 本サービスの利用について</h4>
                <p>アート変換スタジオ（以下、当サービス）は、ユーザーがブラウザ上で画像や動画を加工できる無料ツールです。商用・非商用問わずご自由にお使いいただけます。</p>
                <h4 className="font-bold text-slate-800">2. 免責事項</h4>
                <p>当サービスを利用した結果生じたいかなる損害（データの損失、業務の中断、精神的苦痛等）についても、運営者は一切の責任を負いません。加工した画像の使用はユーザー自身の責任で行ってください。</p>
                <h4 className="font-bold text-slate-800">3. 禁止事項</h4>
                <p>当サービスを用いて、公序良俗に反する画像、違法な画像、他者の権利を侵害する画像を生成・公開する行為を禁止します。</p>
                </>
            ) : (
                <>
                <h4 className="font-bold text-slate-800">1. Usage of Service</h4>
                <p>Art Converter Studio (hereinafter "Service") is a free tool that allows users to process images and videos in the browser. You are free to use it for commercial and non-commercial purposes.</p>
                <h4 className="font-bold text-slate-800">2. Disclaimer</h4>
                <p>The operator assumes no responsibility for any damages (loss of data, business interruption, mental distress, etc.) resulting from the use of this Service. Use of processed images is at the user's own risk.</p>
                <h4 className="font-bold text-slate-800">3. Prohibited Acts</h4>
                <p>It is prohibited to use this Service to generate or publish images that are offensive to public order and morals, illegal, or infringe on the rights of others.</p>
                </>
            )}
          </div>
        </section>

        <section id="privacy" className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            {t('legal_privacy_title')}
          </h3>
          <div className="text-sm leading-relaxed space-y-3 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
             {lang === 'ja' ? (
                 <>
                 <h4 className="font-bold text-slate-800">1. データは送信されません</h4>
                 <p>当サービスは「クライアントサイド処理」を採用しています。あなたがアップロードした画像や動画ファイルが、当サービスのサーバーや外部の第三者に送信されることは一切ありません。すべての画像処理はお使いのデバイス（PC、スマホ）のブラウザ内で行われます。</p>
                 <h4 className="font-bold text-slate-800 mt-4">2. 広告配信とCookieについて</h4>
                 <p>当サイトでは、第三者配信の広告サービス「Google Adsense（グーグルアドセンス）」を利用しています。</p>
                 <p className="mt-2">広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookie（クッキー）を使用することがあります。これには、ユーザーが当サイトや他のサイトに過去にアクセスした際の情報が含まれます。</p>
                 <p className="mt-2">ユーザーは、広告設定でパーソナライズ広告を無効にすることができます。また、<a href="https://www.aboutads.info" target="_blank" rel="noreferrer" className="text-emerald-600 underline">www.aboutads.info</a> にアクセスすれば、パーソナライズ広告に使われる第三者配信事業者の Cookie を無効にすることができます。</p>
                 </>
             ) : (
                 <>
                 <h4 className="font-bold text-slate-800">1. Data is NOT Sent</h4>
                 <p>This service uses "Client-Side Processing". Image or video files you upload are never sent to our servers or any third parties. All image processing happens within your device's browser.</p>
                 <h4 className="font-bold text-slate-800 mt-4">2. Advertising and Cookies</h4>
                 <p>This site uses "Google AdSense", a third-party advertising service.</p>
                 <p className="mt-2">Advertising providers may use Cookies to display ads based on user interests. This includes information about past visits to this site and others.</p>
                 <p className="mt-2">Users can disable personalized ads in ad settings. You can also visit <a href="https://www.aboutads.info" target="_blank" rel="noreferrer" className="text-emerald-600 underline">www.aboutads.info</a> to opt-out of third-party vendor cookies used for personalized advertising.</p>
                 </>
             )}
          </div>
        </section>
      </div>
    </div>
  );
};

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

const Navbar: React.FC<{ lang: Language, setLang: (l: Language) => void, t: any }> = ({ lang, setLang, t }) => (
    <nav className="w-full border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2.5">
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg p-1.5 shadow-lg shadow-emerald-200/50">
                        <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900">{t('app_title')}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setLang('en')} 
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${lang === 'en' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            EN
                        </button>
                        <button 
                            onClick={() => setLang('ja')} 
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${lang === 'ja' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            JA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </nav>
);

const Footer: React.FC<{ t: any }> = ({ t }) => (
    <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-slate-500" />
                </div>
            </div>
            <p className="text-slate-500 text-sm mb-6">
                {t('footer_desc')}
            </p>
            <div className="flex justify-center gap-6 text-sm text-slate-400 mb-8">
                <a href="#terms" className="hover:text-emerald-600 transition-colors">{t('footer_terms')}</a>
                <a href="#privacy" className="hover:text-emerald-600 transition-colors">{t('footer_privacy')}</a>
            </div>
            <div className="text-xs text-slate-300">
                &copy; {new Date().getFullYear()} Art Converter Studio. {t('footer_rights')}
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
  // 自動検知ロジック: ブラウザ言語が日本語系なら'ja'、それ以外は'en'
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof navigator !== 'undefined') {
        const lang = navigator.language;
        return lang.startsWith('ja') ? 'ja' : 'en';
    }
    return 'en';
  });

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

  // Helper for Translation
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;

  // --- Metadata Update Effect ---
  useEffect(() => {
    const texts = TRANSLATIONS[language];
    document.title = texts.meta_title || "Art Converter Studio";
    
    // Update Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', texts.meta_description || "");
    
    // Update OGP Title & Description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', texts.app_title + (language === 'en' ? " - Turn Images into Art Instantly" : " - 瞬時に画像をアートへ"));

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', texts.meta_description || "");

    // Update html lang attribute
    document.documentElement.lang = language;
  }, [language]);


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
    setLoadingText(t('applying_effect'));
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
  }, [effect, asciiWidth, asciiInvertColors, asciiOutlineMode, asciiTransparentBg, eightBitPixelSize, genericThreshold, bgThreshold, isTransparentFormat, transparencyMode, gengaColorfulLines, language]);

  const handleVideoExtract = useCallback(async () => {
    if (!videoPreviewUrl || !videoRef.current || !canvasRef.current) return;
    setStatus('processing');
    setLoadingText(t('analyzing_video'));
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
  }, [videoPreviewUrl, fps, applyEffectOnFrames, language]);

  const handleImageEffect = useCallback(async () => {
    if (!imagePreviewUrl || !canvasRef.current) return;
    setStatus('processing'); setLoadingText(t('processing'));
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
  }, [imagePreviewUrl, effect, asciiWidth, asciiInvertColors, asciiOutlineMode, asciiTransparentBg, eightBitPixelSize, genericThreshold, bgThreshold, isTransparentFormat, transparencyMode, gengaColorfulLines, language]);

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
        {t('adv_title')}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 block">{t('adv_ascii_width')}</label>
          <div className="flex gap-2">
            <input type="number" value={asciiWidthBounds.min} onChange={e => setAsciiWidthBounds({...asciiWidthBounds, min: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Min" />
            <input type="number" value={asciiWidthBounds.max} onChange={e => setAsciiWidthBounds({...asciiWidthBounds, max: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Max" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 block">{t('adv_8bit_size')}</label>
          <div className="flex gap-2">
            <input type="number" value={eightBitPixelSizeBounds.min} onChange={e => setEightBitPixelSizeBounds({...eightBitPixelSizeBounds, min: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Min" />
            <input type="number" value={eightBitPixelSizeBounds.max} onChange={e => setEightBitPixelSizeBounds({...eightBitPixelSizeBounds, max: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Max" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 block">{t('adv_contour')}</label>
          <div className="flex gap-2">
            <input type="number" value={genericThresholdBounds.min} onChange={e => setGenericThresholdBounds({...genericThresholdBounds, min: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Min" />
            <input type="number" value={genericThresholdBounds.max} onChange={e => setGenericThresholdBounds({...genericThresholdBounds, max: parseInt(e.target.value)})} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-700" placeholder="Max" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 block">{t('adv_trans')}</label>
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
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block px-2">{t('style_select')}</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                <EffectButton label={t('style_ascii')} isActive={effect === 'ascii'} onClick={() => setEffect('ascii')} disabled={isProcessing} icon={<AsciiArtIcon className="w-6 h-6" />} />
                <EffectButton label={t('style_transparency')} isActive={effect === 'transparency'} onClick={() => setEffect('transparency')} disabled={isProcessing} icon={<TransparentBgIcon className="w-6 h-6" />} />
                <EffectButton label={t('style_genga')} isActive={effect === 'genga'} onClick={() => setEffect('genga')} disabled={isProcessing} icon={<AnimationSketchIcon className="w-6 h-6" />} />
                <EffectButton label={t('style_pencil')} isActive={effect === 'pencil'} onClick={() => setEffect('pencil')} disabled={isProcessing} icon={<PencilIcon className="w-6 h-6" />} />
                <EffectButton label={t('style_8bit')} isActive={effect === '8bit'} onClick={() => setEffect('8bit')} disabled={isProcessing} icon={<EightBitIcon className="w-6 h-6" />} />
                <EffectButton label={t('style_monochrome')} isActive={effect === 'monochrome'} onClick={() => setEffect('monochrome')} disabled={isProcessing} icon={<MonochromeIcon className="w-6 h-6" />} />
            </div>
        </div>
        
        {/* Settings Panel */}
        <div className="mt-8 bg-slate-50/80 border border-slate-100 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
                 <h4 className="text-sm font-black text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {t('settings_detail')}
                 </h4>
                 <button onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${showAdvancedSettings ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
                     {showAdvancedSettings ? t('settings_close') : t('settings_advanced')}
                 </button>
            </div>
            
            <div className="space-y-6">
                {effect === 'ascii' && (
                    <div className="space-y-6">
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-2">{t('lbl_resolution')}</span>
                            <SimpleSlider min={asciiWidthBounds.min} max={asciiWidthBounds.max} value={asciiWidth} onChange={setAsciiWidth} disabled={isProcessing} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${asciiInvertColors ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                                <input type="checkbox" checked={asciiInvertColors} onChange={e => setAsciiInvertColors(e.target.checked)} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
                                <span className={`text-sm font-bold ${asciiInvertColors ? 'text-emerald-900' : 'text-slate-600'}`}>{t('lbl_invert')}</span>
                            </label>
                            <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${asciiOutlineMode ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                                <input type="checkbox" checked={asciiOutlineMode} onChange={e => setAsciiOutlineMode(e.target.checked)} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
                                <span className={`text-sm font-bold ${asciiOutlineMode ? 'text-emerald-900' : 'text-slate-600'}`}>{t('lbl_outline_mode')}</span>
                            </label>
                            <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${asciiTransparentBg ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                                <input type="checkbox" checked={asciiTransparentBg} onChange={e => setAsciiTransparentBg(e.target.checked)} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
                                <span className={`text-sm font-bold ${asciiTransparentBg ? 'text-emerald-900' : 'text-slate-600'}`}>{t('lbl_bg_trans_mode')}</span>
                            </label>
                        </div>
                        
                        {(asciiOutlineMode || asciiTransparentBg) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                                {asciiOutlineMode && (
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 block mb-2">{t('lbl_outline_thresh')}</span>
                                        <SimpleSlider min={genericThresholdBounds.min} max={genericThresholdBounds.max} value={genericThreshold} onChange={setGenericThreshold} disabled={isProcessing} />
                                    </div>
                                )}
                                {asciiTransparentBg && (
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 block mb-2">{t('lbl_trans_tolerance')}</span>
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
                            <span className="text-xs font-bold text-slate-500 block mb-3">{t('lbl_algorithm')}</span>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${transparencyMode === 'flood' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    <input type="radio" name="transMode" checked={transparencyMode === 'flood'} onChange={() => setTransparencyMode('flood')} className="hidden" />
                                    <span className="font-bold text-sm">{t('lbl_algo_flood')}</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${transparencyMode === 'chroma' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    <input type="radio" name="transMode" checked={transparencyMode === 'chroma'} onChange={() => setTransparencyMode('chroma')} className="hidden" />
                                    <span className="font-bold text-sm">{t('lbl_algo_chroma')}</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-2">{t('lbl_trans_tolerance')}</span>
                            <SimpleSlider min={bgThresholdBounds.min} max={bgThresholdBounds.max} value={bgThreshold} onChange={setBgThreshold} disabled={isProcessing} />
                            <p className="text-[10px] text-slate-400 mt-1 text-right">{t('lbl_tolerance_hint')}</p>
                        </div>
                    </div>
                )}

                {effect === '8bit' && (
                    <div>
                        <span className="text-xs font-bold text-slate-500 block mb-2">{t('lbl_pixel_size')}</span>
                        <SimpleSlider min={eightBitPixelSizeBounds.min} max={eightBitPixelSizeBounds.max} value={eightBitPixelSize} onChange={setEightBitPixelSize} disabled={isProcessing} />
                    </div>
                )}

                {effect === 'genga' && (
                    <div className="space-y-6">
                         <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${gengaColorfulLines ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                            <input type="checkbox" checked={gengaColorfulLines} onChange={e => setGengaColorfulLines(e.target.checked)} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
                            <span className={`text-sm font-bold ${gengaColorfulLines ? 'text-emerald-900' : 'text-slate-600'}`}>{t('lbl_original_color')}</span>
                        </label>
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-2">{t('lbl_effect_strength')}</span>
                            <SimpleSlider min={genericThresholdBounds.min} max={genericThresholdBounds.max} value={genericThreshold} onChange={setGenericThreshold} disabled={isProcessing} />
                        </div>
                    </div>
                )}

                {(effect === 'silhouette' || effect === 'lineart') && (
                    <div>
                        <span className="text-xs font-bold text-slate-500 block mb-2">{t('lbl_effect_strength')}</span>
                        <SimpleSlider min={genericThresholdBounds.min} max={genericThresholdBounds.max} value={genericThreshold} onChange={setGenericThreshold} disabled={isProcessing} />
                    </div>
                )}
                
                {videoFile && (
                   <div className="pt-4 border-t border-slate-200/50">
                       <span className="text-xs font-bold text-slate-500 block mb-2">{t('lbl_fps')}</span>
                       <SimpleSlider min={1} max={30} value={fps} onChange={setFps} disabled={isProcessing} />
                   </div>
                )}
                
                {['pencil', 'cel', 'monochrome'].includes(effect) && (
                     <div className="text-center py-4">
                        <p className="text-sm text-slate-400">{t('no_settings')}</p>
                    </div>
                )}
            </div>

            {showAdvancedSettings && renderAdvancedSettings()}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <Navbar lang={language} setLang={setLanguage} t={t} />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-50 border-b border-slate-100">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-transparent to-transparent opacity-70"></div>
        <div className="max-w-4xl mx-auto px-6 py-20 sm:py-24 text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                {t('hero_title_1')}<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">{t('hero_title_2')}</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                {t('hero_desc')}
            </p>
            <div className="flex justify-center gap-4 text-sm font-bold text-slate-500 mb-10">
                <span className="flex items-center gap-1.5"><CheckIcon className="w-4 h-4 text-emerald-500" /> {t('feature_no_reg')}</span>
                <span className="flex items-center gap-1.5"><CheckIcon className="w-4 h-4 text-emerald-500" /> {t('feature_free')}</span>
                <span className="flex items-center gap-1.5"><CheckIcon className="w-4 h-4 text-emerald-500" /> {t('feature_privacy')}</span>
            </div>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto px-6 pt-12 text-center text-slate-600 leading-relaxed text-sm">
        <p>{t('intro_text')}</p>
      </div>

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-16 flex-grow">
        
        <div className="space-y-16">
            {/* STEP 1: Process Selection */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-slate-200">1</div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('step_1_title')}</h2>
                </div>
                {renderConfig()}
            </section>

            {/* STEP 2: File Upload / Result */}
            <section>
                <div className="flex justify-between items-end mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-slate-200">2</div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {hasFile ? t('step_2_result') : t('step_2_title')}
                        </h2>
                    </div>
                    {hasFile && (
                        <button onClick={() => {setVideoFile(null); setImageFile(null); setStatus('idle');}} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors">
                            {t('btn_retry')}
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
                                     ) : <div className="text-slate-300 flex flex-col items-center"><PhotoIcon className="w-24 h-24 mb-4" /><span className="text-sm font-medium">{t('preview_waiting')}</span></div>}
                                </div>
                                {videoFile && status === 'success' && (
                                    <div className="mt-6 flex justify-center">
                                        <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-black hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                            {isPlaying ? <><PauseIcon className="w-5 h-5" /> {t('btn_stop')}</> : <><PlayIcon className="w-5 h-5" /> {t('btn_play')}</>}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {(status === 'success' && (effect === 'ascii' ? processedAsciiText : (processedImageUrl || processedFrames.length > 0))) && (
                                <div className="w-full lg:w-80 flex flex-col gap-6">
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('download_share')}</h3>
                                        <div className="space-y-3">
                                            {effect === 'ascii' && processedAsciiText && (
                                                <>
                                                <button onClick={() => {navigator.clipboard.writeText(processedAsciiText); alert(t('copied'));}} className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all active:scale-95"><ClipboardIcon className="w-5 h-5" /> {t('btn_copy')}</button>
                                                <button onClick={handleDownloadAsciiImage} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"><PhotoIcon className="w-5 h-5" /> {t('btn_save_img')}</button>
                                                </>
                                            )}
                                            {effect !== 'ascii' && processedImageUrl && (
                                                <a href={processedImageUrl} download={getDownloadFilename(isTransparentFormat ? "png" : "jpg")} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-black shadow-lg shadow-slate-200 transition-all active:scale-95"><DownloadIcon className="w-5 h-5" /> {isTransparentFormat ? t('btn_save_png') : t('btn_save_jpg')}</a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <p className="text-xs text-emerald-800 leading-relaxed">
                                            <strong>{t('tips_title')}</strong><br/>
                                            {t('tips_desc')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
      </main>
      
      <SeoContent lang={language} />
      <LegalInformation lang={language} t={t} />
      <Footer t={t} />

      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
