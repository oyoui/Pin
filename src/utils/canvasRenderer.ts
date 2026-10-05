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
    // Only set crossOrigin for remote http/https URLs. Never for data: or blob: URLs
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

/**
 * Draws an arbitrary shape path in a local coordinate system of [0, 0, w, h]
 */
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
      // Beautiful smooth parametric heart fitting in [0, 0, w, h]
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

/**
 * Calculates canvas base dimensions based on stitched images,
 * stitch direction, and their relative weights.
 */
export function calculateCanvasSize(
  images: ImageItem[],
  direction: StitchDirection,
  baseTargetSize = 1200
): { width: number; height: number } {
  if (images.length === 0) {
    return { width: baseTargetSize, height: baseTargetSize };
  }

  // Find standard aspect ratio of each item
  const totalWeight = images.reduce((acc, img) => acc + (img.weight || 1), 0);

  if (direction === 'horizontal') {
    // Height is normalized, width is proportional to weight
    const targetHeight = baseTargetSize;
    // Base width approximation
    const totalRatio = images.reduce((acc, img) => {
      const naturalAspect = (img.naturalWidth || 800) / (img.naturalHeight || 800);
      return acc + naturalAspect * (img.weight || 1);
    }, 0);
    const avgRatio = totalRatio / totalWeight;
    const targetWidth = Math.round(targetHeight * (avgRatio * images.length));
    return {
      width: Math.max(600, Math.min(2400, targetWidth)),
      height: targetHeight,
    };
  } else {
    // Vertical: Width is normalized, height depends on weight
    const targetWidth = baseTargetSize;
    const totalRatio = images.reduce((acc, img) => {
      const naturalAspect = (img.naturalHeight || 800) / (img.naturalWidth || 800);
      return acc + naturalAspect * (img.weight || 1);
    }, 0);
    const avgRatio = totalRatio / totalWeight;
    const targetHeight = Math.round(targetWidth * (avgRatio * images.length));
    return {
      width: targetWidth,
      height: Math.max(600, Math.min(2400, targetHeight)),
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
  exportSettings: ExportSettings,
  previewDimensions?: { width: number; height: number }
): Promise<HTMLCanvasElement> {
  const scale = exportSettings.scale;
  
  // Use preview dimension or calculate
  const baseDim = previewDimensions || calculateCanvasSize(images, direction, 1200);
  const canvasWidth = Math.round(baseDim.width * scale);
  const canvasHeight = Math.round(baseDim.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Clip Canvas with overall Border Radius if > 0
  const scaledRadius = borderRadius * scale;
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

  // 2. Render Stitched Base Images (0 gap)
  const totalWeight = images.reduce((sum, img) => sum + (img.weight || 1), 0);
  let accumulatedOffset = 0;

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    const weight = item.weight || 1;
    const proportion = weight / totalWeight;

    let partX = 0;
    let partY = 0;
    let partW = canvasWidth;
    let partH = canvasHeight;

    if (direction === 'horizontal') {
      partW = i === images.length - 1 ? canvasWidth - accumulatedOffset : Math.round(canvasWidth * proportion);
      partX = accumulatedOffset;
      partY = 0;
      partH = canvasHeight;
      accumulatedOffset += partW;
    } else {
      partH = i === images.length - 1 ? canvasHeight - accumulatedOffset : Math.round(canvasHeight * proportion);
      partX = 0;
      partY = accumulatedOffset;
      partW = canvasWidth;
      accumulatedOffset += partH;
    }

    try {
      const imgElement = await loadImage(item.displayUrl || item.originalUrl);
      ctx.save();
      // Clip to this block
      ctx.beginPath();
      ctx.rect(partX, partY, partW, partH);
      ctx.clip();

      // Draw image object-fit: cover inside [partX, partY, partW, partH]
      const imgAspect = imgElement.naturalWidth / imgElement.naturalHeight;
      const partAspect = partW / partH;

      let drawW = partW;
      let drawH = partH;
      let drawX = partX;
      let drawY = partY;

      if (imgAspect > partAspect) {
        // Image is wider than part -> crop sides
        drawH = partH;
        drawW = partH * imgAspect;
        drawX = partX + (partW - drawW) / 2;
        drawY = partY;
      } else {
        // Image is taller than part -> crop top/bottom
        drawW = partW;
        drawH = partW / imgAspect;
        drawX = partX;
        drawY = partY + (partH - drawH) / 2;
      }

      ctx.drawImage(imgElement, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch (e) {
      console.error('Error drawing image block:', e);
      // Fallback placeholder fill
      ctx.fillStyle = '#E6DDD4';
      ctx.fillRect(partX, partY, partW, partH);
    }
  }

  // Restore clip of base images
  ctx.restore();

  // 3. Render Floating Overlay Layers (Shapes & Stickers sorted by zIndex)
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sortedLayers) {
    ctx.save();
    ctx.globalAlpha = layer.opacity;

    // Convert percentage coordinates back to canvas pixel coordinates
    const lx = (layer.x / 100) * canvasWidth;
    const ly = (layer.y / 100) * canvasWidth; // maintain aspect ratio scale
    const lw = (layer.width / 100) * canvasWidth;
    const lh = (layer.height / 100) * canvasWidth;

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
        ctx.lineWidth = shape.strokeWidth * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    } else if (layer.type === 'sticker') {
      const sticker = layer as StickerLayer;
      try {
        const stickerImg = await loadImage(sticker.imageUrl);

        if (sticker.shadowEnabled && sticker.shadowBlur > 0) {
          ctx.shadowColor = sticker.shadowColor || 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = sticker.shadowBlur * scale;
          ctx.shadowOffsetX = (sticker.shadowOffsetX ?? 0) * scale;
          ctx.shadowOffsetY = (sticker.shadowOffsetY ?? 4) * scale;
        }

        drawImageWithStroke(
          ctx,
          stickerImg,
          0,
          0,
          lw,
          lh,
          sticker.strokeWidth * scale,
          sticker.strokeColor,
          sticker.isFlippedX
        );
        // Clear shadow so it doesn't affect subsequent elements
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
