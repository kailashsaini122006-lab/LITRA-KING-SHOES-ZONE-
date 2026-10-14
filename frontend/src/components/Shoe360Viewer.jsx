import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  MousePointer,
  Smartphone,
  Mouse,
  MoveHorizontal,
  Info,
  Sparkles
} from 'lucide-react';

export default function Shoe360Viewer({ imagesList = [], productName = 'Shoe Product', discountPercent = 50 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [imgErrorMap, setImgErrorMap] = useState({});

  const containerRef = useRef(null);

  const totalFrames = imagesList.length;
  const isMultiImage = totalFrames > 1;

  // Reset current index if imagesList changes or shrinks
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [imagesList]);

  // Auto-Spin timer effect for multi-angle images
  useEffect(() => {
    let timer;
    if (isPlaying && isMultiImage) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalFrames);
      }, 900);
    } else {
      setIsPlaying(false);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isMultiImage, totalFrames]);

  // Preload real angle images for smooth frame switching
  useEffect(() => {
    if (isMultiImage) {
      imagesList.forEach((url) => {
        if (url) {
          const img = new Image();
          img.src = url;
        }
      });
    }
  }, [imagesList, isMultiImage]);

  // Keyboard left/right arrow navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isMultiImage) {
        if (e.key === 'ArrowLeft') {
          setCurrentIndex((prev) => (((prev - 1) % totalFrames) + totalFrames) % totalFrames);
        } else if (e.key === 'ArrowRight') {
          setCurrentIndex((prev) => (prev + 1) % totalFrames);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMultiImage, totalFrames]);

  // Pointer drag logic for mouse drag & touch swipe across real angle frames
  const handlePointerDown = (e) => {
    if (!isMultiImage) return;
    setIsDragging(true);
    setIsPlaying(false);
    setDragStartX(e.clientX);
    setStartIndex(currentIndex);
    if (e.currentTarget && typeof e.currentTarget.setPointerCapture === 'function') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore pointer capture error
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !isMultiImage) return;
    const deltaX = e.clientX - dragStartX;
    const sensitivity = 20; // 20px drag = 1 real angle frame step
    const frameOffset = Math.floor(deltaX / sensitivity);
    const nextIdx = (((startIndex - frameOffset) % totalFrames) + totalFrames) % totalFrames;
    if (nextIdx !== currentIndex) {
      setCurrentIndex(nextIdx);
    }
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      if (e.currentTarget && typeof e.currentTarget.releasePointerCapture === 'function') {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // Ignore pointer release error
        }
      }
    }
  };

  // Scroll wheel angle switching
  const handleWheel = (e) => {
    if (!isMultiImage) return;
    const delta = e.deltaY || e.deltaX;
    if (Math.abs(delta) < 5) return;
    const direction = delta > 0 ? 1 : -1;
    const nextIdx = (((currentIndex + direction) % totalFrames) + totalFrames) % totalFrames;
    if (nextIdx !== currentIndex) {
      setCurrentIndex(nextIdx);
    }
  };

  const handleSliderChange = (e) => {
    if (!isMultiImage) return;
    const val = parseInt(e.target.value, 10);
    setCurrentIndex(val);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isMultiImage) {
      setIsPlaying((prev) => !prev);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const currentImgUrl = imagesList[currentIndex] || imagesList[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';
  const displaySrc = imgErrorMap[currentImgUrl] ? 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' : currentImgUrl;

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col space-y-3 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 bg-zinc-950 p-6 flex flex-col justify-between overflow-y-auto' : ''
      }`}
    >
      {/* ─── MAIN STAGE / IMAGE CONTAINER ─────────────────────────── */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className={`relative ${
          isFullscreen ? 'h-[65vh] sm:h-[75vh]' : 'h-64 sm:h-80'
        } bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl group touch-pan-y ${
          isMultiImage ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Discount Badge */}
        <span className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md pointer-events-none z-20">
          {discountPercent}% OFF
        </span>

        {/* 360° Top Left Badge (Only when multiple angle images exist) */}
        {isMultiImage ? (
          <div className="absolute top-3 left-24 sm:left-28 z-20 bg-zinc-950/85 backdrop-blur-md border border-amber-500/40 text-amber-400 font-bold text-[11px] px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none">
            <RotateCw className={`w-3.5 h-3.5 text-amber-400 ${isPlaying || isDragging ? 'animate-spin' : ''}`} />
            <span>360° Multi-Angle View</span>
          </div>
        ) : (
          <div className="absolute top-3 left-24 sm:left-28 z-20 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 text-zinc-400 font-bold text-[11px] px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none">
            <span>Standard Product View</span>
          </div>
        )}

        {/* Control Guide Overlay Box (Top Right, when multi-image) */}
        {isMultiImage && (
          <div className="absolute top-3 right-3 z-20 bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 rounded-xl p-2.5 text-xs text-zinc-300 shadow-2xl max-w-[180px] sm:max-w-[210px] space-y-1.5 pointer-events-auto">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 border-b border-zinc-800/80 pb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> ROTATION CONTROLS
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            {showGuide && (
              <div className="space-y-1 text-[10px] sm:text-[11px] text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <MousePointer className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Drag to rotate (Mouse)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Swipe to rotate (Touch)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mouse className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Scroll to change angle</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MoveHorizontal className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Use arrow keys (← →)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Real Product Image Container */}
        <div className="w-full h-full flex items-center justify-center p-4">
          <img
            src={displaySrc}
            alt={`${productName} Angle ${currentIndex + 1}`}
            onError={() => setImgErrorMap((prev) => ({ ...prev, [currentImgUrl]: true }))}
            draggable={false}
            className="max-w-full max-h-full object-contain pointer-events-none transition-opacity duration-200 drop-shadow-2xl"
          />
        </div>

        {/* 360 Stage Ring Arc Graphic Under Shoe (Only when multi-image) */}
        {isMultiImage && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-10 opacity-90">
            <div className="w-48 sm:w-64 h-6 border-b-2 border-amber-400/50 rounded-full shadow-[0_10px_20px_rgba(245,158,11,0.2)] flex items-end justify-center pb-0.5">
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-amber-400 uppercase flex items-center gap-2 bg-zinc-950/80 px-2 rounded-full border border-amber-500/30">
                <span>←</span> 360° <span>→</span>
              </span>
            </div>
          </div>
        )}

        {/* Previous / Next Arrow Controls */}
        {isMultiImage && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (((prev - 1) % totalFrames) + totalFrames) % totalFrames);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-zinc-300 hover:text-white hover:border-amber-400 transition-all opacity-0 group-hover:opacity-100 z-20 shadow-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev + 1) % totalFrames);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-zinc-300 hover:text-white hover:border-amber-400 transition-all opacity-0 group-hover:opacity-100 z-20 shadow-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* ─── ROTATION CONTROL BAR & SCRUBBER ────────────────── */}
      <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-lg">
        {/* Play/Pause Auto-Spin Button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={!isMultiImage}
          className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
            isPlaying
              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/30 scale-105'
              : 'bg-zinc-900 hover:bg-zinc-800 text-amber-400 border-zinc-700/80 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
          title={isPlaying ? 'Pause Auto 360 Rotation' : 'Play Auto 360 Rotation'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-zinc-950" /> : <Play className="w-4 h-4 fill-amber-400" />}
        </button>

        {/* Angle Indicator */}
        <div className="text-[11px] font-mono text-zinc-300 font-bold shrink-0 min-w-[80px]">
          <span>Angle {currentIndex + 1} of {totalFrames}</span>
        </div>

        {/* Progress Scrubber Slider */}
        <div className="flex-1 flex items-center px-1">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalFrames - 1)}
            step={1}
            value={currentIndex}
            onChange={handleSliderChange}
            disabled={!isMultiImage}
            className="w-full h-1.5 bg-zinc-800 accent-amber-400 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          />
        </div>

        {/* Fullscreen Toggle Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-700/80 transition-all shrink-0"
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen 360'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── REAL ANGLE THUMBNAILS TRACK ───────────────────────────────────── */}
      {isMultiImage && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar pt-1">
          {imagesList.map((imgUrl, idx) => {
            const thumbSrc = imgErrorMap[imgUrl] ? 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' : imgUrl;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsPlaying(false);
                }}
                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-zinc-950 ${
                  currentIndex === idx
                    ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/20'
                    : 'border-zinc-800/80 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={thumbSrc} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono bg-zinc-950/80 text-amber-400 px-1 rounded font-bold">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
