import React from 'react';

interface RadiusPanelProps {
  borderRadius: number;
  onChangeRadius: (val: number) => void;
}

export const RadiusPanel: React.FC<RadiusPanelProps> = ({ borderRadius, onChangeRadius }) => {
  const presets = [0, 8, 16, 24, 32, 44];

  return (
    <div className="flex flex-col gap-3.5 text-[#33322E] select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#5A554D]">圆角</h3>
        <span className="text-xs font-mono tabular-nums font-semibold text-[#8D9B8E]">
          {borderRadius}px
        </span>
      </div>

      {/* Slider */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-[#E8E2D8]">
        <span className="text-xs text-[#7A746B]">0</span>
        <input
          type="range"
          min="0"
          max="48"
          step="2"
          value={borderRadius}
          onChange={(e) => onChangeRadius(parseInt(e.target.value, 10))}
          className="flex-1 accent-[#8D9B8E] cursor-pointer"
        />
        <span className="text-xs text-[#7A746B]">48</span>
      </div>

      {/* Preset Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {presets.map((val) => (
          <button
            key={val}
            onClick={() => onChangeRadius(val)}
            className={`px-3 py-1 text-xs font-medium rounded-xl transition-all ${
              borderRadius === val
                ? 'bg-[#8D9B8E] text-white shadow-xs'
                : 'bg-white border border-[#DDD5CA] text-[#6A645B] hover:bg-[#F2EDE4]'
            }`}
          >
            {val === 0 ? '直角' : `${val}px`}
          </button>
        ))}
      </div>
    </div>
  );
};
