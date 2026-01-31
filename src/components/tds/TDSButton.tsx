/**
 * TDSButton Component
 * Smart button handling dual input modes (touch vs mouse).
 * - Touch: Press and hold activates, release deactivates
 * - Mouse: Click to toggle on/off (latch mode)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { InputMethod } from '../../utils/inputDetection';

interface TDSButtonProps {
    attrId: string;
    label: string;
    color: string;
    inputMethod: InputMethod;
    isActive: boolean;
    onStart: (attrId: string) => void;
    onStop: (attrId: string) => void;
    disabled?: boolean;
}

const TDSButton: React.FC<TDSButtonProps> = ({
    attrId,
    label,
    color,
    inputMethod,
    isActive,
    onStart,
    onStop,
    disabled = false,
}) => {
    // Track if we're currently touching this button (for touch mode)
    const isTouchingRef = useRef(false);

    // Touch handlers (Press & Hold)
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled) return;
        e.preventDefault(); // Prevent default to avoid conflicts
        isTouchingRef.current = true;
        if (!isActive) {
            onStart(attrId);
        }
    }, [attrId, disabled, isActive, onStart]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (disabled) return;
        e.preventDefault();
        isTouchingRef.current = false;
        if (isActive) {
            onStop(attrId);
        }
    }, [attrId, disabled, isActive, onStop]);

    // Mouse handler (Click-to-Toggle)
    const handleClick = useCallback((e: React.MouseEvent) => {
        if (disabled) return;
        if (inputMethod !== 'mouse') return; // Only for mouse mode

        if (isActive) {
            onStop(attrId);
        } else {
            onStart(attrId);
        }
    }, [attrId, disabled, inputMethod, isActive, onStart, onStop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isTouchingRef.current && isActive) {
                onStop(attrId);
            }
        };
    }, [attrId, isActive, onStop]);

    const baseClasses = `
    relative flex items-center justify-center
    px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wide
    transition-all duration-150 select-none
    touch-manipulation
  `;

    const activeClasses = isActive
        ? `ring-4 ring-offset-2 ring-white/50 scale-95 shadow-lg`
        : `hover:scale-105 shadow-md`;

    const disabledClasses = disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer';

    return (
        <button
            type="button"
            className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
            style={{
                backgroundColor: isActive ? color : `${color}80`,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
            onClick={handleClick}
            onTouchStart={inputMethod === 'touch' ? handleTouchStart : undefined}
            onTouchEnd={inputMethod === 'touch' ? handleTouchEnd : undefined}
            onTouchCancel={inputMethod === 'touch' ? handleTouchEnd : undefined}
            disabled={disabled}
            aria-pressed={isActive}
        >
            {/* Active indicator pulse */}
            {isActive && (
                <span
                    className="absolute inset-0 rounded-xl animate-pulse"
                    style={{ backgroundColor: color, opacity: 0.3 }}
                />
            )}
            <span className="relative z-10">{label}</span>
        </button>
    );
};

export default TDSButton;
