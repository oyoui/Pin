import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageItem } from '../types';
import { Check, X, RotateCw, ZoomIn, ZoomOut, RefreshCw, Scissors } from 'lucide-react';

interface CropModalProps {
  imageItem: ImageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyCrop: (croppedDataUrl: string) => void;
  onUseOriginal: () => void;
}

type AspectRatioPreset = 'free' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | 'original';

export const CropModal: React.FC<CropModalProps> = ({
  imageItem,
  isOpen,
  onClose,
  onApplyCrop,
  onUseOriginal,
}) => {
  // All hooks called unconditionally at top level (React 19 compliance)
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>('free');
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });

  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; initialBox: typeof cropBox } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset values when opened with a new image
  useEffect(() => {
    if (imageItem) {
      setRotation(0);
      setZoom(1);
      setCropBox({ x: 10, y: 10, width: 80, height: 80 });
      setAspectPreset('free');
    }
  }, [imageItem?.id]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    setZoom(1);
    setCropBox({ x: 10, y: 10, width: 80, height: 80 });
    setAspectPreset('free');
  };

  const applyAspectToCropBox = useCallback((preset: AspectRatioPreset) => {
    setAspectPreset(preset);
    if (!imageItem) return;
    if (preset === 'free') return;

    let targetRatio = 1;
    if (preset === '1:1') targetRatio = 1;
    else if (preset === '4:3') targetRatio = 4 / 3;
    else if (preset === '3:4') targetRatio = 3 / 4;
    else if (preset === '16:9') targetRatio = 16 / 9;
    else if (preset === '9:16') targetRatio = 9 / 16;
    else if (preset === 'original') {
      targetRatio = (imageItem.naturalWidth || 800) / (imageItem.naturalHeight || 800);
    }

    setCropBox((prev) => {
      let newW = prev.width;
      let newH = newW / targetRatio;
      if (newH > 90) {
        newH = 80;
        newW = newH * targetRatio;
      }
      if (newW > 90) {
        newW = 80;
        newH = newW / targetRatio;
      }
      return {
        x: Math.max(5, (100 - newW) / 2),
        y: Math.max(5, (100 - newH) / 2),
        width: Math.min(90, newW),
        height: Math.min(90, newH),
      };
    });
  }, [imageItem]);

  const handlePointerDown = (e: React.PointerEvent, handleType: string) => {
    e.stopPropagation();
    setActiveHandle(handleType);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initialBox: { ...cropBox },
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !dragStart || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dxPercent = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dyPercent = ((e.clientY - dragStart.y) / rect.height) * 100;

    const { initialBox } = dragStart;

    if (activeHandle === 'move') {
      const newX = Math.max(0, Math.min(100 - initialBox.width, initialBox.x + dxPercent));
      const newY = Math.max(0, Math.min(100 - initialBox.height, initialBox.y + dyPercent));
      setCropBox({ ...initialBox, x: newX, y: newY });
    } else {
      let { x, y, width, height } = initialBox;

      if (activeHandle.includes('e')) {
        width = Math.min(100 - x, Math.max(15, initialBox.width + dxPercent));
      }
      if (activeHandle.includes('s')) {
        height = Math.min(100 - y, Math.max(15, initialBox.height + dyPercent));
      }
      if (activeHandle.includes('w')) {
        const potentialW = initialBox.width - dxPercent;
        if (potentialW >= 15 && initialBox.x + dxPercent >= 0) {
          x = initialBox.x + dxPercent;
          width = potentialW;
        }
      }
      if (activeHandle.includes('n')) {
        const potentialH = initialBox.height - dyPercent;
        if (potentialH >= 15 && initialBox.y + dyPercent >= 0) {
          y = initialBox.y + dyPercent;
          height = potentialH;
        }
      }

      setCropBox({ x, y, width, height });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setActiveHandle(null);
    setDragStart(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePerformCrop = async () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    const sx = (cropBox.x / 100) * natW;
    const sy = (cropBox.y / 100) * natH;
    const sw = (cropBox.width / 100) * natW;
    const sh = (cropBox.height / 100) * natH;

    if (rotation === 90 || rotation === 270) {
      canvas.width = Math.round(sh);
      canvas.height = Math.round(sw);
    } else {
      canvas.width = Math.round(sw);
      canvas.height = Math.round(sh);
    }

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    if (rotation === 90 || rotation === 270) {
      ctx.drawImage(img, sx, sy, sw, sh, -sh / 2, -sw / 2, sh, sw);
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
    }
    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onApplyCrop(croppedDataUrl);
    onClose();
  };

  const aspectPresets: { key: AspectRatioPreset; label: string }[] = [
    { key: 'free', label: '自由' },
    { key: 'original', label: '原比例' },
    { key: '1:1', label: '1:1' },
    { key: '4:3', label: '4:3' },
    { key: '3:4', label: '3:4' },
    { key: '16:9', label: '16:9' },
    { key: '9:16', label: '9:16' },
  ];

  // Return null ONLY after all hooks have been invoked
  if (!isOpen || !imageItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#FAF8F5] rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[96dvh] border border-[#E8E2D9]">
        {/* Header (No descriptive/tutorial text) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E2D9] bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#8D9B8E]/15 flex items-center justify-center text-[#556456]">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-[#33322E]">图片裁剪</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#EAE4DC] flex items-center justify-center text-[#7A7873] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="px-4 py-2.5 bg-[#F2EDE4]/60 border-b border-[#E8E2D9] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {aspectPresets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => applyAspectToCropBox(preset.key)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  aspectPreset === preset.key
                    ? 'bg-[#8D9B8E] text-white shadow-sm'
                    : 'bg-white/80 text-[#5C5852] hover:bg-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Cropper Area */}
        <div className="relative flex-1 min-h-[260px] sm:min-h-[300px] max-h-[420px] bg-[#1E1D1B] flex items-center justify-center overflow-hidden p-4 sm:p-6">
          <div
            ref={containerRef}
            className="relative inline-block max-w-full max-h-[340px] overflow-hidden select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <img
              ref={imageRef}
              src={imageItem.originalUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="max-h-[340px] max-w-full object-contain pointer-events-none transition-transform duration-200"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom})`,
              }}
            />

            <div className="absolute inset-0 bg-black/50 pointer-events-none" />

            <div
              className="absolute border-2 border-white/90 shadow-2xl cursor-move touch-none"
              style={{
                left: `${cropBox.x}%`,
                top: `${cropBox.y}%`,
                width: `${cropBox.width}%`,
                height: `${cropBox.height}%`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
              }}
              onPointerDown={(e) => handlePointerDown(e, 'move')}
            >
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              <div
                className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full shadow-md border border-neutral-400 cursor-nwse-resize"
                onPointerDown={(e) => handlePointerDown(e, 'nw')}
              />
              <div
                className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full shadow-md border border-neutral-400 cursor-nesw-resize"
                onPointerDown={(e) => handlePointerDown(e, 'ne')}
              />
              <div
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-full shadow-md border border-neutral-400 cursor-nesw-resize"
                onPointerDown={(e) => handlePointerDown(e, 'sw')}
              />
              <div
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-full shadow-md border border-neutral-400 cursor-nwse-resize"
                onPointerDown={(e) => handlePointerDown(e, 'se')}
              />
            </div>
          </div>
        </div>

        {/* Crop Toolbar */}
        <div className="px-5 py-2.5 bg-[#FAF8F5] border-t border-[#E8E2D9] flex items-center justify-between text-xs text-[#5C5852]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRotate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DDD5CA] hover:bg-[#F2ECE4] transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>旋转 90°</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DDD5CA] hover:bg-[#F2ECE4] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ZoomOut className="w-3.5 h-3.5 text-[#88847E]" />
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-20 sm:w-24 accent-[#8D9B8E] cursor-pointer"
            />
            <ZoomIn className="w-3.5 h-3.5 text-[#88847E]" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-white border-t border-[#E8E2D9] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onUseOriginal();
              onClose();
            }}
            className="px-3 py-2 text-xs font-medium text-[#7A746C] hover:text-[#33322E] transition-colors"
          >
            使用原图
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#5C5852] bg-[#F2EDE4] hover:bg-[#E8E0D5] rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              onClick={handlePerformCrop}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[#8D9B8E] hover:bg-[#7D8B7E] rounded-xl shadow-sm active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>应用</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
