import React from 'react';
import { ShapeType, ShapeLayer } from '../types';
import { MORANDI_COLORS, STROKE_COLORS } from '../constants/morandi';
import { Square, Circle, Triangle, Star, Heart, Slash, RectangleHorizontal } from 'lucide-react';

interface ShapePanelProps {
  selectedLayer: ShapeLayer | null;
  onAddShape: (type: ShapeType) => void;
  onUpdateShape: (updates: Partial<ShapeLayer>) => void;
}

export const ShapePanel: React.FC<ShapePanelProps> = ({
  selectedLayer,
  onAddShape,
  onUpdateShape,
}) => {
  // Shape list with NO text descriptions as requested
  const shapesList: { type: ShapeType; icon: React.ReactNode }[] = [
    { type: 'rect', icon: <Square className="w-5 h-5" /> },
    { type: 'rounded-rect', icon: <RectangleHorizontal className="w-5 h-5" /> },
    { type: 'circle', icon: <Circle className="w-5 h-5" /> },
    { type: 'triangle', icon: <Triangle className="w-5 h-5" /> },
    { type: 'star', icon: <Star className="w-5 h-5" /> },
    { type: 'heart', icon: <Heart className="w-5 h-5" /> },
    { type: 'line', icon: <Slash className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col gap-3.5 text-[#33322E] select-none">
      {/* 1. Shape Selection Grid (Icons only, NO text descriptions) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {shapesList.map((item) => (
          <button
            key={item.type}
            onClick={() => onAddShape(item.type)}
            className="flex items-center justify-center h-11 rounded-xl bg-white border border-[#E4DDD3] hover:border-[#8D9B8E] hover:bg-[#F9F7F4] active:scale-95 transition-all"
          >
            <div className="text-[#5A554D] hover:text-[#8D9B8E] transition-colors">
              {item.icon}
            </div>
          </button>
        ))}
      </div>

      {/* 2. Shape Properties (Shown when a shape layer is selected) */}
      {selectedLayer && (
        <div className="p-3.5 bg-white rounded-2xl border border-[#E8E2D8] flex flex-col gap-3.5 animate-in fade-in duration-150">
          {/* Fill controls (not applicable to line) */}
          {selectedLayer.shapeType !== 'line' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#5E5950] font-medium">填充</span>
                <button
                  type="button"
                  onClick={() => onUpdateShape({ fillEnabled: !selectedLayer.fillEnabled })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    selectedLayer.fillEnabled ? 'bg-[#8D9B8E]' : 'bg-[#DDD5CA]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      selectedLayer.fillEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {selectedLayer.fillEnabled && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 px-3 no-scrollbar -mx-1">
                  {MORANDI_COLORS.map((c) => {
                    const isSelected = selectedLayer.fillColor.toLowerCase() === c.hex.toLowerCase();
                    const isLight = c.hex.toUpperCase() === '#FFFFFF' || c.hex.toUpperCase() === '#F9F8F6' || c.hex.toUpperCase() === '#EFECE6';
                    return (
                      <button
                        key={c.hex}
                        onClick={() => onUpdateShape({ fillColor: c.hex })}
                        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-[#8D9B8E] ring-inset scale-105 shadow-xs'
                            : 'border border-black/15 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {isSelected && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-black/60' : 'bg-white'}`} />
                        )}
                      </button>
                    );
                  })}
                  <label className="w-7 h-7 rounded-full shrink-0 border border-dashed border-[#AAA296] flex items-center justify-center cursor-pointer hover:border-[#8D9B8E] relative overflow-hidden">
                    <input
                      type="color"
                      value={selectedLayer.fillColor}
                      onChange={(e) => onUpdateShape({ fillColor: e.target.value })}
                      className="opacity-0 absolute inset-0 cursor-pointer"
                    />
                    <span className="text-xs text-[#7A746B]">+</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Stroke controls */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#5E5950] font-medium">边框</span>
              <button
                type="button"
                onClick={() => onUpdateShape({ strokeEnabled: !selectedLayer.strokeEnabled })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  selectedLayer.strokeEnabled ? 'bg-[#8D9B8E]' : 'bg-[#DDD5CA]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    selectedLayer.strokeEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {selectedLayer.strokeEnabled && (
              <>
                <div className="flex items-center gap-2 overflow-x-auto py-1 px-3 no-scrollbar -mx-1">
                  {STROKE_COLORS.map((c) => {
                    const isSelected = selectedLayer.strokeColor.toLowerCase() === c.hex.toLowerCase();
                    const isLight = c.hex.toUpperCase() === '#FFFFFF' || c.hex.toUpperCase() === '#EFECE6';
                    return (
                      <button
                        key={c.hex}
                        onClick={() => onUpdateShape({ strokeColor: c.hex })}
                        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-[#8D9B8E] ring-inset scale-105 shadow-xs'
                            : 'border border-black/15 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {isSelected && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-black/60' : 'bg-white'}`} />
                        )}
                      </button>
                    );
                  })}
                  <label className="w-7 h-7 rounded-full shrink-0 border border-dashed border-[#AAA296] flex items-center justify-center cursor-pointer hover:border-[#8D9B8E] relative overflow-hidden">
                    <input
                      type="color"
                      value={selectedLayer.strokeColor}
                      onChange={(e) => onUpdateShape({ strokeColor: e.target.value })}
                      className="opacity-0 absolute inset-0 cursor-pointer"
                    />
                    <span className="text-xs text-[#7A746B]">+</span>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-[#6B655C]">粗细</span>
                  <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                    <input
                      type="range"
                      min="1"
                      max="16"
                      step="1"
                      value={selectedLayer.strokeWidth}
                      onChange={(e) => onUpdateShape({ strokeWidth: parseInt(e.target.value, 10) })}
                      className="w-full accent-[#8D9B8E] cursor-pointer"
                    />
                    <span className="text-xs font-mono tabular-nums text-[#555047] w-8 text-right">
                      {selectedLayer.strokeWidth}px
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Opacity */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#F0EAE1]">
            <span className="text-xs text-[#6B655C]">透明度</span>
            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={selectedLayer.opacity}
                onChange={(e) => onUpdateShape({ opacity: parseFloat(e.target.value) })}
                className="w-full accent-[#8D9B8E] cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums text-[#555047] w-8 text-right">
                {Math.round(selectedLayer.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
