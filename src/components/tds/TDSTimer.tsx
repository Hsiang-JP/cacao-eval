import React, { useEffect, useRef } from 'react';

interface TDSTimerProps {
    startTime: number;
    isRunning: boolean;
    className?: string;
}

/**
 * TDSTimer
 * Optimized timer component that updates the DOM directly via Ref.
 * This prevents re-rendering the parent TDSProfilerModal on every frame (60fps),
 * significantly reducing CPU usage and battery drain on mobile devices.
 */
const TDSTimer: React.FC<TDSTimerProps> = ({ startTime, isRunning, className }) => {
    const timeRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>(0);

    // Format helper (internal to avoid dependencies)
    const format = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    useEffect(() => {
        if (!isRunning) {
            cancelAnimationFrame(animationFrameRef.current);
            // Ensure final time is displayed if we stop (optional, mostly for cleanliness)
            if (timeRef.current && startTime > 0) {
                const elapsed = (performance.now() - startTime) / 1000;
                timeRef.current.innerText = format(elapsed);
            }
            return;
        }

        const tick = () => {
            if (timeRef.current) {
                const elapsed = (performance.now() - startTime) / 1000;
                timeRef.current.innerText = format(elapsed);
            }
            animationFrameRef.current = requestAnimationFrame(tick);
        };

        animationFrameRef.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [startTime, isRunning]);

    return (
        <div
            ref={timeRef}
            className={className || "text-6xl font-mono font-bold text-white tracking-wider"}
            aria-label="Elapsed time"
        >
            0:00.0
        </div>
    );
};

export default React.memo(TDSTimer);
