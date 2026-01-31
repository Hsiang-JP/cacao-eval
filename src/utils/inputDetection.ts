/**
 * Input Detection Utilities
 * Detects whether the device uses touch or mouse as primary input.
 */

export type InputMethod = 'touch' | 'mouse';

/**
 * Detect the primary input method based on device capabilities.
 * Uses CSS media query for pointer type detection.
 * 
 * - 'coarse' pointer = touch device (finger)
 * - 'fine' pointer = mouse/trackpad
 */
export const detectInputMethod = (): InputMethod => {
    // Check if window exists (SSR safety)
    if (typeof window === 'undefined') {
        return 'mouse'; // Default for SSR
    }

    // Primary method: CSS media query
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    if (isCoarsePointer) {
        return 'touch';
    }

    // Fallback: Check for touch support
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // If device has touch but fine pointer, it's likely a touchscreen laptop
    // In this case, we prefer mouse behavior as they likely have mouse/trackpad
    return hasTouchSupport && !window.matchMedia('(pointer: fine)').matches
        ? 'touch'
        : 'mouse';
};

/**
 * Check if the device supports touch input (regardless of primary method).
 * Useful for hybrid devices like Surface Pro.
 */
export const hasTouchSupport = (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
