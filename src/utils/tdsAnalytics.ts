import { TDSEvent } from '../types';

// Input: Single Replication (Raw Data)
export interface TDSReplication {
    id: string; // Sample ID or Replication ID
    duration: number;   // Total time in seconds (t_stop - t_start)
    events: TDSEvent[]; // { attrId: string, startTime: number, endTime: number }
    swallowTime?: number; // Optional swallow marker
}

// Output: Aggregated Data Point (One slice of the normalized timeline)
export interface TDSDataPoint {
    timePercent: number; // Integer 0 to 130
    dominanceRates: Record<string, number>; // e.g., { 'cocoa': 0.4, 'acidity': 0.2 ... }
}

// Final Result Payload
export interface AggregatedTDSResult {
    curves: TDSDataPoint[];    // Array of points (0-130)
    chanceLevel: number;       // P0 (Reference Line)
    significanceLevel: number; // Ps (Reference Line)
}

/**
 * Calculate Chance Level (P0)
 * P0 = 1 / numAttributes
 */
export const calculateChanceLevel = (numAttributes: number): number => {
    if (numAttributes === 0) return 0;
    return 1 / numAttributes;
};

/**
 * Calculate Significance Level (Ps)
 * Ps = P0 + 1.645 * sqrt(P0 * (1 - P0) / n)
 */
export const calculateSignificanceLevel = (p0: number, n: number): number => {
    if (n === 0) return 0;
    // Standard Error of proportion
    const standardError = Math.sqrt((p0 * (1 - p0)) / n);
    // 1.645 corresponds to the 95% confidence interval (one-tailed)
    return p0 + (1.645 * standardError);
};

import { TDS_VISUALIZATION } from '../config/sensoryConstants';

/**
 * Apply Gaussian Smoothing
 * Uses a Gaussian kernel to weight neighbors, providing smoother, more organic transitions than SMA.
 * Sigma controls the "width" of the smoothing.
 */
const smoothCurve = (points: TDSDataPoint[], allAttributeIds: string[]): TDSDataPoint[] => {
    const sigma = TDS_VISUALIZATION.SIGMA_MULTIPLE;
    const windowRadius = Math.ceil(sigma * 3); // 3-sigma rule covers ~99.7% of the curve
    const n = points.length;

    // Pre-calculate Gaussian kernel weights for optimization
    // Indices relative to center: -radius to +radius
    const kernel: number[] = [];
    for (let r = -windowRadius; r <= windowRadius; r++) {
        kernel.push(Math.exp(-(r * r) / (2 * sigma * sigma)));
    }

    return points.map((currentPoint, i) => {
        const smoothedRates: Record<string, number> = {};

        allAttributeIds.forEach(attrId => {
            let weightedSum = 0;
            let weightTotal = 0;

            // Convolve
            for (let r = -windowRadius; r <= windowRadius; r++) {
                const neighborIndex = i + r;

                // Edge handling: Truncate
                if (neighborIndex >= 0 && neighborIndex < n) {
                    const kIndex = r + windowRadius; // Index into pre-calc kernel
                    const w = kernel[kIndex];

                    const val = points[neighborIndex].dominanceRates[attrId] || 0;

                    weightedSum += val * w;
                    weightTotal += w;
                }
            }

            // Normalize
            smoothedRates[attrId] = weightTotal > 0 ? weightedSum / weightTotal : 0;
        });

        return {
            timePercent: currentPoint.timePercent,
            dominanceRates: smoothedRates
        };
    });
};

/**
 * Core Algorithm: Aggregate Replications
 * Normalizes time using Two-Phase Logic (Oral: 0-100, Finish: 100-130).
 */
export const aggregateReplications = (replications: TDSReplication[], allAttributeIds: string[]): AggregatedTDSResult => {
    // 0-100% (Oral), 101-130% (Aftertaste) -> Total 131 points
    const numSlices = 131;
    const n = replications.length;

    // 1. Initialize Grid
    // counts[sliceIndex][attrId] = count
    const counts: Record<string, number>[] = Array.from({ length: numSlices }, () => ({}));

    // Initialize counts to 0 for all attributes
    counts.forEach(slice => {
        allAttributeIds.forEach(attrId => {
            slice[attrId] = 0;
        });
    });

    // 2. Iterate Replications (Normalization & Discretization)
    replications.forEach(rep => {
        const duration = rep.duration;
        if (duration <= 0) return; // Skip invalid duration

        // Determining Start Point (Ignore initial silence)
        // t_start = first event start time
        let tStart = 0;
        if (rep.events.length > 0) {
            tStart = rep.events[0].start;
        }

        // Determine Mapping Logic
        const swallowTime = rep.swallowTime;
        const hasValidSwallow = swallowTime !== undefined && swallowTime > tStart && swallowTime < duration;

        // Helper to convert real time 't' to grid index 'i'
        const getNormalizedIndex = (t: number): number => {
            // Clamp time to valid range
            if (t <= tStart) return 0;
            if (t >= duration) return hasValidSwallow ? 130 : 100;

            if (hasValidSwallow) {
                if (t < swallowTime) {
                    // Phase A: Oral (0-100)
                    // Scale (t - tStart) / (swallowTime - tStart) -> 0..100
                    const ratio = (t - tStart) / (swallowTime - tStart);
                    return Math.floor(ratio * 100);
                } else {
                    // Phase B: Aftertaste (101-130)
                    // Scale (t - swallowTime) / (duration - swallowTime) -> 0..30
                    // Add 100 to offset
                    const ratio = (t - swallowTime) / (duration - swallowTime);
                    return 100 + Math.floor(ratio * 30);
                }
            } else {
                // Fallback: Standard Normalization (0-100)
                const ratio = (t - tStart) / (duration - tStart);
                return Math.floor(ratio * 100);
            }
        };

        // Create a 'presence' map for this replication: sliceIndex -> Set<attrId>
        const presence: Set<string>[] = Array.from({ length: numSlices }, () => new Set());

        rep.events.forEach(event => {
            // Get start and end indices on the normalized grid
            const startIndex = getNormalizedIndex(event.start);
            const endIndex = getNormalizedIndex(event.end);

            // Clamp to safe bounds
            const safeStart = Math.max(0, Math.min(numSlices - 1, startIndex));
            const safeEnd = Math.max(0, Math.min(numSlices - 1, endIndex));

            for (let i = safeStart; i <= safeEnd; i++) {
                // Fallback cutoff: If no swallow, don't fill > 100
                if (!hasValidSwallow && i > 100) continue;
                presence[i].add(event.attrId);
            }
        });

        // Now update global counts
        presence.forEach((attrs, i) => {
            attrs.forEach(attrId => {
                if (counts[i][attrId] !== undefined) {
                    counts[i][attrId]++;
                }
            });
        });
    });

    // 3. Dominance Rate Calculation
    const curves: TDSDataPoint[] = counts.map((sliceCounts, index) => {
        const rates: Record<string, number> = {};
        allAttributeIds.forEach(attrId => {
            // Rate = Count / N
            rates[attrId] = n > 0 ? (sliceCounts[attrId] || 0) / n : 0;
        });
        return {
            timePercent: index,
            dominanceRates: rates
        };
    });

    // 4. Smoothing
    const smoothedCurves = smoothCurve(curves, allAttributeIds);

    // 5. Statistical Thresholds
    const p0 = calculateChanceLevel(allAttributeIds.length);
    const ps = calculateSignificanceLevel(p0, n);

    return {
        curves: smoothedCurves,
        chanceLevel: p0,
        significanceLevel: ps
    };
};
