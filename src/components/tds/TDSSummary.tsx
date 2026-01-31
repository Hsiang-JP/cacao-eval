/**
 * TDSSummary Component
 * Displays advanced TDS analysis with zone breakdowns and aroma/aftertaste insights.
 */

import React, { useMemo, useState } from 'react';
import { Check, RotateCcw, AlertTriangle, Sparkles, Wind, Trash2, Save } from 'lucide-react';
import { TDSProfile, TDSAnalysisResult, TDSScoreResult } from '../../types';
import { analyzeTDS, CORE_ATTRIBUTES, DEFECT_ATTRIBUTES } from '../../utils/tdsCalculator';
import { getAttributeColor } from '../../utils/colors';
import { useLanguage } from '../../context/LanguageContext';

// Attribute labels
const ATTRIBUTE_LABELS: Record<string, { en: string; es: string }> = {
    cacao: { en: 'Cacao', es: 'Cacao' },
    acidity: { en: 'Acidity', es: 'Acidez' },
    bitterness: { en: 'Bitterness', es: 'Amargor' },
    astringency: { en: 'Astringency', es: 'Astringencia' },
    roast: { en: 'Roast', es: 'Tostado' },
    fresh_fruit: { en: 'Fresh Fruit', es: 'Fruta Fresca' },
    browned_fruit: { en: 'Browned Fruit', es: 'Fruta Marrón' },
    vegetal: { en: 'Vegetal', es: 'Vegetal' },
    floral: { en: 'Floral', es: 'Floral' },
    woody: { en: 'Woody', es: 'Madera' },
    spice: { en: 'Spice', es: 'Especia' },
    nutty: { en: 'Nutty', es: 'Nuez' },
    caramel: { en: 'Caramel', es: 'Caramelo' },
    sweetness: { en: 'Sweetness', es: 'Dulzor' },
    defects: { en: 'Defects', es: 'Defectos' },
};

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
                <p className="text-cacao-100 text-sm">
                    {language === 'es' ? 'Duración' : 'Duration'}: {profile.totalDuration.toFixed(1)}s
                    {' | '}
                    {language === 'es' ? 'Tragado' : 'Swallow'}: {profile.swallowTime.toFixed(1)}s
                </p>
            </div>

            {/* Aroma & Aftertaste Insights */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
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
                        <span className="text-xs font-bold uppercase">{language === 'es' ? 'Retrogusto' : 'Aftertaste'}</span>
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

            {/* Scientific Notice */}
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                <p className="text-xs text-blue-700">
                    {language === 'es'
                        ? 'Puntuaciones basadas en zonas: Ataque (0-20%), Cuerpo (20-100%), Final (post-trago)'
                        : 'Scores based on zones: Attack (0-20%), Body (20-100%), Finish (post-swallow)'}
                </p>
                {/* Global Boost Notification */}
                {Array.from(analysis.scores.values()).some(s => s.originalScore !== undefined) && (
                    <p className="text-xs text-indigo-700 mt-1 font-medium flex items-center gap-1">
                        <Sparkles size={12} />
                        {language === 'es'
                            ? 'Algunos puntajes fueron aumentados debido a una fuerte presencia en el retrogusto.'
                            : 'Some scores were boosted due to strong aftertaste presence.'}
                    </p>
                )}
            </div>

            {/* Warnings */}
            {(hasFlaggedScores || hasDefects) && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                    {hasFlaggedScores && (
                        <div className="flex items-center gap-2 text-amber-700 text-sm">
                            <AlertTriangle size={16} />
                            <span>{language === 'es' ? 'Atributos básicos sin selección' : 'Core attributes not selected'}</span>
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

            {/* Timeline Chart - Pure CSS Implementation */}
            {profile.events.length > 0 && (
                <div className="p-4">
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-2">
                        {language === 'es' ? 'Línea de Tiempo' : 'Timeline'}
                    </h4>

                    {/* Timeline Bar Container */}
                    <div className="relative w-full mt-6">
                        {/* Labels above the bar */}
                        <div className="absolute -top-5 left-0 right-0 flex justify-between text-xs text-gray-500 font-medium z-20 pointer-events-none">
                            {/* Start */}
                            <span className="absolute left-0">0s</span>
                            {/* Attack→Body Label */}
                            <span
                                className="absolute text-gray-700"
                                style={{
                                    left: `${(profile.swallowTime * 0.2 / profile.totalDuration) * 100}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                {(profile.swallowTime * 0.2).toFixed(1)}s
                            </span>
                            {/* Swallow Label */}
                            <span
                                className="absolute text-gray-800 font-bold"
                                style={{
                                    left: `${(profile.swallowTime / profile.totalDuration) * 100}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                {profile.swallowTime.toFixed(1)}s
                            </span>
                            {/* End */}
                            <span className="absolute right-0">{Math.ceil(profile.totalDuration)}s</span>
                        </div>

                        {/* The Bar */}
                        <div
                            className="relative w-full h-14 sm:h-16 bg-gray-100 rounded-lg overflow-hidden"
                            onClick={() => setSelectedEventIdx(null)} // Clear selection when clicking empty area
                        >
                            {/* Stacked event segments */}
                            <div className="absolute inset-0 flex">
                                {profile.events.map((event, idx) => {
                                    const startPercent = (event.start / profile.totalDuration) * 100;
                                    const widthPercent = ((event.end - event.start) / profile.totalDuration) * 100;
                                    const isSelected = selectedEventIdx === idx;
                                    return (
                                        <div
                                            key={idx}
                                            className={`absolute h-full transition-all cursor-pointer ${isSelected ? 'ring-2 ring-black ring-offset-1 z-20' : 'hover:opacity-80'
                                                }`}
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

                            {/* Attack→Body marker line (dashed) */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 sm:w-1 z-10"
                                style={{
                                    left: `${(profile.swallowTime * 0.2 / profile.totalDuration) * 100}%`,
                                    background: 'repeating-linear-gradient(to bottom, black 0, black 4px, transparent 4px, transparent 8px)'
                                }}
                            />

                            {/* Swallow marker line (solid) */}
                            <div
                                className="absolute top-0 bottom-0 w-1 sm:w-1.5 z-10 bg-black"
                                style={{
                                    left: `${(profile.swallowTime / profile.totalDuration) * 100}%`,
                                }}
                            />
                        </div>

                        {/* Selected Event Detail (touch-accessible) */}
                        {selectedEventIdx !== null && profile.events[selectedEventIdx] && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: getAttributeColor(profile.events[selectedEventIdx].attrId) }}
                                    />
                                    <span className="font-medium text-gray-800">
                                        {ATTRIBUTE_LABELS[profile.events[selectedEventIdx].attrId]?.[language] || profile.events[selectedEventIdx].attrId}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {profile.events[selectedEventIdx].start.toFixed(1)}s – {profile.events[selectedEventIdx].end.toFixed(1)}s
                                    <span className="ml-2 text-gray-400">
                                        ({(profile.events[selectedEventIdx].end - profile.events[selectedEventIdx].start).toFixed(1)}s)
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex gap-3 sm:gap-4 text-xs text-gray-600 mt-2 justify-center flex-wrap">
                        <span className="flex items-center gap-1">
                            <span className="w-3 sm:w-4 h-0.5" style={{ background: 'repeating-linear-gradient(90deg, black 0, black 2px, transparent 2px, transparent 4px)' }}></span>
                            <span className="hidden sm:inline">Attack→Body:</span>
                            <span className="sm:hidden">▲</span>
                            {(profile.swallowTime * 0.2).toFixed(1)}s
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 sm:w-4 h-1 bg-black"></span>
                            <span className="hidden sm:inline">Swallow:</span>
                            <span className="sm:hidden">●</span>
                            {profile.swallowTime.toFixed(1)}s
                        </span>
                        <span className="font-medium text-amber-700">
                            {language === 'es' ? 'Fin' : 'Aftertaste'}: {(profile.totalDuration - profile.swallowTime).toFixed(1)}s
                        </span>
                    </div>
                </div>
            )}

            {/* Core Scores */}
            <div className="px-4 pb-2">
                <h4 className="text-sm font-bold text-gray-600 uppercase mb-2">
                    {language === 'es' ? 'Atributos Básicos' : 'Core Attributes'}
                    {profile.mode === 'expert' && <span className="text-xs text-gray-400 font-normal ml-1">(aggregated)</span>}
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
                            {result.originalScore !== undefined && result.boostDetails && (
                                <div className="mt-1 ml-5 text-xs text-indigo-600 flex items-start gap-1">
                                    <div className="flex h-3 w-3 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold mt-0.5 flex-shrink-0">↑</div>
                                    <span>
                                        {language === 'es'
                                            ? `Aumentado +${result.boostDetails.amount} (Presencia tras tragar: ${result.boostDetails.duration}s)`
                                            : `Boosted by +${result.boostDetails.amount} (Lingering presence: ${result.boostDetails.duration}s)`}
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

            {/* Complementary Scores (Expert mode) */}
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

            {/* Quality Modifier */}
            {
                analysis.qualityModifier !== 0 && (
                    <div className="px-4 pb-3">
                        <div className={`text-sm px-3 py-2 rounded-lg ${analysis.qualityModifier > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {language === 'es' ? 'Ajuste de calidad sugerido:' : 'Suggested quality adjustment:'}{' '}
                            <strong>{analysis.qualityModifier > 0 ? '+' : ''}{analysis.qualityModifier}</strong>
                        </div>
                    </div>
                )
            }

            {/* Actions */}
            <div className="flex gap-3 p-4 bg-gray-50 border-t sticky bottom-0">
                <button
                    onClick={onDiscard}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                    <Trash2 size={18} />
                    {language === 'es' ? 'Descartar' : 'Discard'}
                </button>
                <button
                    onClick={onSave}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                    <Save size={18} />
                    {language === 'es' ? 'Guardar' : 'Save'}
                </button>
                <button
                    onClick={handleApply}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                    <Check size={18} />
                    {language === 'es' ? 'Aplicar' : 'Apply'}
                </button>
            </div>
        </div >
    );
};

export default TDSSummary;
