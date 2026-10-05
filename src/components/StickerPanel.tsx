import React, { useRef } from 'react';
import { StickerLayer, StickerLibraryItem } from '../types';
import { MORANDI_COLORS, STROKE_COLORS, SHADOW_COLORS } from '../constants/morandi';
import { Upload, Trash2, Sliders, Sun } from 'lucide-react';

interface StickerPanelProps {
  selectedSticker: StickerLayer | null;
  stickerLibrary: StickerLibraryItem[];
  onAddStickerToCanvas: (url: string) => void;
  onImportCustomSticker: (file: File) => void;
  onDeleteCustomSticker: (id: string) => void;
  onUpdateSticker: (updates: Partial<StickerLayer>) => void;
}

export const StickerPanel: React.FC<StickerPanelProps> = ({
  selectedSticker,
  stickerLibrary,
  onAddStickerToCanvas,
  onImportCustomSticker,
  onDeleteCustomSticker,
  onUpdateSticker,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCustomSticker(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3.5 text-[#33322E] select-none">
      {/* 1. If a sticker is currently selected: Secondary Stroke & Shadow Editor */}
      {selectedSticker && (
        <div className="p-3.5 bg-white rounded-2xl border border-[#E8E2D8] flex flex-col gap-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#8D9B8E]" />
              <span className="text-xs font-semibold text-[#4A463F]">贴纸属性</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateSticker({ isFlippedX: !selectedSticker.isFlippedX })}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium border transition-colors ${
                  selectedSticker.isFlippedX
                    ? 'bg-[#8D9B8E]/15 border-[#8D9B8E] text-[#526153]'
                    : 'bg-white border-[#DDD5CA] text-[#6E685E]'
                }`}
              >
                水平翻转
              </button>
            </div>
          </div>

          {/* Stroke Width Slider */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[#5E5950] font-medium">描边粗细</span>
            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={selectedSticker.strokeWidth}
                onChange={(e) => onUpdateSticker({ strokeWidth: parseInt(e.target.value, 10) })}
                className="w-full accent-[#8D9B8E] cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums text-[#555047] w-8 text-right">
                {selectedSticker.strokeWidth}px
              </span>
            </div>
          </div>

          {/* Stroke Color Palette */}
          {selectedSticker.strokeWidth > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
              {STROKE_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => onUpdateSticker({ strokeColor: c.hex })}
                  className={`w-6 h-6 rounded-full shrink-0 border transition-transform ${
                    selectedSticker.strokeColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'ring-2 ring-[#8D9B8E] ring-offset-2 scale-110'
                      : 'border-black/15 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
              {MORANDI_COLORS.slice(0, 4).map((c) => (
                <button
                  key={c.hex}
                  onClick={() => onUpdateSticker({ strokeColor: c.hex })}
                  className={`w-6 h-6 rounded-full shrink-0 border transition-transform ${
                    selectedSticker.strokeColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'ring-2 ring-[#8D9B8E] ring-offset-2 scale-110'
                      : 'border-black/15 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
              <label className="w-6 h-6 rounded-full shrink-0 border border-dashed border-[#AAA296] flex items-center justify-center cursor-pointer hover:border-[#8D9B8E] relative overflow-hidden">
                <input
                  type="color"
                  value={selectedSticker.strokeColor}
                  onChange={(e) => onUpdateSticker({ strokeColor: e.target.value })}
                  className="opacity-0 absolute inset-0 cursor-pointer"
                />
                <span className="text-[10px] text-[#7A746B]">+</span>
              </label>
            </div>
          )}

          {/* Shadow Controls */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#F0EAE1]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#8D9B8E]" />
                <span className="text-xs font-medium text-[#5E5950]">投影阴影</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSticker({
                    shadowEnabled: !selectedSticker.shadowEnabled,
                    shadowBlur: selectedSticker.shadowBlur || 8,
                    shadowColor: selectedSticker.shadowColor || 'rgba(0, 0, 0, 0.35)',
                    shadowOffsetY: selectedSticker.shadowOffsetY || 4,
                    shadowOffsetX: selectedSticker.shadowOffsetX || 0,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  selectedSticker.shadowEnabled ? 'bg-[#8D9B8E]' : 'bg-[#DDD5CA]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    selectedSticker.shadowEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {selectedSticker.shadowEnabled && (
              <div className="flex flex-col gap-2.5 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[#6B655C]">阴影大小</span>
                  <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={selectedSticker.shadowBlur || 8}
                      onChange={(e) =>
                        onUpdateSticker({ shadowBlur: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-[#8D9B8E] cursor-pointer"
                    />
                    <span className="text-xs font-mono tabular-nums text-[#555047] w-8 text-right">
                      {selectedSticker.shadowBlur || 8}px
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[#6B655C]">下移偏移</span>
                  <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                    <input
                      type="range"
                      min="-10"
                      max="20"
                      step="1"
                      value={selectedSticker.shadowOffsetY ?? 4}
                      onChange={(e) =>
                        onUpdateSticker({ shadowOffsetY: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-[#8D9B8E] cursor-pointer"
                    />
                    <span className="text-xs font-mono tabular-nums text-[#555047] w-8 text-right">
                      {selectedSticker.shadowOffsetY ?? 4}px
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                  {SHADOW_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => onUpdateSticker({ shadowColor: c.hex })}
                      className={`w-6 h-6 rounded-full shrink-0 border transition-transform ${
                        selectedSticker.shadowColor === c.hex
                          ? 'ring-2 ring-[#8D9B8E] ring-offset-2 scale-110'
                          : 'border-black/15 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Opacity */}
          <div className="flex items-center justify-between pt-1 border-t border-[#F0EAE1]">
            <span className="text-xs text-[#6B655C]">透明度</span>
            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={selectedSticker.opacity}
                onChange={(e) => onUpdateSticker({ opacity: parseFloat(e.target.value) })}
                className="w-full accent-[#8D9B8E] cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums text-[#555047] w-8 text-right">
                {Math.round(selectedSticker.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Upload Action */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#5A554D]">
          素材库 ({stickerLibrary.length})
        </span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#8D9B8E] hover:bg-[#7D8B7E] rounded-xl shadow-xs active:scale-95 transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>导入 PNG 贴纸</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,image/png,image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 3. Sticker Library Grid (Only User-imported stickers) */}
      {stickerLibrary.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {stickerLibrary.map((sticker) => (
            <div
              key={sticker.id}
              className="relative group p-2 bg-white rounded-xl border border-[#E4DDD3] hover:border-[#8D9B8E] flex flex-col items-center justify-center transition-all cursor-pointer aspect-square"
              onClick={() => onAddStickerToCanvas(sticker.url)}
            >
              <img
                src={sticker.url}
                alt=""
                className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-xs"
              />
              {/* Delete button from library (NO window.confirm blocker) */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteCustomSticker(sticker.id);
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                title="删除"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-6 bg-white/70 rounded-2xl border border-dashed border-[#DDD5CA] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#8D9B8E] hover:bg-white transition-all text-[#8C857B]"
        >
          <Upload className="w-5 h-5 text-[#8D9B8E]" />
          <span className="text-xs font-medium">点击导入外部 PNG 图片</span>
        </div>
      )}
    </div>
  );
};
