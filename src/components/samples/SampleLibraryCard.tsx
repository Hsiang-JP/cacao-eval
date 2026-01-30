import React, { useState } from 'react';
import { StoredSample } from '../../services/dbService';
import { Calendar, User, ChevronDown, ChevronUp, CheckSquare, Square, Trash2 } from 'lucide-react';
import IndividualBarChart from './IndividualBarChart';
import { getAttributeColor } from '../../utils/colors';

import { useLanguage } from '../../context/LanguageContext';

interface SampleLibraryCardProps {
    sample: StoredSample;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onDelete?: (id: string, code: string) => void;
}

const SampleLibraryCard: React.FC<SampleLibraryCardProps> = ({
    sample,
    isSelected,
    onToggleSelect,
    onDelete
}) => {
    const { language, t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);

    // Format date nicely
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        // If YYYY-MM-DD, convert to DD/MM/YYYY
        if (dateStr.includes('-')) {
            const [y, m, d] = dateStr.split('-');
            if (y.length === 4) {
                return `${d}/${m}/${y}`;
            }
        }
        return dateStr;
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-cacao-100 hover:shadow-md transition-shadow relative group/card">

            {/* Header: Checkbox, Code, Type, Score */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3">
                    <button
                        onClick={() => onToggleSelect(sample.id)}
                        className="mt-1 text-gray-400 hover:text-cacao-600 transition-colors"
                    >
                        {isSelected ? (
                            <CheckSquare size={24} className="text-cacao-600" />
                        ) : (
                            <Square size={24} />
                        )}
                    </button>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="font-bold text-2xl text-cacao-900 leading-tight">{sample.sampleCode}</h3>
                            <span className="text-gray-500 text-sm font-medium">
                                {sample.evaluationType === 'cacao_mass'
                                    ? (language === 'es' ? 'Masa de Cacao' : 'Cacao Mass')
                                    : (language === 'es' ? 'Chocolate' : 'Chocolate')}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{formatDate(sample.date)}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <User size={14} />
                                <span>{sample.evaluator}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {/* Delete Button - Only visible on hover or if mobile */}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(sample.id, sample.sampleCode);
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                            title={t.delete || "Delete"}
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                    <div className="flex flex-col items-end">
                        <span className="text-3xl font-mono font-bold text-cacao-800 leading-none">{sample.globalQuality}</span>
                        <span className="text-[10px] uppercase text-gray-400 font-bold mt-1">Score</span>
                    </div>
                </div>
            </div>

            {/* Chart Section (Preview) */}
            <div className="mb-2 border border-pink-200 rounded-lg p-2 bg-white" style={{ minHeight: '150px' }}>
                <IndividualBarChart
                    sample={sample}
                    orientation="vertical"
                    height={150}
                />
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left py-2 text-cacao-700 font-bold text-lg hover:text-cacao-900 flex items-center justify-between group"
            >
                <span>{t.viewDetails || "View Details"}</span>
                {/* Optional Chevron if desired, implies action */}
                {/* <ChevronDown size={20} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} /> */}
            </button>

            {/* Expanded Details: Attribute Grid */}
            {isExpanded && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4 animate-in slide-in-from-top-2 duration-200">
                    {sample.attributes
                        .filter(attr => attr.score > 0) // Hide zero score attributes
                        .map(attr => (
                            <div key={attr.id} className="flex flex-col gap-1">
                                {/* Main Attribute */}
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: getAttributeColor(attr.id) }}
                                    />
                                    <span className="text-gray-800 text-sm flex-1 truncate font-bold">
                                        {language === 'es' ? attr.nameEs : attr.nameEn}:
                                    </span>
                                    <span className="font-bold text-gray-900 mono">
                                        {attr.score}
                                    </span>
                                </div>

                                {/* Sub-attributes */}
                                {attr.subAttributes && attr.subAttributes.length > 0 && (
                                    <div className="ml-6 space-y-1">
                                        {attr.subAttributes
                                            .filter(sub => sub.score > 0) // Hide zero score sub-attributes
                                            .map(sub => (
                                                <div key={sub.id} className="flex justify-between items-center text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                                                    <span>{language === 'es' ? sub.nameEs : sub.nameEn}</span>
                                                    <span className="font-mono font-medium">{sub.score}</span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default SampleLibraryCard;
