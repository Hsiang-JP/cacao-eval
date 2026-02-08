/**
 * TDSProfilerModal
 * Full-screen tasting interface for Temporal Dominance of Sensations profiling.
 * 
 * SCIENTIFIC STANDARD: Single-selection dominance (one attribute at a time).
 * New selection automatically cancels the previous one.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TDSMode, TDSEvent, TDSProfile } from '../../types';
// import { detectInputMethod, InputMethod } from '../../utils/inputDetection';
import { getAttributeColor } from '../../utils/colors';
import { useTranslation } from 'react-i18next';
import { useDataTranslation } from '../../hooks/useDataTranslation';
import TDSTimer from './TDSTimer';
import TDSButton from './TDSButton';

import { CORE_ATTRIBUTES, ALL_ATTRIBUTES } from '../../utils/tdsCalculator';
import { currentConfig } from '../../constants';

type TDSState = 'idle' | 'tasting' | 'swallowed' | 'finished';

interface TDSProfilerModalProps {
    mode: TDSMode;
    onComplete: (profile: TDSProfile) => void;
    onCancel: () => void;
}

const TDSProfilerModal: React.FC<TDSProfilerModalProps> = ({
    mode,
    onComplete,
    onCancel,
}) => {
    const { t } = useTranslation();
    const { translateData, language } = useDataTranslation();
    const [state, setState] = useState<TDSState>('idle');
    // const [elapsedTime, setElapsedTime] = useState(0); // REMOVED: Managed by TDSTimer
    const [swallowTime, setSwallowTime] = useState<number | null>(null);
    const [currentAttr, setCurrentAttr] = useState<string | null>(null); // Single active attribute
    const [events, setEvents] = useState<TDSEvent[]>([]);
    // Force mouse mode (toggle behavior) for everyone as requested
    const inputMethod = 'mouse';

    // Get attributes based on mode
    const attributes = mode === 'normal' ? CORE_ATTRIBUTES : ALL_ATTRIBUTES;

    // Helper for labels
    const getLabel = (attrId: string) => {
        const attr = currentConfig.attributes.find(a => a.id === attrId);
        const name = attr ? translateData({ en: attr.nameEn, es: attr.nameEs }) : attrId;
        // Remove text inside parenthesis along with parenthesis
        return name.replace(/\s*\(.*?\)\s*/g, '').trim();
    };

    // Refs for high-precision timing
    const startTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number>(0);
    const currentAttrStartRef = useRef<number | null>(null);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // ... (keep existing wake lock logic) ...

    // Request wake lock when tasting starts
    useEffect(() => {
        const requestWakeLock = async () => {
            if (state === 'tasting' && 'wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                } catch (err) {
                    console.warn('Wake lock not available:', err);
                }
            }
        };

        requestWakeLock();

        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        };
    }, [state]);

    // Lock body scroll to prevent accidental navigation
    useEffect(() => {
        // Prevent scrolling on mount
        document.body.style.overflow = 'hidden';
        // Also prevent touchmove to be safe on some mobile browsers if needed, 
        // but overflow:hidden usually suffices for fixed overlays.

        return () => {
            // Re-enable scrolling on unmount
            document.body.style.overflow = '';
        };
    }, []);

    // Timer loop REMOVED - Handled by TDSTimer component to prevent re-renders

    // Stop the current attribute and record the event
    const stopCurrentAttr = useCallback(() => {
        if (currentAttr && currentAttrStartRef.current !== null) {
            const now = (performance.now() - startTimeRef.current) / 1000;
            const phase = swallowTime !== null && currentAttrStartRef.current >= swallowTime ? 'residual' : 'melting';

            const event: TDSEvent = {
                attrId: currentAttr,
                start: currentAttrStartRef.current,
                end: now,
                phase,
            };

            setEvents(prev => [...prev, event]);
        }
        currentAttrStartRef.current = null;
        setCurrentAttr(null);
    }, [currentAttr, swallowTime]);

    // Handle attribute selection (single-selection: new click cancels old)
    const handleAttrSelect = useCallback((attrId: string) => {
        if (state !== 'tasting' && state !== 'swallowed') return;

        const now = (performance.now() - startTimeRef.current) / 1000;

        // If clicking the same attribute, toggle it off
        if (currentAttr === attrId) {
            stopCurrentAttr();
            return;
        }

        // Stop previous attribute (if any)
        if (currentAttr && currentAttrStartRef.current !== null) {
            const phase = swallowTime !== null && currentAttrStartRef.current >= swallowTime ? 'residual' : 'melting';
            const event: TDSEvent = {
                attrId: currentAttr,
                start: currentAttrStartRef.current,
                end: now,
                phase,
            };
            setEvents(prev => [...prev, event]);
        }

        // Start new attribute
        currentAttrStartRef.current = now;
        setCurrentAttr(attrId);
    }, [state, currentAttr, swallowTime, stopCurrentAttr]);

    // Adapter for TDSButton (which expects onStart/onStop)
    // Since we use single-selection, onStart triggers selection, onStop is ignored/not needed for latch mode
    // But for "Touch" mode (press-hold), onStart=Press, onStop=Release

    const handleButtonStart = useCallback((attrId: string) => {
        handleAttrSelect(attrId);
    }, [handleAttrSelect]);

    const handleButtonStop = useCallback((attrId: string) => {
        // Handle toggle off (mouse mode latch behavior)
        if (currentAttr === attrId) {
            stopCurrentAttr();
        }
    }, [currentAttr, stopCurrentAttr]);

    // Start tasting
    const handleStart = () => {
        startTimeRef.current = performance.now();
        setState('tasting');
        // setElapsedTime(0); // REMOVED
        setEvents([]);
        setCurrentAttr(null);
        currentAttrStartRef.current = null;
    };

    // Swallow marker
    const handleSwallow = () => {
        const now = (performance.now() - startTimeRef.current) / 1000;
        setSwallowTime(now);
        setState('swallowed');
    };

    // Finish profiling
    const handleFinish = () => {
        // Get final events list, including any currently active attribute
        let finalEvents = [...events];

        if (currentAttr && currentAttrStartRef.current !== null) {
            const now = (performance.now() - startTimeRef.current) / 1000;
            const phase = swallowTime !== null && currentAttrStartRef.current >= swallowTime ? 'residual' : 'melting';

            const finalEvent: TDSEvent = {
                attrId: currentAttr,
                start: currentAttrStartRef.current,
                end: now,
                phase,
            };
            finalEvents.push(finalEvent);
        }

        setState('finished');
        currentAttrStartRef.current = null;
        setCurrentAttr(null);

        const finalDuration = (performance.now() - startTimeRef.current) / 1000;

        const profile: TDSProfile = {
            mode,
            id: crypto.randomUUID ? crypto.randomUUID() : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            events: finalEvents,
            swallowTime: swallowTime || finalDuration,
            totalDuration: finalDuration,
            lastModified: Date.now()
        };

        onComplete(profile);
    };

    // Format time display
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col w-full h-[100dvh] overflow-hidden overscroll-none touch-none"
            style={{
                height: '100dvh',
                maxHeight: '-webkit-fill-available' // Fallback for iOS
            }}
        >
            {/* Header */}
            <div className="flex-none flex items-center justify-between p-4 bg-gray-800 shadow-md z-10">
                <div className="flex items-center gap-3">
                    <h2 className="text-white font-bold text-lg">
                        {t('tds.profile')}
                        <span className="text-gray-400 text-sm ml-2">
                            ({mode === 'normal' ? t('tds.modeNormal') : t('tds.modeExpert')})
                        </span>
                    </h2>
                </div>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-white p-2 font-bold bg-transparent border-0 cursor-pointer"
                    aria-label="Close"
                >
                    {t('tds.close')}
                </button>
            </div>

            {/* Timer Display */}
            <div className="flex-none py-2 text-center bg-gray-900 z-10">

                {/* Swallow Time - Fixed Height Wrapper */}
                <div className="h-6 flex items-center justify-center mb-1">
                    {swallowTime !== null ? (
                        <div className="text-amber-400 text-sm font-medium animate-fade-in">
                            {t('tds.swallowedAt')} {formatTime(swallowTime)}
                        </div>
                    ) : (
                        <div className="text-transparent text-sm select-none">Placeholder</div>
                    )}
                </div>

                <TDSTimer
                    startTime={startTimeRef.current}
                    isRunning={state === 'tasting' || state === 'swallowed'}
                />

                {/* Stable Layout Container for Active Attribute */}
                <div className="mt-3 h-10 flex items-center justify-center">
                    {currentAttr ? (
                        <span
                            className="inline-block px-4 py-2 rounded-full text-white font-bold text-lg animate-pulse shadow-lg"
                            style={{ backgroundColor: getAttributeColor(currentAttr) }}
                        >
                            {getLabel(currentAttr)}
                        </span>
                    ) : (
                        <span className="inline-block px-4 py-2 rounded-full bg-gray-800 text-gray-600 font-bold text-lg border border-gray-700">
                            {t('tds.select')}
                        </span>
                    )}
                </div>
            </div>

            {/* Single-Selection Instruction */}
            {(state === 'tasting' || state === 'swallowed') && (
                <div className="flex-none text-center text-gray-400 text-sm mb-2 px-4">
                    {t('tds.dominanceInstruction')}
                </div>
            )}

            {/* Attribute Buttons Grid - Takes all remaining space */}
            <div
                className="flex-1 w-full px-2 pb-2 min-h-0 overflow-hidden flex flex-col"
                style={{ touchAction: 'none' }}
            >
                {state === 'idle' ? (
                    <div className="h-full flex items-center justify-center">
                        <button
                            onClick={handleStart}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-12 rounded-2xl text-2xl flex items-center gap-3 shadow-lg transition-all transform active:scale-95"
                        >
                            {t('tds.startTasting')}
                        </button>
                    </div>
                ) : (
                    <div className="h-full w-full max-w-[700px] mx-auto">
                        <div
                            className="grid gap-1 w-full h-full grid-cols-3"
                            style={{
                                gridTemplateRows: mode === 'normal'
                                    ? 'repeat(2, minmax(0, 1fr))'
                                    : 'repeat(5, minmax(0, 1fr))'
                            }}
                        >
                            {attributes.map(attrId => {
                                const isActive = currentAttr === attrId;
                                const color = getAttributeColor(attrId);

                                return (
                                    <div key={attrId} className="w-full h-full min-h-0">
                                        <TDSButton
                                            attrId={attrId}
                                            label={getLabel(attrId)}
                                            color={color}
                                            inputMethod={inputMethod}
                                            isActive={isActive}
                                            onStart={handleButtonStart}
                                            onStop={handleButtonStop}
                                            disabled={state === 'finished'}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons - In-flow footer (flex-none) */}
            {(state === 'tasting' || state === 'swallowed') && (
                <div className="flex-none p-2 bg-gray-800 flex gap-2 pb-safe w-full border-t border-gray-700 shadow-md z-20">
                    <button
                        onClick={handleSwallow}
                        disabled={state !== 'tasting'}
                        className={`flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 ${state === 'tasting'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                            }`}
                    >
                        {t('tds.swallow')}
                    </button>

                    <button
                        onClick={handleFinish}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-lg"
                    >
                        {t('tds.finish')}
                    </button>
                </div>
            )}

            <style>{`
                .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
            `}</style>
        </div>,
        document.body
    );
};

export default TDSProfilerModal;
