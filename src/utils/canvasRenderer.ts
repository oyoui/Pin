import {
  ImageItem,
  StitchDirection,
  CanvasLayer,
  ShapeLayer,
  StickerLayer,
  ExportSettings,
} from '../types';
import { drawImageWithStroke } from './stickerStroke';

// Helper to load image element asynchronously
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.warn('Failed to load image source:', src.slice(0, 60), err);
      reject(err);
    };
    img.src = src;
  });
}

function drawShapePath(ctx: CanvasRenderingContext2D, shape: ShapeLayer, w: number, h: number) {
  ctx.beginPath();
  switch (shape.shapeType) {
    case 'rect':
      ctx.rect(0, 0, w, h);
      break;

    case 'rounded-rect': {
      const radius = Math.min(w, h) * 0.25;
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, w, h, radius);
      } else {
        ctx.rect(0, 0, w, h);
      }
      break;
    }

    case 'circle': {
      const rx = w / 2;
      const ry = h / 2;
      ctx.ellipse(rx, ry, rx, ry, 0, 0, Math.PI * 2);
      break;
    }

    case 'triangle': {
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      break;
    }

    case 'star': {
      const cx = w / 2;
      const cy = h / 2;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * 0.42;
      const points = 5;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }

    case 'heart': {
      const topCurveHeight = h * 0.3;
      ctx.moveTo(w / 2, topCurveHeight);
      ctx.bezierCurveTo(w / 2, 0, 0, 0, 0, topCurveHeight);
      ctx.bezierCurveTo(0, (h + topCurveHeight) / 2, w / 2, (h + topCurveHeight) / 2, w / 2, h);
      ctx.bezierCurveTo(w / 2, (h + topCurveHeight) / 2, w, (h + topCurveHeight) / 2, w, topCurveHeight);
      ctx.bezierCurveTo(w, 0, w / 2, 0, w / 2, topCurveHeight);
      ctx.closePath();
      break;
    }

    case 'line': {
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      break;
    }
  }
}

export interface StitchedLayout {
  totalWidth: number;
  totalHeight: number;
  aspectRatio: number;
  segments: {
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    fraction: number;
  }[];
}

/**
 * Calculates exact canvas dimensions and segment positions
 * by directly adding the images' natural / cropped sizes together (no preset plate!).
 */
export function getStitchedCanvasDimensions(
  images: ImageItem[],
  direction: StitchDirection,
  baseReference = 1200
): StitchedLayout {
  if (images.length === 0) {
    return {
      totalWidth: baseReference,
      totalHeight: baseReference,
      aspectRatio: 1,
      segments: [],
    };
  }

  if (direction === 'horizontal') {
    // Shared common height H
    const H = baseReference;
    // Each image's width is directly proportional to its actual aspect ratio * weight
    const rawWidths = images.map((img) => {
      const nw = img.naturalWidth || 800;
      const nh = img.naturalHeight || 800;
      const aspect = nw / nh;
      const weight = img.weight || 1;
      return H * aspect * weight;
    });

    const totalWidth = rawWidths.reduce((sum, w) => sum + w, 0);
    let currentX = 0;
    const segments = rawWidths.map((w, idx) => {
      const seg = {
        index: idx,
        x: currentX,
        y: 0,
        width: w,
        height: H,
        fraction: w / totalWidth,
      };
      currentX += w;
      return seg;
    });

    return {
      totalWidth: Math.round(totalWidth),
      totalHeight: H,
      aspectRatio: totalWidth / H,
      segments,
    };
  } else {
    // Shared common width W
    const W = baseReference;
    // Each image's height is directly proportional to its actual inverse aspect ratio * weight
    const rawHeights = images.map((img) => {
      const nw = img.naturalWidth || 800;
      const nh = img.naturalHeight || 800;
      const invAspect = nh / nw;
      const weight = img.weight || 1;
      return W * invAspect * weight;
    });

    const totalHeight = rawHeights.reduce((sum, h) => sum + h, 0);
    let currentY = 0;
    const segments = rawHeights.map((h, idx) => {
      const seg = {
        index: idx,
        x: 0,
        y: currentY,
        width: W,
        height: h,
        fraction: h / totalHeight,
      };
      currentY += h;
      return seg;
    });

    return {
      totalWidth: W,
      totalHeight: Math.round(totalHeight),
      aspectRatio: W / totalHeight,
      segments,
    };
  }
}

/**
 * Main export function to render full composition to canvas at 1x or 2x
 */
export async function renderFullCompositionToCanvas(
  images: ImageItem[],
  direction: StitchDirection,
  borderRadius: number,
  layers: CanvasLayer[],
  exportSettings: ExportSettings
): Promise<HTMLCanvasElement> {
  const scale = exportSettings.scale;
  
  // Calculate natural dimensions directly added together
  const baseReference = scale === 2 ? 2000 : 1000;
  const layout = getStitchedCanvasDimensions(images, direction, baseReference);

  const canvasWidth = layout.totalWidth;
  const canvasHeight = layout.totalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Clip Canvas with overall Border Radius if > 0
  const scaledRadius = borderRadius * (canvasWidth / 500);
  ctx.save();
  if (scaledRadius > 0) {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(0, 0, canvasWidth, canvasHeight, scaledRadius);
    } else {
      ctx.rect(0, 0, canvasWidth, canvasHeight);
    }
    ctx.clip();
  }

  // 2. Render Stitched Base Images (directly added with exact natural proportions)
  for (let i = 0; i < layout.segments.length; i++) {
    const seg = layout.segments[i];
    const item = images[i];

    try {
      const imgElement = await loadImage(item.displayUrl || item.originalUrl);
      ctx.save();
      ctx.beginPath();
      ctx.rect(seg.x, seg.y, seg.width, seg.height);
      ctx.clip();

      // Render image directly into its naturally proportioned space
      ctx.drawImage(imgElement, seg.x, seg.y, seg.width, seg.height);
      ctx.restore();
    } catch (e) {
      console.error('Error drawing image block:', e);
      ctx.fillStyle = '#E6DDD4';
      ctx.fillRect(seg.x, seg.y, seg.width, seg.height);
    }
  }

  // Restore clip of base images
  ctx.restore();

  // 3. Render Floating Overlay Layers (Shapes & Stickers sorted by zIndex)
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sortedLayers) {
    ctx.save();
    ctx.globalAlpha = layer.opacity;

    // Convert percentage coordinates relative to canvas dimensions
    const lx = (layer.x / 100) * canvasWidth;
    const ly = (layer.y / 100) * canvasHeight;
    const lw = (layer.width / 100) * canvasWidth;
    const lh = (layer.height / 100) * canvasHeight;

    const centerX = lx + lw / 2;
    const centerY = ly + lh / 2;

    ctx.translate(centerX, centerY);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }
    ctx.translate(-lw / 2, -lh / 2);

    if (layer.type === 'shape') {
      const shape = layer as ShapeLayer;
      drawShapePath(ctx, shape, lw, lh);

      if (shape.fillEnabled && shape.shapeType !== 'line') {
        ctx.fillStyle = shape.fillColor;
        ctx.fill();
      }

      if (shape.strokeEnabled && shape.strokeWidth > 0) {
        ctx.strokeStyle = shape.strokeColor;
        ctx.lineWidth = shape.strokeWidth * (canvasWidth / 600);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    } else if (layer.type === 'sticker') {
      const sticker = layer as StickerLayer;
      try {
        const stickerImg = await loadImage(sticker.imageUrl);

        if (sticker.shadowEnabled && (sticker.shadowBlur || 0) > 0) {
          ctx.shadowColor = sticker.shadowColor || 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = (sticker.shadowBlur || 8) * (canvasWidth / 600);
          ctx.shadowOffsetX = (sticker.shadowOffsetX ?? 0) * (canvasWidth / 600);
          ctx.shadowOffsetY = (sticker.shadowOffsetY ?? 4) * (canvasWidth / 600);
        }

        drawImageWithStroke(
          ctx,
          stickerImg,
          0,
          0,
          lw,
          lh,
          (sticker.strokeWidth || 0) * (canvasWidth / 600),
          sticker.strokeColor,
          sticker.isFlippedX
        );

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      } catch (err) {
        console.error('Failed to draw sticker:', err);
      }
    }

    ctx.restore();
  }

  return canvas;
}
