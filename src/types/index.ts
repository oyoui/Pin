export type StitchDirection = 'horizontal' | 'vertical';

export interface CropData {
  x: number; // percentage or px
  y: number;
  width: number;
  height: number;
  zoom: number;
  rotate: number; // 0, 90, 180, 270
}

export interface ImageItem {
  id: string;
  originalUrl: string;
  displayUrl: string; // active cropped image dataUrl or originalUrl
  naturalWidth: number;
  naturalHeight: number;
  weight: number; // flex weight relative to siblings, e.g. 1
  cropData?: CropData;
}

export type ShapeType =
  | 'rect'
  | 'rounded-rect'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'line';

export interface BaseLayer {
  id: string;
  x: number; // percentage relative to canvas (0 - 100)
  y: number; // percentage relative to canvas (0 - 100)
  width: number; // percentage relative to canvas width
  height: number; // percentage relative to canvas height
  rotation: number; // in degrees
  opacity: number; // 0 - 1
  zIndex: number;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: ShapeType;
  fillEnabled: boolean;
  fillColor: string;
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number; // in px
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker';
  imageUrl: string;
  strokeWidth: number; // 0 means no stroke
  strokeColor: string;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  isFlippedX?: boolean;
}

export type CanvasLayer = ShapeLayer | StickerLayer;

export interface StickerLibraryItem {
  id: string;
  name: string;
  url: string;
  isCustom: boolean;
  createdAt: number;
}

export type ExportScale = 1 | 2;
export type ExportFormat = 'png' | 'jpeg';

export interface ExportSettings {
  scale: ExportScale;
  format: ExportFormat;
  quality: number;
}
