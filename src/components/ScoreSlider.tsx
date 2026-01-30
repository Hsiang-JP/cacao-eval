import React, { useState } from 'react';
import { Lock, ChevronDown, ChevronUp } from 'lucide-react';
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
  customColor?: string;
  language?: 'en' | 'es';
  isCalculated?: boolean;
  disabled?: boolean;
  defaultExpanded?: boolean; // Whether accordion starts expanded or collapsed
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
  disabled = false,
  defaultExpanded = false
}) => {
  // State for accordion - initialize with defaultExpanded prop
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

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

  // All attributes now use accordion mode
  return (
    <div id={id} className={`bg-white rounded-xl shadow-sm border border-cacao-100 transition-all overflow-hidden scroll-mt-48 ${disabled ? 'opacity-80 pointer-events-none' : ''}`}>
      {/* Accordion Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        aria-expanded={isExpanded}
        aria-controls={`${uniqueId}-content`}
        className="w-full p-4 flex justify-between items-center hover:bg-cacao-50 transition-colors active:bg-cacao-100 touch-manipulation min-h-[44px]"
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">{label}</span>
          {isCalculated && (
            <span title={t.calculated} className="flex items-center">
              <Lock size={12} className="text-gray-400" />
            </span>
          )}
          {hasSubAttributes && selectedCount > 0 && (
            <span className="text-[10px] font-bold bg-cacao-100 text-cacao-800 px-1.5 py-0.5 rounded">
              {selectedCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-mono ${getScoreColor(value)} min-w-[3rem] text-right`}>
            {isCalculated ? value.toFixed(1) : value}
          </span>
          {isExpanded ? (
            <ChevronUp size={20} className="text-gray-600 flex-shrink-0" />
          ) : (
            <ChevronDown size={20} className="text-gray-600 flex-shrink-0" />
          )}
        </div>
      </button>

      {/* Accordion Content - Collapsible */}
      <div
        id={`${uniqueId}-content`}
        className="transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? '2000px' : '0',
          opacity: isExpanded ? 1 : 0
        }}
      >
        <div className="px-4 pb-4 space-y-3">
          {/* Main Slider */}
          <div className="flex items-center gap-3">
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
              className={`w-full h-8 md:h-4 bg-gray-200 rounded-lg appearance-none touch-pan-y ${!isCalculated && !disabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${!customColor ? colorClass : ''}`}
            />
          </div>

          {isCalculated && (
            <div className="text-[10px] text-gray-400 italic text-right">
              {t.calculated}
            </div>
          )}

          {/* Sub-attributes / Flavor Wheel */}
          {hasSubAttributes && (
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
                    className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none touch-pan-y ${!disabled ? 'cursor-pointer' : 'cursor-not-allowed'} ${customColor ? '' : 'accent-cacao-500'}`}
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
          )}
        </div>
      </div>
    </div>
  );
});

export default ScoreSlider;