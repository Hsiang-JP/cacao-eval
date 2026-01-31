/**
 * TDSProfilerModal
 * Full-screen tasting interface for Temporal Dominance of Sensations profiling.
 * 
 * SCIENTIFIC STANDARD: Single-selection dominance (one attribute at a time).
 * New selection automatically cancels the previous one.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Coffee, StopCircle } from 'lucide-react';
import { TDSMode, TDSEvent, TDSProfile } from '../../types';
// import { detectInputMethod, InputMethod } from '../../utils/inputDetection';
import { getAttributeColor } from '../../utils/colors';
import { useLanguage } from '../../context/LanguageContext';

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
    const [elapsedTime, setElapsedTime] = useState(0);
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

    // Timer using requestAnimationFrame
    useEffect(() => {
        if (state !== 'tasting' && state !== 'swallowed') return;

        const tick = () => {
            // Use performance.now() consistently with startTimeRef
            const elapsed = (performance.now() - startTimeRef.current) / 1000;
            setElapsedTime(elapsed);

            animationFrameRef.current = requestAnimationFrame(tick);
        };

        animationFrameRef.current = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, [state]);

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

    // Start tasting
    const handleStart = () => {
        startTimeRef.current = performance.now();
        setState('tasting');
        setElapsedTime(0);
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
            events: finalEvents,
            swallowTime: swallowTime || finalDuration,
            totalDuration: finalDuration,
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
        <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-800">
                <div className="flex items-center gap-3">
                    <Coffee className="w-6 h-6 text-amber-400" />
                    <h2 className="text-white font-bold text-lg">
                        {language === 'es' ? 'Perfil TDS' : 'TDS Profile'}
                        <span className="text-gray-400 text-sm ml-2">
                            ({mode === 'normal' ? (language === 'es' ? 'Normal' : 'Core') : 'Expert'})
                        </span>
                    </h2>
                </div>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-white p-2"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Timer Display */}
            <div className="flex-none py-6 text-center">
                <div className="text-6xl font-mono font-bold text-white tracking-wider">
                    {formatTime(elapsedTime)}
                </div>
                {swallowTime !== null && (
                    <div className="text-amber-400 text-sm mt-2">
                        {language === 'es' ? 'Tragado a' : 'Swallowed at'} {formatTime(swallowTime)}
                    </div>
                )}

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

            {/* Attribute Buttons Grid - LOCKED during recording */}
            <div
                className={`flex-1 px-4 pb-4 ${state === 'idle' ? 'overflow-auto' : 'overflow-hidden'}`}
                style={{
                    // Prevent any touch scroll/drag during recording
                    touchAction: state !== 'idle' ? 'none' : 'auto',
                    overscrollBehavior: 'none',
                }}
                onTouchMove={(e) => {
                    // Prevent scroll/swipe during recording
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
                            <Play size={32} fill="currentColor" />
                            {language === 'es' ? 'Comenzar' : 'Start Tasting'}
                        </button>
                    </div>
                ) : (
                    <div
                        className={`grid gap-3 ${mode === 'normal' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5'}`}
                        style={{ touchAction: 'none' }}
                    >
                        {attributes.map(attrId => {
                            const isActive = currentAttr === attrId;
                            const color = getAttributeColor(attrId);

                            return (
                                <button
                                    key={attrId}
                                    type="button"
                                    className={`
                    relative flex items-center justify-center
                    px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wide
                    transition-all duration-150 select-none
                    ${isActive
                                            ? 'ring-4 ring-offset-2 ring-white/50 scale-95 shadow-lg'
                                            : 'hover:scale-105 shadow-md'}
                    ${state === 'finished' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                                    style={{
                                        backgroundColor: isActive ? color : `${color}80`,
                                        color: '#fff',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                        // Lock button in place - no drag/scroll
                                        touchAction: 'manipulation',
                                        WebkitTouchCallout: 'none',
                                        WebkitUserSelect: 'none',
                                        userSelect: 'none',
                                    }}
                                    onClick={() => handleAttrSelect(attrId)}
                                    disabled={state === 'finished'}
                                    aria-pressed={isActive}
                                >
                                    {/* Active indicator pulse */}
                                    {isActive && (
                                        <span
                                            className="absolute inset-0 rounded-xl animate-pulse"
                                            style={{ backgroundColor: color, opacity: 0.3 }}
                                        />
                                    )}
                                    <span className="relative z-10">
                                        {ATTRIBUTE_LABELS[attrId]?.[language] || attrId}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {(state === 'tasting' || state === 'swallowed') && (
                <div className="flex-none p-4 bg-gray-800 flex gap-3">
                    {state === 'tasting' && (
                        <button
                            onClick={handleSwallow}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <Coffee size={20} />
                            {language === 'es' ? 'Tragar' : 'Swallow'}
                        </button>
                    )}
                    <button
                        onClick={handleFinish}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <StopCircle size={20} />
                        {language === 'es' ? 'Terminar' : 'Finish'}
                    </button>
                </div>
            )}

            {/* Removed Input Method Indicator */}
        </div>
    );
};

export default TDSProfilerModal;
