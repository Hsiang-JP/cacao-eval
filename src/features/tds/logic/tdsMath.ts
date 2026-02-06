import { TDSEvent } from '../../../types';
import { CHART_CONSTANTS } from '../../../shared/theme/sensory-theme';

export interface SmoothedPoint {
    time: number;          // Time in seconds
    [attrId: string]: number; // Percentage (0.0 to 1.0)
}

/**
 * generateStreamData
 * Calculates the "Share of Sensation" stream for a single TDS run.
 * Pure function suitable for Worker or Service usage.
 */
export const generateStreamData = (
    events: TDSEvent[],
    totalDuration: number,
    allAttributeIds: string[]
): SmoothedPoint[] => {
    if (!events || events.length === 0 || totalDuration <= 0) return [];

    const data: SmoothedPoint[] = [];
    const resolution = CHART_CONSTANTS.TDS.RESOLUTION || 0.1;
    const sigma = CHART_CONSTANTS.TDS.SIGMA_SINGLE || 2.0;
    const windowRadius = sigma * 3; // 3-sigma rule

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
        const SILENCE_CONSTANT = 0.5; // Keeping hardcoded or import if needed
        const denominator = totalFlavorDensity + SILENCE_CONSTANT;

        allAttributeIds.forEach(attrId => {
            point[attrId] = (densities[attrId] || 0) / denominator;
        });

        data.push(point);
    }

    return data;
};
