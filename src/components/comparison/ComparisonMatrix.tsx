import React, { useState } from 'react';
import { StoredSample } from '../../services/dbService';
import { getAttributeColor, hexToRgba } from '../../utils/colors';
import { Calendar, User, Info, FileText } from 'lucide-react';

interface ComparisonMatrixProps {
    samples: StoredSample[];
    language: 'en' | 'es';
}

const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({ samples, language }) => {
    // We assume all samples have the same attributes structure.
    // Use the first sample to get the list of attributes.
    if (samples.length === 0) return null;

    const attributes = samples[0].attributes;

    // Helper to format date
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}`; // Compact date
    };

    return (
        <div className="overflow-x-auto pb-6">
            <table className="w-full border-collapse min-w-[600px]">
                <thead>
                    <tr>
                        {/* Empty top-left corner */}
                        <th className="p-2 border-b-2 border-r border-gray-100 bg-white sticky left-0 z-20 min-w-[150px] text-left">
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                {language === 'es' ? 'Atributos' : 'Attributes'}
                            </span>
                        </th>

                        {/* Sample Columns */}
                        {samples.map(sample => (
                            <th key={sample.id} className="p-0 border-b-2 border-gray-100 bg-white min-w-[100px] relative group">
                                <div className="p-3 hover:bg-cacao-50 transition-colors cursor-help h-full flex flex-col items-center justify-end">
                                    <div className="text-lg font-bold text-cacao-900 leading-tight mb-1">{sample.sampleCode}</div>
                                    <div className="text-xs text-gray-500 font-normal">{formatDate(sample.date)}</div>
                                </div>

                                {/* Hover Card (Popover) */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left overflow-hidden">
                                    <div className="bg-cacao-50 p-3 border-b border-gray-100">
                                        <h4 className="font-bold text-cacao-900 text-lg">{sample.sampleCode}</h4>
                                        <span className="text-xs text-cacao-600 uppercase font-bold tracking-wide">
                                            {sample.evaluationType === 'cacao_mass'
                                                ? (language === 'es' ? 'Masa de Cacao' : 'Cacao Mass')
                                                : (language === 'es' ? 'Chocolate' : 'Chocolate')}
                                        </span>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar size={16} className="text-cacao-500" />
                                            <span>{sample.date} {sample.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <User size={16} className="text-cacao-500" />
                                            <span>{sample.evaluator}</span>
                                        </div>
                                        {sample.sampleInfo && (
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <Info size={16} className="text-cacao-500 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{sample.sampleInfo}</span>
                                            </div>
                                        )}
                                        {sample.notes && (
                                            <div className="flex items-start gap-2 text-sm text-gray-600 border-t border-gray-50 pt-2">
                                                <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                <span className="italic text-gray-500 line-clamp-3 text-xs">{sample.notes}</span>
                                            </div>
                                        )}
                                        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-500 uppercase">Global Score</span>
                                            <span className="text-xl font-mono font-bold text-cacao-800">{sample.globalQuality}</span>
                                        </div>
                                    </div>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* Attribute Rows */}
                    {attributes.map(attr => (
                        <tr key={attr.id} className="hover:bg-gray-50 transition-colors">
                            {/* Row Header: Attribute Name */}
                            <td className="p-3 border-b border-r border-gray-100 bg-white sticky left-0 z-10 font-medium text-gray-700 text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: getAttributeColor(attr.id) }}
                                    />
                                    <span className="truncate max-w-[120px]" title={language === 'es' ? attr.nameEs : attr.nameEn}>
                                        {language === 'es' ? attr.nameEs : attr.nameEn}
                                    </span>
                                </div>
                            </td>

                            {/* Data Cells */}
                            {samples.map(sample => {
                                // Find the matching attribute in this sample (by ID)
                                const sampleAttr = sample.attributes.find(a => a.id === attr.id) || attr;
                                const score = sampleAttr.score;
                                const color = getAttributeColor(attr.id);

                                // Visual logic:
                                // Background opacity based on score (0-10)
                                // Text contrast: White if darker, dark if lighter
                                // Minimum opacity of 0.1 for visibility if score > 0
                                const opacity = score === 0 ? 0.05 : 0.1 + (score / 10) * 0.9;
                                const bgStyle = {
                                    backgroundColor: hexToRgba(color, opacity),
                                    color: score > 4 ? '#fff' : 'rgba(0,0,0,0.7)' // Contrast text
                                };

                                return (
                                    <td key={sample.id} className="p-1 border-b border-gray-100 text-center relative group">
                                        <div
                                            className="w-full h-12 flex items-center justify-center rounded-md font-bold font-mono text-lg transition-transform transform group-hover:scale-105"
                                            style={bgStyle}
                                        >
                                            {score > 0 ? score : '-'}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}

                    {/* Global Quality Row */}
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td className="p-3 border-r border-gray-200 sticky left-0 z-10 font-bold text-gray-800 text-sm uppercase">
                            {language === 'es' ? 'Calidad Global' : 'Global Quality'}
                        </td>
                        {samples.map(sample => (
                            <td key={sample.id} className="p-3 text-center border-b border-gray-100">
                                <span className="font-mono font-bold text-xl text-cacao-900 bg-white px-2 py-1 rounded shadow-sm border border-gray-200 block">
                                    {sample.globalQuality}
                                </span>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ComparisonMatrix;
