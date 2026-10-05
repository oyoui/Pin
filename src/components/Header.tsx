import React from 'react';
import { StitchDirection } from '../types';
import { Undo2, Redo2, Columns, Rows, Download, ImagePlus } from 'lucide-react';

interface HeaderProps {
  direction: StitchDirection;
  onToggleDirection: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddImageClick: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  direction,
  onToggleDirection,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddImageClick,
  onOpenExport,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E2D9] px-4 sm:px-6 h-14 flex items-center justify-between select-none">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-xl font-bold tracking-tight text-[#33322E] flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-lg bg-[#8D9B8E] text-white text-xs font-black flex items-center justify-center shadow-xs">
            P
          </span>
          <span className="tracking-wide">Pin</span>
        </a>
      </div>

      {/* Zone 2: Direction Switch & Quick Controls */}
      <div className="flex items-center gap-2">
        {/* Stitching Direction Segmented Toggle */}
        <div className="flex items-center p-0.5 bg-[#EAE4DC] rounded-xl">
          <button
            onClick={() => direction !== 'horizontal' && onToggleDirection()}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              direction === 'horizontal'
                ? 'bg-white text-[#33322E] shadow-xs'
                : 'text-[#7D766C] hover:text-[#33322E]'
            }`}
            title="横向无缝拼接"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">横向拼接</span>
          </button>
          <button
            onClick={() => direction !== 'vertical' && onToggleDirection()}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              direction === 'vertical'
                ? 'bg-white text-[#33322E] shadow-xs'
                : 'text-[#7D766C] hover:text-[#33322E]'
            }`}
            title="竖向无缝拼接"
          >
            <Rows className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">竖向拼接</span>
          </button>
        </div>

        {/* Add image shortcut */}
        <button
          onClick={onAddImageClick}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#DDD5CA] bg-white hover:bg-[#F2EDE4] text-xs font-medium text-[#555047] transition-colors"
          title="导入新图片（支持≥2张）"
        >
          <ImagePlus className="w-3.5 h-3.5 text-[#8D9B8E]" />
          <span>添加图片</span>
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#666056] hover:bg-[#EAE4DC] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#666056] hover:bg-[#EAE4DC] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="重做 (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#8D9B8E] hover:bg-[#7D8B7E] rounded-xl shadow-xs active:scale-95 transition-all whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出画质</span>
        </button>
      </div>
    </header>
  );
};
