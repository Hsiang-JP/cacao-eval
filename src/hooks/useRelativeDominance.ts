import { useMemo } from 'react';
import { TDSEvent } from '../types';

export interface SmoothedPoint {
    time: number;          // Time in seconds
    [attrId: string]: number; // Percentage (0.0 to 1.0)
}

/**
 * useRelativeDominance
 * Calculates the "Share of Sensation" stream for a single TDS run.
 * 
 * Algorithm:
 * 1. Discretize time (resolution 0.1s).
 * 2. Apply Gaussian Smoothing (Sigma=3.0s) to each event.
 * 3. Normalize at each time step so total = 100%.
 */
import { TDS_VISUALIZATION } from '../config/sensoryConstants';

export const useRelativeDominance = (
    events: TDSEvent[],
    totalDuration: number,
    allAttributeIds: string[]
) => {
    return useMemo(() => {
        if (!events || events.length === 0 || totalDuration <= 0) return [];

        const data: SmoothedPoint[] = [];
        const resolution = 0.1; // 100ms step
        const sigma = TDS_VISUALIZATION.SIGMA_SINGLE; // Smoothing factor
        const windowRadius = sigma * 3; // 3-sigma rule

        const SILENCE_CONSTANT = TDS_VISUALIZATION.SILENCE_CONSTANT; // Controls taper effect

        // 1. Loop through time (0s to End)
        for (let t = 0; t <= totalDuration; t += resolution) {
            const point: SmoothedPoint = { time: parseFloat(t.toFixed(1)) };
            let totalFlavorDensity = 0;
            const densities: Record<string, number> = {};

            // Initialize all densities to 0
            allAttributeIds.forEach(id => densities[id] = 0);

            // 2. Calculate Raw Gaussian Density for active events near this timestamp
            events.forEach(ev => {
                // Optimization: Only calc if t is within meaningful range of the event
                let dist = 0;
                if (t < ev.start) {
                    dist = ev.start - t;
                } else if (t > ev.end) {
                    dist = t - ev.end;
                } else {
                    dist = 0; // Inside the event
                }

                if (dist <= windowRadius) {
                    // Gaussian function: e^(-x^2 / 2sigma^2)
                    const density = Math.exp(-(dist * dist) / (2 * sigma * sigma));

                    if (!densities[ev.attrId]) densities[ev.attrId] = 0;
                    densities[ev.attrId] += density;
                    totalFlavorDensity += density;
                }
            });

            // 3. Normalized Damping ("Silence Taper")
            // Instead of normalizing against totalFlavorDensity (which forces 100% height even for tiny values),
            // we normalize against (totalFlavorDensity + SILENCE_CONSTANT).
            // This creates a "Noise Floor" where silence dominates if signal is weak.
            const denominator = totalFlavorDensity + SILENCE_CONSTANT;

            allAttributeIds.forEach(attrId => {
                point[attrId] = (densities[attrId] || 0) / denominator;
            });

            data.push(point);
        }

        return data;
    }, [events, totalDuration, allAttributeIds.join(',')]);
};
