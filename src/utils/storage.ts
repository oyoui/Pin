import { StickerLibraryItem } from '../types';

const STORAGE_KEY = 'pin_app_custom_stickers_v2';

export function loadStickerLibrary(): StickerLibraryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load sticker library from storage:', e);
    return [];
  }
}

export function saveCustomSticker(item: StickerLibraryItem): StickerLibraryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const customList: StickerLibraryItem[] = raw ? JSON.parse(raw) : [];
    const updated = [item, ...customList.filter((s) => s.id !== item.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save sticker to localStorage:', e);
    return [];
  }
}

export function deleteCustomSticker(id: string): StickerLibraryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const customList: StickerLibraryItem[] = JSON.parse(raw);
    const updated = customList.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete sticker:', e);
    return [];
  }
}
