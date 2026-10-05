import React, { useState, useEffect } from 'react';
import {
  ImageItem,
  StitchDirection,
  CanvasLayer,
  ExportSettings,
  ExportFormat,
} from '../types';
import { renderFullCompositionToCanvas } from '../utils/canvasRenderer';
import { Download, X, Check, Loader2, Sparkles } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageItem[];
  direction: StitchDirection;
  borderRadius: number;
  layers: CanvasLayer[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  images,
  direction,
  borderRadius,
  layers,
}) => {
  // All hooks called unconditionally at top level (React 19 compliance)
  const [settings, setSettings] = useState<ExportSettings>({
    scale: 2,
    format: 'png',
    quality: 0.95,
  });

  const [isRendering, setIsRendering] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    const generatePreview = async () => {
      setIsRendering(true);
      try {
        const canvas = await renderFullCompositionToCanvas(
          images,
          direction,
          borderRadius,
          layers,
          settings
        );
        if (!isCancelled) {
          setDimensions({ width: canvas.width, height: canvas.height });
          const mime = settings.format === 'png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mime, settings.quality);
          setPreviewUrl(dataUrl);
        }
      } catch (err) {
        console.error('Export render error:', err);
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    generatePreview();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, images, direction, borderRadius, layers, settings]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    link.download = `Pin_${direction}_${settings.scale}x_${timestamp}.${settings.format}`;
    link.href = previewUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Return null ONLY after all hooks are evaluated
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#FAF8F5] rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[96dvh] border border-[#E8E2D9]">
        {/* Header without descriptive text */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E2D9] bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#8D9B8E]/15 flex items-center justify-center text-[#556456]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-[#33322E]">导出图片</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#EAE4DC] flex items-center justify-center text-[#7A7873] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="relative flex-1 min-h-[200px] sm:min-h-[260px] max-h-[320px] bg-[#22211F] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          {isRendering ? (
            <div className="flex flex-col items-center gap-2 text-white/80">
              <Loader2 className="w-5 h-5 animate-spin text-[#8D9B8E]" />
              <span className="text-xs">生成中...</span>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="max-h-full max-w-full object-contain shadow-2xl rounded-lg border border-white/10"
            />
          ) : null}

          {dimensions.width > 0 && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] text-white/80 font-mono">
              {dimensions.width} × {dimensions.height}
            </div>
          )}
        </div>

        {/* Quality & Resolution Settings */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 bg-[#FAF8F5] border-t border-[#E8E2D9]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#4F4A42]">分辨率</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, scale: 1 }))}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  settings.scale === 1
                    ? 'bg-white border-[#8D9B8E] ring-2 ring-[#8D9B8E]/20 text-[#33322E] shadow-xs'
                    : 'bg-white/60 border-[#DDD5CA] text-[#7A746B] hover:bg-white'
                }`}
              >
                <span className="text-xs font-semibold">1x 标准画质</span>
              </button>

              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, scale: 2 }))}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  settings.scale === 2
                    ? 'bg-white border-[#8D9B8E] ring-2 ring-[#8D9B8E]/20 text-[#33322E] shadow-xs'
                    : 'bg-white/60 border-[#DDD5CA] text-[#7A746B] hover:bg-white'
                }`}
              >
                <span className="text-xs font-semibold">2x 超清画质</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#EDE7DE]">
            <span className="text-xs text-[#5C564E] font-medium">格式</span>
            <div className="flex items-center gap-1 p-1 bg-[#EFE9DF] rounded-xl">
              {(['png', 'jpeg'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSettings((prev) => ({ ...prev, format: fmt }))}
                  className={`px-3 py-1 text-xs font-medium rounded-lg uppercase transition-all ${
                    settings.format === fmt
                      ? 'bg-white text-[#33322E] shadow-xs'
                      : 'text-[#7D776E] hover:text-[#33322E]'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Download Action */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E8E2D9] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#7A746C] hover:text-[#33322E] transition-colors"
          >
            返回
          </button>

          <button
            onClick={handleDownload}
            disabled={isRendering || !previewUrl}
            className="flex-1 max-w-[240px] flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#8D9B8E] hover:bg-[#7D8B7E] disabled:opacity-50 text-white text-xs font-semibold shadow-md active:scale-98 transition-all"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>已保存</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>保存图片 ({settings.scale}x)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
