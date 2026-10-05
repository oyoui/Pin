import { StickerLibraryItem } from '../types';

export const MORANDI_COLORS = [
  // Sage & Olive
  { name: '冷苔绿', hex: '#8D9B8E' },
  { name: '灰松石', hex: '#798C82' },
  { name: '薄雾鼠尾草', hex: '#A7B5A9' },
  // Warm Clay & Terracotta
  { name: '暮霭陶土', hex: '#C89F91' },
  { name: '干枯玫瑰', hex: '#B88B86' },
  { name: '赤陶肉粉', hex: '#D6ABA0' },
  // Oat & Sand
  { name: '燕麦暖沙', hex: '#D8CBBF' },
  { name: '浅焙杏仁', hex: '#E6DDD4' },
  { name: '灰石原麻', hex: '#BDB3A7' },
  // Slate & Mist Blue
  { name: '水洗灰蓝', hex: '#8E9DA8' },
  { name: '晨雾石青', hex: '#A3B0B9' },
  { name: '烟雨苍霁', hex: '#6F808C' },
  // Warm Muted Neutrals
  { name: '温润奶白', hex: '#F9F8F6' },
  { name: '纯净透白', hex: '#FFFFFF' },
  { name: '暖灰墨灰', hex: '#4A4844' },
  { name: '低碳玄黑', hex: '#262523' },
];

export const STROKE_COLORS = [
  { name: '白描纯净', hex: '#FFFFFF' },
  { name: '墨韵灰黑', hex: '#2B2B28' },
  { name: '暖茶棕', hex: '#7A6B5D' },
  { name: '苔青黛', hex: '#617265' },
  { name: '豆沙绯', hex: '#9E6B65' },
  { name: '空濛蓝', hex: '#586A77' },
  { name: '赤金暖黄', hex: '#B59C66' },
  { name: '奶昔米白', hex: '#EFECE6' },
];

export const SHADOW_COLORS = [
  { name: '柔和浅影', hex: 'rgba(0, 0, 0, 0.18)' },
  { name: '中度光影', hex: 'rgba(0, 0, 0, 0.35)' },
  { name: '浓黑深影', hex: 'rgba(0, 0, 0, 0.60)' },
  { name: '陶土暖影', hex: 'rgba(122, 107, 93, 0.40)' },
  { name: '苔黛冷影', hex: 'rgba(97, 114, 101, 0.40)' },
  { name: '纯净白光', hex: 'rgba(255, 255, 255, 0.70)' },
];

// Helper to create clean standard SVG data URL
function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
}

// Preset stickers removed as requested by user
export const CURATED_STICKERS: StickerLibraryItem[] = [];

// Aesthetic preset starter photos
export const DEFAULT_SAMPLE_IMAGES = [
  {
    id: 'img-preset-1',
    originalUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
        <defs>
          <linearGradient id="bg1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#DDD5CA"/>
            <stop offset="50%" stop-color="#C5BAAC"/>
            <stop offset="100%" stop-color="#AFA394"/>
          </linearGradient>
          <linearGradient id="vase1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6F7E73"/>
            <stop offset="60%" stop-color="#88988C"/>
            <stop offset="100%" stop-color="#5B685F"/>
          </linearGradient>
          <radialGradient id="sun" cx="70%" cy="30%" r="50%">
            <stop offset="0%" stop-color="#F2ECE4" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#C5BAAC" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="800" height="1000" fill="url(#bg1)"/>
        <rect width="800" height="1000" fill="url(#sun)"/>
        
        <polygon points="0,780 800,760 800,1000 0,1000" fill="#8F8273"/>
        <line x1="0" y1="780" x2="800" y2="760" stroke="#776A5C" stroke-width="2"/>
        <ellipse cx="440" cy="790" rx="140" ry="26" fill="#695D51" opacity="0.45"/>

        <path d="M370 540 C370 510, 430 510, 430 540 C430 590, 480 640, 470 760 C465 790, 335 790, 330 760 C320 640, 370 590, 370 540 Z" fill="url(#vase1)"/>
        
        <path d="M400 520 Q400 340 330 180" stroke="#4A564D" stroke-width="6" fill="none" stroke-linecap="round"/>
        <ellipse cx="320" cy="180" rx="35" ry="20" transform="rotate(-25 320 180)" fill="#78887C"/>
        <ellipse cx="340" cy="250" rx="40" ry="22" transform="rotate(30 340 250)" fill="#8A9B8F"/>
        <ellipse cx="360" cy="320" rx="42" ry="24" transform="rotate(-15 360 320)" fill="#6D7D72"/>
        <ellipse cx="380" cy="400" rx="45" ry="25" transform="rotate(20 380 400)" fill="#7D8F83"/>

        <path d="M405 520 Q410 320 480 210" stroke="#4A564D" stroke-width="5" fill="none" stroke-linecap="round"/>
        <ellipse cx="485" cy="210" rx="32" ry="18" transform="rotate(25 485 210)" fill="#8A9B8F"/>
        <ellipse cx="455" cy="280" rx="38" ry="20" transform="rotate(-20 455 280)" fill="#78887C"/>
        <ellipse cx="435" cy="370" rx="40" ry="22" transform="rotate(15 435 370)" fill="#93A497"/>

        <text x="70" y="110" font-family="'Plus Jakarta Sans', sans-serif" font-size="28" font-weight="600" fill="#6B6053" letter-spacing="4">MORANDI STILL</text>
        <text x="70" y="145" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="400" fill="#887C6F" letter-spacing="2">01 · HARMONY</text>
      </svg>
    `),
    displayUrl: '',
    naturalWidth: 800,
    naturalHeight: 1000,
    weight: 1,
  },
  {
    id: 'img-preset-2',
    originalUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
        <defs>
          <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E4DCD3"/>
            <stop offset="50%" stop-color="#D6C6B6"/>
            <stop offset="100%" stop-color="#C2AE9B"/>
          </linearGradient>
          <linearGradient id="arch" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#A59482"/>
            <stop offset="100%" stop-color="#807060"/>
          </linearGradient>
        </defs>
        <rect width="800" height="1000" fill="url(#bg2)"/>
        
        <path d="M220 880 L220 460 C220 330, 580 330, 580 460 L580 880 Z" fill="url(#arch)" opacity="0.85"/>
        <path d="M260 880 L260 480 C260 380, 540 380, 540 480 L540 880 Z" fill="#ECE5DC"/>

        <circle cx="400" cy="560" r="90" fill="#C89F91"/>
        <ellipse cx="400" cy="650" rx="95" ry="14" fill="#807060" opacity="0.3"/>

        <polygon points="340,320 460,320 400,220" fill="#798C82" opacity="0.8"/>
        <rect x="0" y="880" width="800" height="120" fill="#6A5C4F"/>

        <text x="70" y="110" font-family="'Plus Jakarta Sans', sans-serif" font-size="28" font-weight="600" fill="#6B6053" letter-spacing="4">ARCHITECTURAL</text>
        <text x="70" y="145" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="400" fill="#887C6F" letter-spacing="2">02 · TEXTURE</text>
      </svg>
    `),
    displayUrl: '',
    naturalWidth: 800,
    naturalHeight: 1000,
    weight: 1,
  },
];

DEFAULT_SAMPLE_IMAGES[0].displayUrl = DEFAULT_SAMPLE_IMAGES[0].originalUrl;
DEFAULT_SAMPLE_IMAGES[1].displayUrl = DEFAULT_SAMPLE_IMAGES[1].originalUrl;
