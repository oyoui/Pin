import React from 'react';
import { CanvasLayer } from '../types';
import { Trash2, Copy, ArrowUp, ArrowDown, RotateCw, X } from 'lucide-react';

interface LayerControlsProps {
  selectedLayer: CanvasLayer | null;
  onDelete: (id: string) => void;
  onDuplicate: (layer: CanvasLayer) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onRotateStep: (id: string) => void;
  onDeselect: () => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  selectedLayer,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onRotateStep,
  onDeselect,
}) => {
  if (!selectedLayer) return null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-40 bg-[#2E2C28]/95 text-white rounded-full px-2.5 py-1 shadow-xl backdrop-blur-md flex items-center gap-1 select-none animate-in fade-in duration-150 border border-white/10"
    >
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate(selectedLayer);
        }}
        className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white"
        title="复制"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onBringForward(selectedLayer.id);
        }}
        className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white"
        title="上移"
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSendBackward(selectedLayer.id);
        }}
        className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white"
        title="下移"
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRotateStep(selectedLayer.id);
        }}
        className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white"
        title="旋转"
      >
        <RotateCw className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-3 bg-white/20 mx-0.5" />

      {/* Delete Layer Button with strict stopPropagation */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(selectedLayer.id);
        }}
        className="p-1.5 rounded-full hover:bg-red-500 transition-colors text-red-300 hover:text-white cursor-pointer"
        title="删除图层"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDeselect();
        }}
        className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/70 hover:text-white ml-0.5"
        title="关闭"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
