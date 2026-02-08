import React, { useState, useMemo } from 'react';
import { TDSProfile } from '../../types';
import { analyzeTDS } from '../../utils/tdsCalculator';
import { getAttributeColor } from '../../utils/colors';
import { useTranslation } from 'react-i18next';
import { useDataTranslation } from '../../hooks/useDataTranslation';
import { ATTRIBUTE_LABELS } from '../../data/attributes';

interface TDSTimelineProps {
    profile: TDSProfile;
    height?: string; // e.g. "h-16" or "h-24"
}

const TDSTimeline: React.FC<TDSTimelineProps> = ({ profile, height = "h-14 sm:h-16" }) => {
    const { t } = useTranslation();
    const { translateData } = useDataTranslation();
    const [selectedEventIdx, setSelectedEventIdx] = useState<number | null>(null);

    // Run analysis to get timing details (Attack End, etc)
    const analysis = useMemo(() => analyzeTDS(profile), [profile]);

    if (!profile.events.length) return null;

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                <h4 className="text-sm font-bold text-gray-600 uppercase">
                    {t('tds.timeline')}
                </h4>
                <div className="flex gap-3 text-xs text-gray-500">
                    <span>{t('tds.duration')}: {profile.totalDuration.toFixed(1)}s</span>
                    <span className="hidden sm:inline">|</span>
                    <span>{t('tds.swallowVerb')}: {profile.swallowTime.toFixed(1)}s</span>
                </div>
            </div>

            {/* Timeline Bar Container */}
            <div className="relative w-full mt-6 mb-12">
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
                            <div className="absolute -top-4 left-0 right-0 text-[10px] sm:text-xs text-gray-500 font-medium z-20 pointer-events-none">
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
                                className={`relative w-full ${height} bg-gray-100 rounded-lg overflow-hidden border border-gray-200`}
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
                                                className={`absolute h-full cursor-pointer transition-opacity ${isSelected ? 'opacity-100 z-20 ring-2 ring-white ring-inset' : 'hover:opacity-90'}`}
                                                style={{
                                                    left: `${startPercent}%`,
                                                    width: `${widthPercent}%`,
                                                    backgroundColor: getAttributeColor(event.attrId),
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEventIdx(isSelected ? null : idx);
                                                }}
                                                title={`${translateData(ATTRIBUTE_LABELS[event.attrId]) || event.attrId}: ${event.start.toFixed(1)}s - ${event.end.toFixed(1)}s`}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Attack End marker line (dashed) */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 sm:w-1 z-10"
                                    style={{
                                        left: `${attackEndPos}%`,
                                        background: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.5) 0, rgba(0,0,0,0.5) 4px, transparent 4px, transparent 8px)'
                                    }}
                                />

                                {/* Swallow marker line (solid) */}
                                <div
                                    className="absolute top-0 bottom-0 w-1 sm:w-1.5 z-10 bg-black/80"
                                    style={{ left: `${swallowPos}%` }}
                                />
                            </div>

                            {/* BOTTOM ROW: Absolute Times */}
                            <div className="absolute -bottom-5 left-0 right-0 text-[10px] sm:text-xs text-gray-500 font-medium z-20 pointer-events-none">
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
                            </div>
                        </>
                    );
                })()}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-xs text-gray-600 mb-2">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 border-t-2 border-dashed border-gray-400"></span>
                    {t('tds.attackEnd')}
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-black"></span>
                    {t('tds.swallowVerb')}
                </span>
                <span className="font-medium text-amber-700 ml-auto">
                    {t('tds.aftertaste')}: {(profile.totalDuration - profile.swallowTime).toFixed(1)}s
                </span>
            </div>

            {/* Selected Event Detail - Pre-allocated space */}
            <div className="h-8 flex items-center">
                {selectedEventIdx !== null && profile.events[selectedEventIdx] ? (
                    <div className="px-2 py-1 bg-gray-50 rounded border border-gray-100 flex items-center gap-2 animate-fade-in shadow-sm">
                        <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getAttributeColor(profile.events[selectedEventIdx].attrId) }}
                        />
                        <span className="font-bold text-gray-800 text-xs">
                            {translateData(ATTRIBUTE_LABELS[profile.events[selectedEventIdx].attrId]) || profile.events[selectedEventIdx].attrId}
                        </span>
                        <span className="text-xs text-gray-500">
                            {profile.events[selectedEventIdx].start.toFixed(1)}s – {profile.events[selectedEventIdx].end.toFixed(1)}s
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400 italic">
                        {t('tds.tapSegment')}
                    </span>
                )}
            </div>
        </div>
    );
};

export default TDSTimeline;
