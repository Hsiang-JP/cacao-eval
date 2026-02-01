/**
 * Sensory Evaluation Constants
 * Centralized configuration for scientific values, thresholds, and scoring logic.
 */

// ============================================================================
// TDS CALCULATION CONSTANTS
// ============================================================================

// Zone Definitions (Normalized to Swallow Time = 1.0)
export const TDS_ZONES = {
    ATTACK: { start: 0, end: 0.2 }, // 0-20%
    BODY: { start: 0.2, end: 1.0 }, // 20-100%
    FINISH: { start: 1.0, end: Infinity }, // >100%
};

// Visualization & Smoothing Constants
export const TDS_VISUALIZATION = {
    SIGMA_MULTIPLE: 3.0,    // Aggregated Curves Smoothing
    SILENCE_CONSTANT: 0.5,  // Noise floor
    SIGMA_SINGLE: 2.0       // Relative Intensity Evolution (Stream Graph) Smoothing
};

// Significance Thresholds (Chance Level ≈ 6.67% for 15 attributes)
export const SIGNIFICANCE_LEVEL = 6.7;

// Duration Thresholds (Seconds)
export const MIN_DURATION_FOR_PRESENCE = 0.05; // 50ms to filter click noise
export const FINISH_SIGNIFICANT_DURATION = 5.0; // Seconds required to count as significant finish
export const FINISH_DOMINANT_DURATION = 10.0; // Seconds required to count as dominant finish

// Scoring Weights & Thresholds
export const AROMA_INTENSITY_THRESHOLDS = {
    LOW: 5,     // >5% -> Intensity 4
    MEDIUM: 10, // >10% -> Intensity 5
    HIGH: 20,   // >20% -> Intensity 6
    VERY_HIGH: 30, // >30% -> Intensity 7
    DOMINANT: 50, // >50% -> Intensity 8
};

export const AFTERTASTE_INTENSITY_THRESHOLDS = {
    LOW: 5,     // >5% -> Intensity 4
    MEDIUM: 15, // >15% -> Intensity 5
    HIGH: 25,   // >25% -> Intensity 6
    VERY_HIGH: 40, // >40% -> Intensity 7
    DOMINANT: 60, // >60% -> Intensity 8
};

// ============================================================================
// FLAVOR WHEEL / EVALUATION CONSTANTS
// ============================================================================

// Calculated Attribute Weights
export const ATTRIBUTE_WEIGHTS = {
    PRIMARY: 1.0,
    SECONDARY: 0.75,
    TERTIARY: 0.33,
};

// Global Quality Recommendation Ranges
export const QUALITY_RANGES = {
    EXCELLENT: { min: 8, max: 10 },
    GOOD: { min: 7, max: 8 },
    AVERAGE: { min: 4, max: 6 },
    POOR: { min: 0, max: 3 },
};
