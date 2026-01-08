import React from 'react';
import { Lock } from 'lucide-react';
import { SubAttribute } from '../types';
import { TRANSLATIONS } from '../constants';

interface ScoreSliderProps {
  id: string;
  label: string;
  value: number;
  subAttributes?: SubAttribute[];
  onChange: (val: number) => void;
  onSubAttributeChange: (subId: string, val: number) => void;
  onSubAttributeDescriptionChange?: (subId: string, desc: string) => void;
  colorClass?: string;
  customColor?: string; // New prop for hex codes
  language?: 'en' | 'es';
  isCalculated?: boolean;
  disabled?: boolean;
}

const ScoreSlider = React.memo<ScoreSliderProps>(({
  id,
  label,
  value,
  subAttributes,
  onChange,
  onSubAttributeChange,
  onSubAttributeDescriptionChange,
  colorClass = "accent-cacao-600",
  customColor,
  language = 'en',
  isCalculated = false,
  disabled = false
}) => {
  const hasSubAttributes = subAttributes && subAttributes.length > 0;
  const t = TRANSLATIONS[language];

  const getScoreColor = (score: number) => {
    if (score === 0) return 'text-gray-400';
    if (score < 3) return 'text-gray-500';
    if (score < 7) return 'text-cacao-600';
    return 'text-cacao-800 font-bold';
  };

  const activeSubAttributes = subAttributes?.filter(s => s.score > 0) || [];
  const selectedCount = activeSubAttributes.length;
  const uniqueId = `slider-${id}`;

  const sliderStyle = customColor ? { accentColor: customColor } : undefined;

  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-cacao-100 transition-all ${disabled ? 'opacity-80 pointer-events-none' : ''}`}>
      {/* Header Row */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
            {label}
            {isCalculated && (
              <span title={t.calculated} className="flex items-center">
                <Lock size={12} className="text-gray-400" />
              </span>
            )}
          </label>

          {/* Selected Badges */}
          {hasSubAttributes && selectedCount > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {activeSubAttributes.map(sub => (
                <span key={sub.id} className="text-[10px] font-bold bg-cacao-100 text-cacao-800 px-1.5 py-0.5 rounded uppercase">
                  {sub.name}: {sub.score}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className={`text-2xl font-mono ${getScoreColor(value)} min-w-[3rem] text-right`}>
          {isCalculated ? value.toFixed(1) : value}
        </span>
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3 mb-3">
        <input
          id={uniqueId}
          type="range"
          min="0"
          max="10"
          step={isCalculated ? "0.1" : "1"}
          value={value}
          onChange={(e) => !isCalculated && onChange(parseFloat(e.target.value))}
          disabled={isCalculated || disabled}
          style={sliderStyle}
          className={`w-full h-8 md:h-4 bg-gray-200 rounded-lg appearance-none touch-none ${!isCalculated && !disabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${!customColor ? colorClass : ''}`}
        />
      </div>

      {isCalculated && (
        <div className="text-[10px] text-gray-400 italic mb-2 text-right">
          {t.calculated}
        </div>
      )}

      {/* Sub-attributes / Flavor Wheel */}
      {hasSubAttributes && (
        <div className="mt-1">
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-cacao-50 rounded-lg border border-cacao-100">
            {subAttributes.map(sub => (
              <div key={sub.id} className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-gray-600 truncate pr-2">{sub.name}</label>
                  <span className={`text-xs font-mono w-6 text-right ${sub.score > 0 ? "text-cacao-800 font-bold" : "text-gray-400"}`}>
                    {sub.score}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={sub.score}
                  style={sliderStyle}
                  onChange={(e) => onSubAttributeChange(sub.id, parseFloat(e.target.value))}
                  disabled={disabled}
                  className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none ${!disabled ? 'cursor-pointer' : 'cursor-not-allowed'} ${customColor ? '' : 'accent-cacao-500'}`}
                />
                {sub.id === 'def_other' && (
                  <input
                    type="text"
                    value={sub.description || ''}
                    onChange={(e) => onSubAttributeDescriptionChange && onSubAttributeDescriptionChange(sub.id, e.target.value)}
                    placeholder={language === 'es' ? "Descripción..." : "Description..."}
                    disabled={disabled}
                    className="w-full mt-1 p-1.5 text-xs border border-cacao-200 rounded focus:border-cacao-500 outline-none disabled:bg-gray-100"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default ScoreSlider;