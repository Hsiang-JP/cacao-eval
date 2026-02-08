export const SENSORY_PALETTE = {
    // Brand / Material Colors
    brand: {
        50: '#fdf8f6',
        100: '#f2e8e5',
        200: '#eaddd7',
        300: '#e0cec7',
        400: '#d2bab0',
        500: '#a0785a', // Primary Brand (Original)
        600: '#8c5e4a',
        700: '#754a3a',
        800: '#5e3a2e',
        900: '#4a2e24',
    },
    // Functional Colors
    functional: {
        success: '#10b981', // emerald-500
        warning: '#f59e0b', // amber-500
        error: '#ef4444',   // red-500
        action: '#3b82f6',  // blue-500
        info: '#3b82f6',
    },
    // Canonical Flavor Colors (The "15") - Extracted from utils/colors.ts
    attributes: {
        cacao: '#754c29',
        bitterness: '#a01f65',
        astringency: '#366d99',
        roast: '#ebab21',
        acidity: '#00954c',
        fresh_fruit: '#f6d809',
        browned_fruit: '#431614',
        vegetal: '#006260',
        floral: '#8dc63f',
        woody: '#a97c50',
        spice: '#c33d32',
        nutty: '#a0a368',
        caramel: '#bd7844',
        sweetness: '#ffc6e0',
        defects: '#a7a9ac',
        // Fallback
        default: '#a0785a'
    }
} as const;

export const CHART_CONSTANTS = {
    TDS: {
        // Visualization & Smoothing Constants (from sensoryConstants.ts)
        // We keep them here for display-related logic, while math uses the config
        HEIGHT: 400,     // px
        RESOLUTION: 0.1, // Time step for smoothing
        SIGMA_SINGLE: 2.0,
        STROKE_WIDTH: 2,
        OPACITY: {
            AREA: 0.8,
            GRID: 0.1,
        }
    }
};
