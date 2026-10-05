import React, { useRef } from 'react';
import { ImageItem, StitchDirection } from '../types';
import { Upload, Scissors, Trash2, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

interface ImageManagerPanelProps {
  images: ImageItem[];
  direction: StitchDirection;
  onAddImages: (files: FileList) => void;
  onRemoveImage: (id: string) => void;
  onMoveImage: (index: number, direction: 'prev' | 'next') => void;
  onSelectImageForCrop: (item: ImageItem) => void;
  onResetWeights: () => void;
}

export const ImageManagerPanel: React.FC<ImageManagerPanelProps> = ({
  images,
  direction,
  onAddImages,
  onRemoveImage,
  onMoveImage,
  onSelectImageForCrop,
  onResetWeights,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isHorizontal = direction === 'horizontal';

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddImages(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3 text-[#33322E] select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#5A554D]">
          图片 ({images.length})
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onResetWeights}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-[#DDD5CA] bg-white hover:bg-[#F2EDE4] text-[#666056] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>等比</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#8D9B8E] hover:bg-[#7D8B7E] rounded-lg shadow-xs active:scale-95 transition-all"
          >
            <Upload className="w-3 h-3" />
            <span>添加</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFiles}
          />
        </div>
      </div>

      {/* Image Thumbnails List */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {images.map((item, index) => (
          <div
            key={item.id}
            className="relative p-2 rounded-2xl bg-white border border-[#E4DDD3] shadow-xs flex flex-col gap-2 group transition-all"
          >
            {/* Thumbnail */}
            <div
              onClick={() => onSelectImageForCrop(item)}
              className="relative aspect-4/3 rounded-xl overflow-hidden cursor-pointer bg-[#EFE9DF]"
            >
              <img
                src={item.displayUrl || item.originalUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-colors">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-[#33322E] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Scissors className="w-2.5 h-2.5 text-[#8D9B8E]" />
                  <span>裁剪</span>
                </div>
              </div>

              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.2 rounded bg-black/40 text-[9px] text-white font-mono">
                #{index + 1}
              </div>
            </div>

            {/* Action Bar for this image */}
            <div className="flex items-center justify-between px-0.5 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onMoveImage(index, 'prev')}
                  disabled={index === 0}
                  className="w-6 h-6 rounded flex items-center justify-center text-[#787268] hover:bg-[#F2EDE4] disabled:opacity-20 transition-colors"
                >
                  {isHorizontal ? <ArrowLeft className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => onMoveImage(index, 'next')}
                  disabled={index === images.length - 1}
                  className="w-6 h-6 rounded flex items-center justify-center text-[#787268] hover:bg-[#F2EDE4] disabled:opacity-20 transition-colors"
                >
                  {isHorizontal ? <ArrowRight className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                </button>
              </div>

              <button
                onClick={() => onSelectImageForCrop(item)}
                className="text-[11px] text-[#8D9B8E] hover:underline"
              >
                裁剪
              </button>

              <button
                onClick={() => {
                  if (images.length <= 2) return;
                  onRemoveImage(item.id);
                }}
                disabled={images.length <= 2}
                className="w-6 h-6 rounded flex items-center justify-center text-[#999288] hover:text-red-600 hover:bg-red-50 disabled:opacity-20 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
