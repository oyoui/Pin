import React, { useRef, useState, useEffect } from 'react';
import {
  ImageItem,
  StitchDirection,
  CanvasLayer,
  ShapeLayer,
  StickerLayer,
} from '../types';
import { getStitchedCanvasDimensions } from '../utils/canvasRenderer';
import { SplitHandle } from './SplitHandle';
import { RotateCw, X } from 'lucide-react';

interface CanvasStageProps {
  images: ImageItem[];
  direction: StitchDirection;
  borderRadius: number;
  layers: CanvasLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<CanvasLayer>) => void;
  onDeleteLayer: (id: string) => void;
  onAdjustWeights: (indexA: number, indexB: number, newWeightA: number, newWeightB: number) => void;
  onSelectImageForCrop: (item: ImageItem) => void;
  onCommitChange?: () => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  images,
  direction,
  borderRadius,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onAdjustWeights,
  onSelectImageForCrop,
  onCommitChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const isHorizontal = direction === 'horizontal';

  // Compute exact layout directly by adding image dimensions together (NO preset board!)
  const layout = getStitchedCanvasDimensions(images, direction, 1000);

  // Measure available container size to guarantee the stage is always visible
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 600) : 600,
    height: typeof window !== 'undefined' ? Math.min(window.innerHeight - 200, 480) : 480,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 20 && rect.height > 20) {
          setContainerSize({
            width: rect.width - 24,
            height: rect.height - 24,
          });
        }
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Calculate fitting width and height:
  const ar = layout.aspectRatio > 0 ? layout.aspectRatio : 1;
  let stageWidth = containerSize.width;
  let stageHeight = stageWidth / ar;

  if (stageHeight > containerSize.height) {
    stageHeight = containerSize.height;
    stageWidth = stageHeight * ar;
  }

  const [dragAction, setDragAction] = useState<{
    type: 'move' | 'resize' | 'rotate';
    handle?: string;
    layerId: string;
    startX: number;
    startY: number;
    initialLayer: CanvasLayer;
    stageRect: DOMRect;
  } | null>(null);

  useEffect(() => {
    if (!dragAction) return;

    const handlePointerMove = (e: PointerEvent) => {
      const { type, handle, layerId, startX, startY, initialLayer, stageRect } = dragAction;
      const dxPx = e.clientX - startX;
      const dyPx = e.clientY - startY;

      const dxPct = (dxPx / stageRect.width) * 100;
      const dyPct = (dyPx / stageRect.height) * 100;

      if (type === 'move') {
        onUpdateLayer(layerId, {
          x: Number((initialLayer.x + dxPct).toFixed(2)),
          y: Number((initialLayer.y + dyPct).toFixed(2)),
        });
      } else if (type === 'resize' && handle) {
        let { x, y, width, height } = initialLayer;

        if (handle.includes('e')) {
          width = Math.max(5, initialLayer.width + dxPct);
        }
        if (handle.includes('s')) {
          height = Math.max(5, initialLayer.height + dyPct);
        }
        if (handle.includes('w')) {
          const newW = initialLayer.width - dxPct;
          if (newW >= 5) {
            width = newW;
            x = initialLayer.x + dxPct;
          }
        }
        if (handle.includes('n')) {
          const newH = initialLayer.height - dyPct;
          if (newH >= 5) {
            height = newH;
            y = initialLayer.y + dyPct;
          }
        }

        onUpdateLayer(layerId, {
          x: Number(x.toFixed(2)),
          y: Number(y.toFixed(2)),
          width: Number(width.toFixed(2)),
          height: Number(height.toFixed(2)),
        });
      } else if (type === 'rotate') {
        const layerCenterPxX = stageRect.left + ((initialLayer.x + initialLayer.width / 2) / 100) * stageRect.width;
        const layerCenterPxY = stageRect.top + ((initialLayer.y + initialLayer.height / 2) / 100) * stageRect.height;
        const angleRad = Math.atan2(e.clientY - layerCenterPxY, e.clientX - layerCenterPxX);
        let angleDeg = Math.round((angleRad * 180) / Math.PI) - 90;
        if (angleDeg < 0) angleDeg += 360;
        onUpdateLayer(layerId, { rotation: angleDeg });
      }
    };

    const handlePointerUp = () => {
      setDragAction(null);
      if (onCommitChange) {
        onCommitChange();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragAction, onUpdateLayer, onCommitChange]);

  const startDrag = (
    e: React.PointerEvent,
    layer: CanvasLayer,
    type: 'move' | 'resize' | 'rotate',
    handle?: string
  ) => {
    e.stopPropagation();
    if (!stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    onSelectLayer(layer.id);
    setDragAction({
      type,
      handle,
      layerId: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      initialLayer: { ...layer },
      stageRect,
    });
  };

  const renderShapePath = (shape: ShapeLayer) => {
    const { shapeType, fillEnabled, fillColor, strokeEnabled, strokeColor, strokeWidth } = shape;
    const fill = fillEnabled && shapeType !== 'line' ? fillColor : 'none';
    const stroke = strokeEnabled ? strokeColor : 'none';
    const sWidth = strokeEnabled ? strokeWidth : 0;

    switch (shapeType) {
      case 'rect':
        return (
          <rect
            x={sWidth / 2}
            y={sWidth / 2}
            width={`calc(100% - ${sWidth}px)`}
            height={`calc(100% - ${sWidth}px)`}
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth}
          />
        );

      case 'rounded-rect':
        return (
          <rect
            x={sWidth / 2}
            y={sWidth / 2}
            width={`calc(100% - ${sWidth}px)`}
            height={`calc(100% - ${sWidth}px)`}
            rx="18%"
            ry="18%"
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth}
          />
        );

      case 'circle':
        return (
          <ellipse
            cx="50%"
            cy="50%"
            rx={`calc(50% - ${sWidth / 2}px)`}
            ry={`calc(50% - ${sWidth / 2}px)`}
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth}
          />
        );

      case 'triangle':
        return (
          <polygon
            points="50,4 96,96 4,96"
            viewBox="0 0 100 100"
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth * 1.2}
            strokeLinejoin="round"
          />
        );

      case 'star': {
        const points = '50,5 64,36 98,38 72,60 80,94 50,75 20,94 28,60 2,38 36,36';
        return (
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth * 1.2}
            strokeLinejoin="round"
          />
        );
      }

      case 'heart':
        return (
          <path
            d="M50 30 C50 0, 0 0, 0 30 C0 65, 50 65, 50 100 C50 65, 100 65, 100 30 C100 0, 50 0, 50 30 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth * 1.2}
            strokeLinejoin="round"
          />
        );

      case 'line':
        return (
          <line
            x1="0"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke={strokeColor}
            strokeWidth={Math.max(2, strokeWidth)}
            strokeLinecap="round"
          />
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none touch-none"
    >
      {/* SVG Definitions for live sticker strokes */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {layers
            .filter((l): l is StickerLayer => l.type === 'sticker' && l.strokeWidth > 0)
            .map((stk) => (
              <filter
                key={stk.id}
                id={`stroke-filter-${stk.id}`}
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <feMorphology
                  in="SourceAlpha"
                  result="dilated"
                  operator="dilate"
                  radius={stk.strokeWidth}
                />
                <feFlood floodColor={stk.strokeColor} result="flood" />
                <feComposite in="flood" in2="dilated" operator="in" result="stroke" />
                <feMerge>
                  <feMergeNode in="stroke" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
        </defs>
      </svg>

      {/* Main Canvas Stage:
          Explicit width & height calculated from exact summed image sizes!
          Always visible, sharp and responsive! */}
      <div
        ref={stageRef}
        onClick={() => onSelectLayer(null)}
        className="relative bg-white shadow-xl transition-all duration-150 overflow-hidden shrink-0"
        style={{
          width: `${Math.max(160, Math.round(stageWidth))}px`,
          height: `${Math.max(160, Math.round(stageHeight))}px`,
          borderRadius: `${borderRadius}px`,
        }}
      >
        {/* Layer 1: Stitched Base Images (directly added together, 0 gap) */}
        <div
          className={`absolute inset-0 flex w-full h-full overflow-hidden ${
            isHorizontal ? 'flex-row' : 'flex-col'
          }`}
          style={{ gap: 0 }}
        >
          {layout.segments.map((seg) => {
            const item = images[seg.index];
            if (!item) return null;

            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectImageForCrop(item);
                }}
                className="relative overflow-hidden group cursor-pointer transition-all shrink-0"
                style={{
                  width: isHorizontal ? `${seg.fraction * 100}%` : '100%',
                  height: isHorizontal ? '100%' : `${seg.fraction * 100}%`,
                }}
              >
                <img
                  src={item.displayUrl || item.originalUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-fill pointer-events-none transition-transform duration-300 group-hover:scale-[1.01]"
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />

                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/30 backdrop-blur-xs text-[10px] text-white/90 font-mono pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  #{seg.index + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Draggable Partition Short Bars between adjacent images */}
        {layout.segments.slice(0, -1).map((_, index) => {
          let cumulativeFraction = 0;
          for (let i = 0; i <= index; i++) {
            cumulativeFraction += layout.segments[i].fraction;
          }
          const positionPct = cumulativeFraction * 100;

          return (
            <div
              key={`split-boundary-${index}`}
              className="absolute z-20 pointer-events-auto"
              style={{
                left: isHorizontal ? `${positionPct}%` : '0%',
                top: isHorizontal ? '0%' : `${positionPct}%`,
                width: isHorizontal ? '0px' : '100%',
                height: isHorizontal ? '100%' : '0px',
              }}
            >
              <SplitHandle
                index={index}
                direction={direction}
                weightA={images[index]?.weight || 1}
                weightB={images[index + 1]?.weight || 1}
                containerSize={isHorizontal ? stageWidth : stageHeight}
                onAdjustWeights={onAdjustWeights}
                onCommitChange={onCommitChange}
              />
            </div>
          );
        })}

        {/* Layer 2: Overlay Floating Layers (Shapes & PNG Stickers) */}
        {layers.map((layer) => {
          const isSelected = selectedLayerId === layer.id;

          let stickerFilterStyle = '';
          if (layer.type === 'sticker') {
            const stk = layer as StickerLayer;
            const filters: string[] = [];
            if (stk.shadowEnabled && (stk.shadowBlur || 0) > 0) {
              const ox = stk.shadowOffsetX ?? 0;
              const oy = stk.shadowOffsetY ?? 4;
              const blur = stk.shadowBlur ?? 8;
              const color = stk.shadowColor || 'rgba(0, 0, 0, 0.35)';
              filters.push(`drop-shadow(${ox}px ${oy}px ${blur}px ${color})`);
            }
            if (stk.strokeWidth > 0) {
              filters.push(`url(#stroke-filter-${stk.id})`);
            }
            stickerFilterStyle = filters.join(' ');
          }

          return (
            <div
              key={layer.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectLayer(layer.id);
              }}
              onPointerDown={(e) => startDrag(e, layer, 'move')}
              className={`absolute select-none cursor-move touch-none transition-shadow ${
                isSelected ? 'ring-1.5 ring-[#8D9B8E]' : 'hover:ring-1 hover:ring-[#8D9B8E]/50'
              }`}
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: `${layer.width}%`,
                height: `${layer.height}%`,
                transform: `rotate(${layer.rotation}deg)`,
                opacity: layer.opacity,
                zIndex: layer.zIndex + 30,
              }}
            >
              {/* Content */}
              {layer.type === 'shape' ? (
                <svg
                  className="w-full h-full overflow-visible pointer-events-none"
                  viewBox={
                    layer.shapeType === 'triangle' ||
                    layer.shapeType === 'star' ||
                    layer.shapeType === 'heart'
                      ? '0 0 100 100'
                      : undefined
                  }
                  preserveAspectRatio="none"
                >
                  {renderShapePath(layer as ShapeLayer)}
                </svg>
              ) : (
                <img
                  src={(layer as StickerLayer).imageUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain pointer-events-none"
                  style={{
                    filter: stickerFilterStyle || undefined,
                    transform: (layer as StickerLayer).isFlippedX ? 'scaleX(-1)' : undefined,
                  }}
                />
              )}

              {/* Bounding Box & Transform Handles when Selected */}
              {isSelected && (
                <>
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white shadow-md border border-[#8D9B8E] flex items-center justify-center cursor-grab active:cursor-grabbing text-[#556456] hover:bg-[#8D9B8E] hover:text-white transition-colors"
                    onPointerDown={(e) => startDrag(e, layer, 'rotate')}
                  >
                    <RotateCw className="w-2.5 h-2.5" />
                  </div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-[#8D9B8E] pointer-events-none" />

                  {/* Direct Delete Button on Top Right Corner of Selection */}
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-50 cursor-pointer"
                    title="删除"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Corner Resize Handles */}
                  <div
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#8D9B8E] rounded-full cursor-nwse-resize shadow-xs"
                    onPointerDown={(e) => startDrag(e, layer, 'resize', 'nw')}
                  />
                  <div
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#8D9B8E] rounded-full cursor-nesw-resize shadow-xs"
                    onPointerDown={(e) => startDrag(e, layer, 'resize', 'sw')}
                  />
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#8D9B8E] rounded-full cursor-nwse-resize shadow-xs"
                    onPointerDown={(e) => startDrag(e, layer, 'resize', 'se')}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
