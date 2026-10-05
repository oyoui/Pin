import React, { useState } from 'react';
import { StitchDirection } from '../types';

interface SplitHandleProps {
  index: number; // between image[index] and image[index + 1]
  direction: StitchDirection;
  weightA: number;
  weightB: number;
  containerSize: number; // width for horizontal, height for vertical
  onAdjustWeights: (indexA: number, indexB: number, newWeightA: number, newWeightB: number) => void;
  onCommitChange?: () => void;
}

export const SplitHandle: React.FC<SplitHandleProps> = ({
  index,
  direction,
  weightA,
  weightB,
  containerSize,
  onAdjustWeights,
  onCommitChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<number>(0);
  const [initialWeights, setInitialWeights] = useState<{ a: number; b: number }>({ a: 1, b: 1 });

  const isHorizontal = direction === 'horizontal';

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const pos = isHorizontal ? e.clientX : e.clientY;
    setStartPos(pos);
    setInitialWeights({ a: weightA, b: weightB });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const currentPos = isHorizontal ? e.clientX : e.clientY;
    const deltaPixels = currentPos - startPos;

    // Convert pixel delta into weight delta
    const combinedWeight = initialWeights.a + initialWeights.b;
    // fraction of container size
    const fractionDelta = deltaPixels / Math.max(100, containerSize);
    const weightDelta = fractionDelta * combinedWeight;

    // Constrain so each partition retains at least 15% of the combined weight
    const minWeight = combinedWeight * 0.15;
    const maxWeight = combinedWeight * 0.85;

    let newA = initialWeights.a + weightDelta;
    let newB = initialWeights.b - weightDelta;

    if (newA < minWeight) {
      newA = minWeight;
      newB = combinedWeight - minWeight;
    } else if (newA > maxWeight) {
      newA = maxWeight;
      newB = combinedWeight - maxWeight;
    }

    onAdjustWeights(index, index + 1, Number(newA.toFixed(3)), Number(newB.toFixed(3)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      if (onCommitChange) {
        onCommitChange();
      }
    }
  };

  // Compute display percentage
  const totalCombined = weightA + weightB;
  const pctA = Math.round((weightA / totalCombined) * 100);
  const pctB = 100 - pctA;

  return (
    <div
      className={`absolute z-30 select-none touch-none group flex items-center justify-center ${
        isHorizontal
          ? 'top-0 bottom-0 w-8 -translate-x-1/2 cursor-col-resize'
          : 'left-0 right-0 h-8 -translate-y-1/2 cursor-row-resize'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      title="拖拽短条调整两张图片显示占比"
    >
      {/* Hairline seam */}
      <div
        className={`pointer-events-none transition-colors duration-150 ${
          isHorizontal
            ? 'w-[1.5px] h-full bg-white/60 group-hover:bg-[#8D9B8E]'
            : 'h-[1.5px] w-full bg-white/60 group-hover:bg-[#8D9B8E]'
        } ${isDragging ? 'bg-[#8D9B8E] shadow-sm' : ''}`}
      />

      {/* The Draggable Short Handle (可拖动短条) */}
      <div
        className={`absolute rounded-full shadow-md transition-all duration-150 flex items-center justify-center ${
          isHorizontal ? 'w-2.5 h-12 my-auto' : 'h-2.5 w-12 mx-auto'
        } ${
          isDragging
            ? 'bg-[#8D9B8E] scale-110 shadow-lg ring-4 ring-[#8D9B8E]/25'
            : 'bg-white/95 group-hover:bg-white group-hover:scale-105 border border-[#D5CDC2]/80'
        }`}
      >
        {/* Subtle dot indicators on the short bar */}
        <div
          className={`flex gap-0.5 items-center justify-center ${
            isHorizontal ? 'flex-col' : 'flex-row'
          }`}
        >
          <span className={`w-1 h-1 rounded-full ${isDragging ? 'bg-white' : 'bg-[#9C9488]'}`} />
          <span className={`w-1 h-1 rounded-full ${isDragging ? 'bg-white' : 'bg-[#9C9488]'}`} />
          <span className={`w-1 h-1 rounded-full ${isDragging ? 'bg-white' : 'bg-[#9C9488]'}`} />
        </div>
      </div>

      {/* Real-time Percentage Tooltip while Dragging */}
      {isDragging && (
        <div
          className={`absolute pointer-events-none px-2.5 py-1 rounded-full bg-[#33322E]/90 text-white text-[11px] font-medium tracking-tight shadow-xl backdrop-blur-sm whitespace-nowrap animate-in fade-in duration-100 ${
            isHorizontal ? '-top-8' : '-left-14'
          }`}
        >
          {pctA}% · {pctB}%
        </div>
      )}
    </div>
  );
};
