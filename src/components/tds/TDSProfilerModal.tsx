/**
 * TDSProfilerModal
 * Full-screen tasting interface for Temporal Dominance of Sensations profiling.
 * 
 * SCIENTIFIC STANDARD: Single-selection dominance (one attribute at a time).
 * New selection automatically cancels the previous one.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TDSMode, TDSEvent, TDSProfile } from '../../types';
// import { detectInputMethod, InputMethod } from '../../utils/inputDetection';
import { getAttributeColor } from '../../utils/colors';
import { useLanguage } from '../../context/LanguageContext';
import TDSTimer from './TDSTimer';
import TDSButton from './TDSButton';

// Core attributes for Normal mode (CoEx standard 5)
const CORE_ATTRIBUTES = ['cacao', 'acidity', 'bitterness', 'astringency', 'roast'];

// All attributes for Expert mode
const ALL_ATTRIBUTES = [
    'cacao', 'acidity', 'bitterness', 'astringency', 'roast',
    'fresh_fruit', 'browned_fruit', 'vegetal', 'floral',
    'woody', 'spice', 'nutty', 'caramel', 'sweetness', 'defects'
];

import { ATTRIBUTE_LABELS } from '../../data/attributes';

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
    const { language } = useLanguage();
    const [state, setState] = useState<TDSState>('idle');
    // const [elapsedTime, setElapsedTime] = useState(0); // REMOVED: Managed by TDSTimer
    const [swallowTime, setSwallowTime] = useState<number | null>(null);
    const [currentAttr, setCurrentAttr] = useState<string | null>(null); // Single active attribute
    const [events, setEvents] = useState<TDSEvent[]>([]);
    // Force mouse mode (toggle behavior) for everyone as requested
    const inputMethod = 'mouse';

    // Get attributes based on mode
    const attributes = mode === 'normal' ? CORE_ATTRIBUTES : ALL_ATTRIBUTES;

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

    return (
        <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col h-dvh">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-800">
                <div className="flex items-center gap-3">
                    <h2 className="text-white font-bold text-lg">
                        {language === 'es' ? 'Perfil TDS' : 'TDS Profile'}
                        <span className="text-gray-400 text-sm ml-2">
                            ({mode === 'normal' ? (language === 'es' ? 'Normal' : 'Core') : 'Expert'})
                        </span>
                    </h2>
                </div>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-white p-2 font-bold"
                    aria-label="Close"
                >
                    {language === 'es' ? 'Cerrar' : 'Close'}
                </button>
            </div>

            {/* Timer Display */}
            <div className="flex-none py-2 text-center">

                {/* Swallow Time - Fixed Height Wrapper to prevent layout shift */}
                <div className="h-6 flex items-center justify-center mb-1">
                    {swallowTime !== null ? (
                        <div className="text-amber-400 text-sm font-medium animate-fade-in">
                            {language === 'es' ? 'Tragado a' : 'Swallowed at'} {formatTime(swallowTime)}
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
                            {ATTRIBUTE_LABELS[currentAttr]?.[language] || currentAttr}
                        </span>
                    ) : (
                        <span className="inline-block px-4 py-2 rounded-full bg-gray-800 text-gray-600 font-bold text-lg border border-gray-700">
                            {language === 'es' ? 'Seleccione...' : 'Select...'}
                        </span>
                    )}
                </div>
            </div>

            {/* Single-Selection Instruction */}
            {(state === 'tasting' || state === 'swallowed') && (
                <div className="text-center text-gray-400 text-sm mb-2 px-4">
                    {language === 'es'
                        ? 'Toque el sabor dominante. Solo uno a la vez.'
                        : 'Tap the dominant flavor. Only one at a time.'}
                </div>
            )}

            {/* Attribute Buttons Grid */}
            <div
                className={`flex-1 px-2 pb-2 ${state === 'idle' ? 'overflow-auto' : 'overflow-hidden'}`}
                style={{
                    touchAction: state !== 'idle' ? 'none' : 'auto',
                    overscrollBehavior: 'none',
                }}
                onTouchMove={(e) => {
                    if (state === 'tasting' || state === 'swallowed') {
                        e.preventDefault();
                    }
                }}
            >
                {state === 'idle' ? (
                    <div className="h-full flex items-center justify-center">
                        <button
                            onClick={handleStart}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-12 rounded-2xl text-2xl flex items-center gap-3 shadow-lg transition-all"
                        >
                            {language === 'es' ? 'Comenzar' : 'Start Tasting'}
                        </button>
                    </div>
                ) : (
                    <div className="h-full w-full flex justify-center">
                        <div
                            // Compact Grid: 3 cols always (even on desktop) to reduce mouse travel
                            // Max width constrained to 800px
                            className={`grid gap-2 h-full w-full max-w-[700px] grid-cols-3`}
                            style={{
                                touchAction: 'none',
                                gridTemplateRows: mode === 'normal'
                                    ? 'repeat(2, 1fr)'  // 5 items, 3 cols -> 2 rows
                                    : 'repeat(5, 1fr)'  // 15 items, 3 cols -> 5 rows
                            }}
                        >
                            {attributes.map(attrId => {
                                const isActive = currentAttr === attrId;
                                // color is already imported
                                const color = getAttributeColor(attrId);

                                return (
                                    <TDSButton
                                        key={attrId}
                                        attrId={attrId}
                                        label={ATTRIBUTE_LABELS[attrId]?.[language] || attrId}
                                        color={color}
                                        inputMethod={inputMethod}
                                        isActive={isActive}
                                        onStart={handleButtonStart}
                                        onStop={handleButtonStop}
                                        disabled={state === 'finished'}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons - Fixed at bottom */}
            {(state === 'tasting' || state === 'swallowed') && (
                <div className="flex-none p-2 bg-gray-800 flex gap-2 pb-safe">
                    <button
                        onClick={handleSwallow}
                        disabled={state !== 'tasting'}
                        className={`flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${state === 'tasting'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                            }`}
                    >
                        {language === 'es' ? 'Tragar' : 'Swallow'}
                    </button>

                    <button
                        onClick={handleFinish}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        {language === 'es' ? 'Terminar' : 'Finish'}
                    </button>
                </div>
            )}

            {/* Combined CSS for dynamic viewport height */}
            <style>{`
                .h-dvh { height: 100vh; height: 100dvh; }
                .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
            `}</style>
        </div>
    );
};

export default TDSProfilerModal;
