import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ImageItem,
  StitchDirection,
  CanvasLayer,
  ShapeLayer,
  StickerLayer,
  ShapeType,
  StickerLibraryItem,
} from './types';
import { DEFAULT_SAMPLE_IMAGES, MORANDI_COLORS } from './constants/morandi';
import { loadStickerLibrary, saveCustomSticker, deleteCustomSticker } from './utils/storage';
import { Header } from './components/Header';
import { CanvasStage } from './components/CanvasStage';
import { CropModal } from './components/CropModal';
import { ExportModal } from './components/ExportModal';
import { BottomToolbar, ActiveTab } from './components/BottomToolbar';
import { LayerControls } from './components/LayerControls';

interface HistoryState {
  images: ImageItem[];
  direction: StitchDirection;
  borderRadius: number;
  layers: CanvasLayer[];
}

export default function App() {
  const [images, setImages] = useState<ImageItem[]>(DEFAULT_SAMPLE_IMAGES);
  const [direction, setDirection] = useState<StitchDirection>('horizontal');
  const [borderRadius, setBorderRadius] = useState<number>(0);
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>(null);

  const [croppingImage, setCroppingImage] = useState<ImageItem | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [stickerLibrary, setStickerLibrary] = useState<StickerLibraryItem[]>([]);

  const headerFileInputRef = useRef<HTMLInputElement>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  useEffect(() => {
    const list = loadStickerLibrary();
    setStickerLibrary(list);
  }, []);

  const commitToHistory = useCallback(() => {
    if (isUndoRedoAction.current) return;
    const currentSnapshot: HistoryState = {
      images: JSON.parse(JSON.stringify(images)),
      direction,
      borderRadius,
      layers: JSON.parse(JSON.stringify(layers)),
    };

    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, currentSnapshot];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [images, direction, borderRadius, layers, historyIndex]);

  useEffect(() => {
    if (history.length === 0) {
      setHistory([
        {
          images: JSON.parse(JSON.stringify(DEFAULT_SAMPLE_IMAGES)),
          direction: 'horizontal',
          borderRadius: 0,
          layers: [],
        },
      ]);
      setHistoryIndex(0);
    }
  }, [history.length]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const targetState = history[historyIndex - 1];
      setImages(targetState.images);
      setDirection(targetState.direction);
      setBorderRadius(targetState.borderRadius);
      setLayers(targetState.layers);
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 50);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetState = history[historyIndex + 1];
      setImages(targetState.images);
      setDirection(targetState.direction);
      setBorderRadius(targetState.borderRadius);
      setLayers(targetState.layers);
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 50);
    }
  }, [history, historyIndex]);

  const handleDeleteLayer = useCallback(
    (id: string) => {
      setLayers((prev) => prev.filter((l) => l.id !== id));
      if (selectedLayerId === id) {
        setSelectedLayerId(null);
      }
      commitToHistory();
    },
    [selectedLayerId, commitToHistory]
  );

  // Keyboard shortcut listener for Ctrl+Z, Ctrl+Y, Delete/Backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId) {
          e.preventDefault();
          handleDeleteLayer(selectedLayerId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedLayerId, handleDeleteLayer]);

  const handleToggleDirection = () => {
    setDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
    commitToHistory();
  };

  const handleAddImages = (files: FileList) => {
    const readers: Promise<ImageItem>[] = [];

    Array.from(files).forEach((file) => {
      const p = new Promise<ImageItem>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const w = img.naturalWidth || 800;
            const h = img.naturalHeight || 800;
            resolve({
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              originalUrl: dataUrl,
              displayUrl: dataUrl,
              naturalWidth: w,
              naturalHeight: h,
              originalWidth: w,
              originalHeight: h,
              weight: 1,
            });
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
      readers.push(p);
    });

    Promise.all(readers).then((newItems) => {
      setImages((prev) => [...prev, ...newItems]);
      commitToHistory();
    });
  };

  const handleRemoveImage = (id: string) => {
    if (images.length <= 2) return;
    setImages((prev) => prev.filter((img) => img.id !== id));
    commitToHistory();
  };

  const handleMoveImage = (index: number, moveDirection: 'prev' | 'next') => {
    const targetIndex = moveDirection === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
    commitToHistory();
  };

  const handleResetWeights = () => {
    setImages((prev) => prev.map((img) => ({ ...img, weight: 1 })));
    commitToHistory();
  };

  const handleAdjustWeights = (
    indexA: number,
    indexB: number,
    newWeightA: number,
    newWeightB: number
  ) => {
    setImages((prev) => {
      const copy = [...prev];
      copy[indexA] = { ...copy[indexA], weight: newWeightA };
      copy[indexB] = { ...copy[indexB], weight: newWeightB };
      return copy;
    });
  };

  const handleApplyCrop = (croppedDataUrl: string, croppedWidth: number, croppedHeight: number) => {
    if (!croppingImage) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === croppingImage.id
          ? {
              ...img,
              displayUrl: croppedDataUrl,
              naturalWidth: croppedWidth,
              naturalHeight: croppedHeight,
            }
          : img
      )
    );
    setCroppingImage(null);
    commitToHistory();
  };

  const handleUseOriginal = () => {
    if (!croppingImage) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === croppingImage.id
          ? {
              ...img,
              displayUrl: img.originalUrl,
              naturalWidth: img.originalWidth || img.naturalWidth,
              naturalHeight: img.originalHeight || img.naturalHeight,
            }
          : img
      )
    );
    setCroppingImage(null);
    commitToHistory();
  };

  const handleAddShape = (type: ShapeType) => {
    const newShape: ShapeLayer = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shapeType: type,
      x: 35,
      y: 35,
      width: type === 'line' ? 30 : 25,
      height: type === 'line' ? 6 : 25,
      rotation: 0,
      opacity: 0.9,
      zIndex: layers.length + 1,
      fillEnabled: type !== 'line',
      fillColor: MORANDI_COLORS[0].hex,
      strokeEnabled: true,
      strokeColor: '#FFFFFF',
      strokeWidth: 3,
    };

    setLayers((prev) => [...prev, newShape]);
    setSelectedLayerId(newShape.id);
    commitToHistory();
  };

  const handleUpdateShape = (updates: Partial<ShapeLayer>) => {
    if (!selectedLayerId) return;
    setLayers((prev) =>
      prev.map((l) => (l.id === selectedLayerId ? ({ ...l, ...updates } as ShapeLayer) : l))
    );
  };

  const handleAddStickerToCanvas = (url: string) => {
    const newSticker: StickerLayer = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      imageUrl: url,
      x: 35,
      y: 35,
      width: 25,
      height: 25,
      rotation: 0,
      opacity: 1,
      zIndex: layers.length + 1,
      strokeWidth: 4,
      strokeColor: '#FFFFFF',
      shadowEnabled: false,
      shadowColor: 'rgba(0, 0, 0, 0.35)',
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 4,
    };

    setLayers((prev) => [...prev, newSticker]);
    setSelectedLayerId(newSticker.id);
    commitToHistory();
  };

  const handleImportCustomSticker = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newItem: StickerLibraryItem = {
        id: `custom-stk-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '') || '贴纸',
        url: dataUrl,
        isCustom: true,
        createdAt: Date.now(),
      };

      const updatedLib = saveCustomSticker(newItem);
      setStickerLibrary(updatedLib);
      handleAddStickerToCanvas(dataUrl);
      setActiveTab('stickers');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCustomSticker = (id: string) => {
    const updated = deleteCustomSticker(id);
    setStickerLibrary(updated);
  };

  const handleUpdateSticker = (updates: Partial<StickerLayer>) => {
    if (!selectedLayerId) return;
    setLayers((prev) =>
      prev.map((l) => (l.id === selectedLayerId ? ({ ...l, ...updates } as StickerLayer) : l))
    );
  };

  const handleUpdateLayer = (id: string, updates: Partial<CanvasLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? ({ ...l, ...updates } as CanvasLayer) : l)));
  };

  const handleDuplicateLayer = (layer: CanvasLayer) => {
    const dup: CanvasLayer = {
      ...layer,
      id: `${layer.type}-${Date.now()}`,
      x: Math.min(75, layer.x + 4),
      y: Math.min(75, layer.y + 4),
      zIndex: layers.length + 1,
    };
    setLayers((prev) => [...prev, dup]);
    setSelectedLayerId(dup.id);
    commitToHistory();
  };

  const handleBringForward = (id: string) => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (index === -1 || index === prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy.map((l, i) => ({ ...l, zIndex: i + 1 }));
    });
    commitToHistory();
  };

  const handleSendBackward = (id: string) => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (index <= 0) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy.map((l, i) => ({ ...l, zIndex: i + 1 }));
    });
    commitToHistory();
  };

  const handleRotateStep = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, rotation: (l.rotation + 45) % 360 } : l))
    );
    commitToHistory();
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-[#F6F5F2] text-[#33322E] flex flex-col justify-between overflow-hidden select-none touch-none overscroll-none font-sans">
      {/* 1. Top Header */}
      <Header
        direction={direction}
        onToggleDirection={handleToggleDirection}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddImageClick={() => headerFileInputRef.current?.click()}
        onOpenExport={() => setIsExportOpen(true)}
      />

      <input
        ref={headerFileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleAddImages(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* 2. Main Interactive Workspace (Dual-responsive, adapts dynamically) */}
      <main className="relative flex-1 w-full flex flex-col items-center justify-center p-2 sm:p-4 pb-20 sm:pb-24 overflow-hidden">
        <LayerControls
          selectedLayer={selectedLayer}
          onDelete={handleDeleteLayer}
          onDuplicate={handleDuplicateLayer}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onRotateStep={handleRotateStep}
          onDeselect={() => setSelectedLayerId(null)}
        />

        <CanvasStage
          images={images}
          direction={direction}
          borderRadius={borderRadius}
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onUpdateLayer={handleUpdateLayer}
          onDeleteLayer={handleDeleteLayer}
          onAdjustWeights={handleAdjustWeights}
          onSelectImageForCrop={(item) => setCroppingImage(item)}
          onCommitChange={commitToHistory}
        />
      </main>

      {/* 3. Bottom Tool & Navigation Bar */}
      <BottomToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        images={images}
        direction={direction}
        borderRadius={borderRadius}
        onChangeRadius={(val) => {
          setBorderRadius(val);
          commitToHistory();
        }}
        onAddImages={handleAddImages}
        onRemoveImage={handleRemoveImage}
        onMoveImage={handleMoveImage}
        onSelectImageForCrop={(item) => setCroppingImage(item)}
        onResetWeights={handleResetWeights}
        selectedLayer={selectedLayer}
        onAddShape={handleAddShape}
        onUpdateShape={handleUpdateShape}
        stickerLibrary={stickerLibrary}
        onAddStickerToCanvas={handleAddStickerToCanvas}
        onImportCustomSticker={handleImportCustomSticker}
        onDeleteCustomSticker={handleDeleteCustomSticker}
        onUpdateSticker={handleUpdateSticker}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* 4. Crop Modal */}
      <CropModal
        isOpen={!!croppingImage}
        imageItem={croppingImage}
        onClose={() => setCroppingImage(null)}
        onApplyCrop={handleApplyCrop}
        onUseOriginal={handleUseOriginal}
      />

      {/* 5. 1x / 2x Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        images={images}
        direction={direction}
        borderRadius={borderRadius}
        layers={layers}
      />
    </div>
  );
}
