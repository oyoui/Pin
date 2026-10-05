import React from 'react';
import {
  ImageItem,
  StitchDirection,
  CanvasLayer,
  ShapeLayer,
  StickerLayer,
  ShapeType,
  StickerLibraryItem,
} from '../types';
import { ImageManagerPanel } from './ImageManagerPanel';
import { RadiusPanel } from './RadiusPanel';
import { ShapePanel } from './ShapePanel';
import { StickerPanel } from './StickerPanel';
import {
  Images,
  CornerUpRight,
  Shapes,
  Sticker as StickerIcon,
  Download,
  ChevronDown,
} from 'lucide-react';

export type ActiveTab = 'images' | 'radius' | 'shapes' | 'stickers' | null;

interface BottomToolbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  images: ImageItem[];
  direction: StitchDirection;
  borderRadius: number;
  onChangeRadius: (val: number) => void;
  onAddImages: (files: FileList) => void;
  onRemoveImage: (id: string) => void;
  onMoveImage: (index: number, direction: 'prev' | 'next') => void;
  onSelectImageForCrop: (item: ImageItem) => void;
  onResetWeights: () => void;
  selectedLayer: CanvasLayer | null;
  onAddShape: (type: ShapeType) => void;
  onUpdateShape: (updates: Partial<ShapeLayer>) => void;
  stickerLibrary: StickerLibraryItem[];
  onAddStickerToCanvas: (url: string) => void;
  onImportCustomSticker: (file: File) => void;
  onDeleteCustomSticker: (id: string) => void;
  onUpdateSticker: (updates: Partial<StickerLayer>) => void;
  onOpenExport: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  activeTab,
  setActiveTab,
  images,
  direction,
  borderRadius,
  onChangeRadius,
  onAddImages,
  onRemoveImage,
  onMoveImage,
  onSelectImageForCrop,
  onResetWeights,
  selectedLayer,
  onAddShape,
  onUpdateShape,
  stickerLibrary,
  onAddStickerToCanvas,
  onImportCustomSticker,
  onDeleteCustomSticker,
  onUpdateSticker,
  onOpenExport,
}) => {
  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'images', label: '图片', icon: <Images className="w-5 h-5" /> },
    { key: 'radius', label: '圆角', icon: <CornerUpRight className="w-5 h-5" /> },
    { key: 'shapes', label: '形状', icon: <Shapes className="w-5 h-5" /> },
    { key: 'stickers', label: '贴纸', icon: <StickerIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#E8E2D9] shadow-lg flex flex-col transition-all">
      {/* Expanded Active Tool Panel Content */}
      {activeTab && (
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-3 pb-3 border-b border-[#E8E2D9] max-h-[46dvh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ECE5DC]/60">
            <span className="text-xs font-semibold text-[#7D766C]">
              {tabs.find((t) => t.key === activeTab)?.label}
            </span>
            <button
              onClick={() => setActiveTab(null)}
              className="text-xs text-[#8C857B] hover:text-[#33322E] flex items-center gap-0.5 transition-colors p-1"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {activeTab === 'images' && (
            <ImageManagerPanel
              images={images}
              direction={direction}
              onAddImages={onAddImages}
              onRemoveImage={onRemoveImage}
              onMoveImage={onMoveImage}
              onSelectImageForCrop={onSelectImageForCrop}
              onResetWeights={onResetWeights}
            />
          )}

          {activeTab === 'radius' && (
            <RadiusPanel borderRadius={borderRadius} onChangeRadius={onChangeRadius} />
          )}

          {activeTab === 'shapes' && (
            <ShapePanel
              selectedLayer={selectedLayer && selectedLayer.type === 'shape' ? (selectedLayer as ShapeLayer) : null}
              onAddShape={onAddShape}
              onUpdateShape={onUpdateShape}
            />
          )}

          {activeTab === 'stickers' && (
            <StickerPanel
              selectedSticker={selectedLayer && selectedLayer.type === 'sticker' ? (selectedLayer as StickerLayer) : null}
              stickerLibrary={stickerLibrary}
              onAddStickerToCanvas={onAddStickerToCanvas}
              onImportCustomSticker={onImportCustomSticker}
              onDeleteCustomSticker={onDeleteCustomSticker}
              onUpdateSticker={onUpdateSticker}
            />
          )}
        </div>
      )}

      {/* Main Bottom Tab Navigation Bar */}
      <div className="w-full max-w-3xl mx-auto grid grid-cols-5 items-center h-15 px-2 sm:px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(isActive ? null : tab.key)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors rounded-xl mx-0.5 ${
                isActive
                  ? 'text-[#8D9B8E] font-semibold'
                  : 'text-[#6D675E] hover:text-[#33322E]'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-transform ${
                  isActive ? 'bg-[#8D9B8E]/15 scale-110' : ''
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-[11px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}

        {/* Export Tab Trigger */}
        <button
          onClick={onOpenExport}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-[#6D675E] hover:text-[#8D9B8E] transition-colors rounded-xl mx-0.5"
        >
          <div className="p-1 rounded-lg bg-[#8D9B8E] text-white shadow-xs">
            <Download className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium tracking-tight mt-0.5 text-[#47423B]">
            导出
          </span>
        </button>
      </div>
    </div>
  );
};
