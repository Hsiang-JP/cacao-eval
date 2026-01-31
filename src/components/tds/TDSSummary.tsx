/**
 * TDSSummary Component
 * Displays advanced TDS analysis with zone breakdowns and aroma/aftertaste insights.
 */

import React, { useMemo, useState } from 'react';
import { RotateCcw, AlertTriangle, Sparkles, Wind } from 'lucide-react';
import { TDSProfile, TDSAnalysisResult, TDSScoreResult } from '../../types';
import { analyzeTDS, CORE_ATTRIBUTES, DEFECT_ATTRIBUTES } from '../../utils/tdsCalculator';
import { getAttributeColor } from '../../utils/colors';
import { useLanguage } from '../../context/LanguageContext';

import { ATTRIBUTE_LABELS } from '../../data/attributes';

interface TDSSummaryProps {
    profile: TDSProfile;
    onApply: (scores: Map<string, TDSScoreResult>, analysis: TDSAnalysisResult) => void;
    onDiscard: () => void;
    onSave: () => void;
}

const TDSSummary: React.FC<TDSSummaryProps> = ({ profile, onApply, onDiscard, onSave }) => {
    const { language } = useLanguage();
    const [selectedEventIdx, setSelectedEventIdx] = useState<number | null>(null);

    // Run complete TDS analysis
    const analysis = useMemo(() => analyzeTDS(profile), [profile]);


    // Check for warnings
    const hasFlaggedScores = useMemo(() => {
        return Array.from(analysis.scores.values()).some(s => s.isFlagged);
    }, [analysis.scores]);

    const hasDefects = useMemo(() => {
        return Array.from(analysis.scores.entries()).some(([id, s]) =>
            DEFECT_ATTRIBUTES.includes(id) && s.durationPercent > 0
        );
    }, [analysis.scores]);

    const handleApply = () => {
        // Merge scores for application
        const merged = new Map(analysis.scores);
        if (profile.mode === 'expert') {
            for (const [attrId, result] of analysis.coreScores) {
                merged.set(attrId, result);
            }
        }
        onApply(merged, analysis);
    };

    const formatTime = (seconds: number): string => `${Math.floor(seconds)}s`;

    // Sort scores by category and duration
    const sortedScores = useMemo(() => {
        const scores = profile.mode === 'expert' ? analysis.coreScores : analysis.scores;
        return Array.from(scores.entries()).sort(([aId, a], [bId, b]) => {
            const aIsCore = CORE_ATTRIBUTES.includes(aId);
            const bIsCore = CORE_ATTRIBUTES.includes(bId);
            if (aIsCore && !bIsCore) return -1;
            if (!aIsCore && bIsCore) return 1;
            return b.durationPercent - a.durationPercent;
        });
    }, [analysis, profile.mode]);

    // Complementary scores for Expert mode
    const complementaryScores = useMemo(() => {
        if (profile.mode !== 'expert') return [];
        return Array.from(analysis.scores.entries())
            .filter(([id, s]) => !CORE_ATTRIBUTES.includes(id) && !DEFECT_ATTRIBUTES.includes(id) && s.durationPercent > 0)
            .sort(([, a], [, b]) => b.durationPercent - a.durationPercent);
    }, [analysis.scores, profile.mode]);

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-cacao-600 to-cacao-700 px-6 py-4">
                <h3 className="text-white font-bold text-lg">
                    {language === 'es' ? 'Análisis TDS' : 'TDS Analysis'}
                    <span className="text-cacao-200 text-sm ml-2">
                        ({profile.mode === 'normal' ? 'Normal' : 'Expert'})
                    </span>
                </h3>
            </div>


            {/* Scientific Notice */}
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                <p className="text-xs text-blue-700">
                    {language === 'es'
                        ? 'Puntuaciones basadas en zonas: Inicio (0-20%), Media (20-100%), Final (post-gusto)'
                        : 'Scores based on zones: Attack (0-20%), Evolution (20-100%), Finish (aftertaste)'}
                </p>
                {/* Global Boost Notification */}
                {Array.from(analysis.scores.values()).some(s => s.boostDetails !== undefined) && (
                    <p className="text-xs text-indigo-700 mt-1 font-medium flex items-center gap-1">
                        <Sparkles size={12} />
                        {language === 'es'
                            ? 'Algunos puntajes tienen aumentos recomendados debido a una fuerte presencia en el post-gusto.'
                            : 'Some scores have recommended boosts due to strong aftertaste presence.'}
                    </p>
                )}
            </div>

            {/* Timeline Chart - Pure CSS Implementation */}
            {profile.events.length > 0 && (
                <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                        <h4 className="text-sm font-bold text-gray-600 uppercase">
                            {language === 'es' ? 'Línea de Tiempo' : 'Timeline'}
                        </h4>
                        <span className="text-xs text-gray-500">
                            {language === 'es' ? 'Duración' : 'Duration'}: {profile.totalDuration.toFixed(1)}s | {language === 'es' ? 'Tragado' : 'Swallow'}: {profile.swallowTime.toFixed(1)}s
                        </span>
                    </div>

                    {/* Timeline Bar Container */}
                    <div className="relative w-full mt-8 mb-8">
                        {/* Calculate key positions */}
                        {(() => {
                            const firstOnset = analysis.firstOnset || 0;
                            const attackEnd = firstOnset + (analysis.attackPhaseDuration || 0);
                            const swallow = profile.swallowTime;
                            const total = profile.totalDuration;

                            // Position percentages based on absolute time
                            const firstOnsetPos = (firstOnset / total) * 100;
                            const attackEndPos = (attackEnd / total) * 100;
                            const swallowPos = (swallow / total) * 100;

                            return (
                                <>
                                    {/* TOP ROW: Percentages */}
                                    <div className="absolute -top-4 left-2 right-0 text-xs text-gray-500 font-medium z-20 pointer-events-none">
                                        {/* 0% at first onset */}
                                        <span
                                            className="absolute text-gray-600"
                                            style={{ left: `${firstOnsetPos}%`, transform: 'translateX(-50%)' }}
                                        >
                                            0%
                                        </span>
                                        {/* 20% at attack end */}
                                        <span
                                            className="absolute text-gray-600"
                                            style={{ left: `${attackEndPos}%`, transform: 'translateX(-50%)' }}
                                        >
                                            20%
                                        </span>
                                        {/* 100% at swallow */}
                                        <span
                                            className="absolute text-gray-800 font-bold"
                                            style={{ left: `${swallowPos}%`, transform: 'translateX(-50%)' }}
                                        >
                                            100%
                                        </span>
                                    </div>

                                    {/* The Bar */}
                                    <div
                                        className="relative w-full h-14 sm:h-16 bg-gray-100 rounded-lg overflow-hidden"
                                        onClick={() => setSelectedEventIdx(null)}
                                    >
                                        {/* Stacked event segments */}
                                        <div className="absolute inset-0 flex">
                                            {profile.events.map((event, idx) => {
                                                const startPercent = (event.start / total) * 100;
                                                const widthPercent = ((event.end - event.start) / total) * 100;
                                                const isSelected = selectedEventIdx === idx;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`absolute h-full cursor-pointer ${isSelected ? 'opacity-100 z-20' : 'hover:opacity-80'}`}
                                                        style={{
                                                            left: `${startPercent}%`,
                                                            width: `${widthPercent}%`,
                                                            backgroundColor: getAttributeColor(event.attrId),
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedEventIdx(isSelected ? null : idx);
                                                        }}
                                                        aria-label={`${ATTRIBUTE_LABELS[event.attrId]?.[language] || event.attrId}: ${event.start.toFixed(1)}s - ${event.end.toFixed(1)}s`}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {/* Attack End marker line (dashed) */}
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 sm:w-1 z-10"
                                            style={{
                                                left: `${attackEndPos}%`,
                                                background: 'repeating-linear-gradient(to bottom, black 0, black 4px, transparent 4px, transparent 8px)'
                                            }}
                                        />

                                        {/* Swallow marker line (solid) */}
                                        <div
                                            className="absolute top-0 bottom-0 w-1 sm:w-1.5 z-10 bg-black"
                                            style={{ left: `${swallowPos}%` }}
                                        />
                                    </div>

                                    {/* BOTTOM ROW: Absolute Times */}
                                    <div className="absolute -bottom-0 left-2 right-0 text-xs text-gray-500 font-medium z-20 pointer-events-none">
                                        {/* First Onset time */}
                                        <span
                                            className="absolute text-gray-600"
                                            style={{ left: `${firstOnsetPos}%`, transform: 'translateX(-50%)' }}
                                        >
                                            {firstOnset.toFixed(1)}s
                                        </span>
                                        {/* Attack End time */}
                                        <span
                                            className="absolute text-gray-600"
                                            style={{ left: `${attackEndPos}%`, transform: 'translateX(-50%)' }}
                                        >
                                            {attackEnd.toFixed(1)}s
                                        </span>
                                        {/* Swallow time */}
                                        <span
                                            className="absolute text-gray-800 font-bold"
                                            style={{ left: `${swallowPos}%`, transform: 'translateX(-50%)' }}
                                        >
                                            {swallow.toFixed(1)}s
                                        </span>
                                        {/* End time */}
                                        <span className="absolute right-0 text-gray-600">
                                            {total.toFixed(1)}s
                                        </span>
                                    </div>
                                </>
                            );
                        })()}


                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 border-t-2 border-dashed border-gray-400"></span>
                            {language === 'es' ? 'Fin del ataque' : 'Attack End'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-1 bg-black"></span>
                            {language === 'es' ? 'Tragar' : 'Swallow'}
                        </span>
                        <span className="font-medium text-amber-700">
                            {language === 'es' ? 'Post-gusto' : 'Aftertaste'}: {(profile.totalDuration - profile.swallowTime).toFixed(1)}s
                        </span>
                    </div>

                    {/* Selected Event Detail - Pre-allocated space */}
                    <div className="h-10 flex items-center justify-center">
                        {selectedEventIdx !== null && profile.events[selectedEventIdx] ? (
                            <div className="px-3 py-1.5 bg-gray-100 rounded-lg flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: getAttributeColor(profile.events[selectedEventIdx].attrId) }}
                                    />
                                    <span className="font-medium text-gray-800 text-sm">
                                        {ATTRIBUTE_LABELS[profile.events[selectedEventIdx].attrId]?.[language] || profile.events[selectedEventIdx].attrId}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-600">
                                    {profile.events[selectedEventIdx].start.toFixed(1)}s – {profile.events[selectedEventIdx].end.toFixed(1)}s
                                    <span className="ml-1 text-gray-400">
                                        ({(profile.events[selectedEventIdx].end - profile.events[selectedEventIdx].start).toFixed(1)}s)
                                    </span>
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs text-gray-400">
                                {language === 'es' ? 'Toca un segmento para ver detalles' : 'Tap a segment to see details'}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Core Scores */}
            <div className="px-4 pb-2">
                <h4 className="text-sm font-bold text-gray-600 uppercase mb-2">
                    {language === 'es' ? 'Atributos Principales' : 'Core Attributes'}
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                    {sortedScores.filter(([id]) => CORE_ATTRIBUTES.includes(id)).map(([attrId, result]) => (
                        <div
                            key={attrId}
                            className={`flex flex-col rounded-lg px-3 py-2 ${result.isFlagged ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getAttributeColor(attrId) }} />
                                    <span className="text-sm text-gray-700 font-medium">{ATTRIBUTE_LABELS[attrId]?.[language] || attrId}</span>
                                    {result.isFlagged && (
                                        <span className="text-xs text-amber-600 bg-amber-100 px-1 rounded">!</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">{result.durationPercent}%</span>
                                    <span className={`font-bold w-6 text-right ${result.boostDetails ? 'text-indigo-700' : 'text-cacao-800'}`}>{result.score}</span>
                                </div>
                            </div>

                            {/* INLINE Visual feedback for Boosted Scores (Aftertaste) */}
                            {result.boostDetails && (
                                <div className="mt-1 ml-5 text-xs text-indigo-600 flex items-start gap-1">
                                    <div className="flex h-3 w-3 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold mt-0.5 flex-shrink-0">↑</div>
                                    <span>
                                        {language === 'es'
                                            ? `Recomendación: +${result.boostDetails.amount} (Presencia tras tragar: ${result.boostDetails.duration}s)`
                                            : `Recommendation: +${result.boostDetails.amount} (Lingering presence: ${result.boostDetails.duration}s)`}
                                    </span>
                                </div>
                            )}

                            {/* Special attribute rarity feedback (also inline for consistency) */}
                            {result.category === 'complementary' && result.score >= 6 && result.durationPercent < 30 && (
                                <div className="mt-1 ml-5 text-xs text-blue-600 flex items-center gap-1">
                                    <Sparkles size={10} />
                                    <span>
                                        {language === 'es' ? 'Bonificación por rareza' : 'Rarity Bonus'}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {
                profile.mode === 'expert' && complementaryScores.length > 0 && (
                    <div className="px-4 pb-4">
                        <h4 className="text-sm font-bold text-gray-600 uppercase mb-2">
                            {language === 'es' ? 'Complementarios' : 'Complementary'}
                        </h4>
                        <div className="grid grid-cols-2 gap-1.5">
                            {complementaryScores.map(([attrId, result]) => (
                                <div key={attrId} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getAttributeColor(attrId) }} />
                                        <span className="text-xs text-gray-600">{ATTRIBUTE_LABELS[attrId]?.[language] || attrId}</span>
                                    </div>
                                    <span className="font-bold text-sm text-cacao-700">{result.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }


            {/* Aroma & Aftertaste Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-y">
                {/* Aroma */}
                <div className="bg-white/70 rounded-lg p-3 backdrop-blur">
                    <div className="flex items-center gap-2 text-amber-700 mb-1">
                        <Wind size={16} />
                        <span className="text-xs font-bold uppercase">{language === 'es' ? 'Aroma' : 'Aroma'}</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-800">{analysis.aromaIntensity}/10</div>
                    {analysis.aromaNotes.length > 0 && (
                        <div className="text-xs text-amber-600 mt-1">
                            {analysis.aromaNotes.map(n => ATTRIBUTE_LABELS[n]?.[language] || n).join(', ')}
                        </div>
                    )}
                </div>

                {/* Aftertaste */}
                <div className="bg-white/70 rounded-lg p-3 backdrop-blur">
                    <div className="flex items-center gap-2 text-orange-700 mb-1">
                        <Sparkles size={16} />
                        <span className="text-xs font-bold uppercase">{language === 'es' ? 'Post-gusto' : 'Aftertaste'}</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-800">{analysis.aftertasteIntensity}/10</div>
                    <div className={`text-xs mt-1 ${analysis.aftertasteQuality === 'positive' ? 'text-green-600' :
                        analysis.aftertasteQuality === 'negative' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                        {language === 'es'
                            ? (analysis.aftertasteQuality === 'positive' ? 'Positivo' : analysis.aftertasteQuality === 'negative' ? 'Negativo' : 'Neutral')
                            : (analysis.aftertasteQuality === 'positive' ? 'Positive' : analysis.aftertasteQuality === 'negative' ? 'Negative' : 'Neutral')}
                    </div>
                </div>
            </div>

            {/* Recommendation System Insights */}
            {(analysis.kickSuggestions?.length > 0 || analysis.qualitySuggestions?.length > 0) && (
                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                    <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2 mb-2">
                        <Sparkles size={16} />
                        {language === 'es' ? 'Observaciones' : 'Insights'}
                    </h4>

                    <div className="space-y-3">
                        {/* Kick Suggestions */}
                        {analysis.kickSuggestions?.map((suggestion, idx) => (
                            <div key={`kick-${idx}`} className="text-xs text-indigo-700 bg-white p-2 rounded border border-indigo-100 flex gap-2">
                                {suggestion}
                            </div>
                        ))}

                        {/* Quality Suggestions */}
                        {analysis.qualitySuggestions?.map((suggestion, idx) => (
                            <div key={`qual-${idx}`} className="text-xs text-indigo-700 bg-white p-2 rounded border border-indigo-100 flex gap-2">
                                {suggestion}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quality Modifier */}
            {
                analysis.qualityModifier !== 0 && (
                    <div className="px-4 pb-3 pt-2">
                        <div className={`text-sm px-3 py-2 rounded-lg ${analysis.qualityModifier > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {language === 'es' ? 'Ajuste de calidad sugerido:' : 'Suggested quality adjustment:'}{' '}
                            <strong>{analysis.qualityModifier > 0 ? '+' : ''}{analysis.qualityModifier}</strong>
                        </div>
                    </div>
                )
            }

            {/* Warnings */}
            {(hasFlaggedScores || hasDefects) && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                    {hasFlaggedScores && (
                        <div className="flex items-center gap-2 text-amber-700 text-sm">
                            <AlertTriangle size={16} />
                            <span>{language === 'es' ? 'Atributos principales sin selección' : 'Core attributes not selected'}</span>
                        </div>
                    )}
                    {hasDefects && (
                        <div className="flex items-center gap-2 text-red-700 text-sm mt-1">
                            <AlertTriangle size={16} />
                            <span>{language === 'es' ? 'Defectos detectados' : 'Defects detected'}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 p-4 bg-gray-50 border-t sticky bottom-0">
                <button
                    onClick={onDiscard}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                    {language === 'es' ? 'Descartar' : 'Discard'}
                </button>
                <button
                    onClick={onSave}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                    {language === 'es' ? 'Guardar' : 'Save'}
                </button>
                <button
                    onClick={handleApply}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                    {language === 'es' ? 'Aplicar' : 'Apply'}
                </button>
            </div>
        </div >
    );
};

export default TDSSummary;
