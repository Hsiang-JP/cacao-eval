/**
 * TDS Calculator - Modularized Wrapper
 * 
 * Delegates logic to the active configuration (currentConfig.tds.analyze).
 * Exports constants from config for backward compatibility.
 */

import { TDSProfile, TDSAnalysisResult, StoredSample } from '../types';
import { currentConfig } from '../constants';

// Re-export constants for UI consumers (mapped from config)
export const CORE_ATTRIBUTES = currentConfig.meta.primaryAttributeIds;
export const DEFECT_ATTRIBUTES = currentConfig.meta.defectAttributeIds;

// For backward compatibility if used, though ideally should be removed or driven by config too
// Using "attributes" from config excluding core and defects to approximate "complementary"
// or just re-exporting specific ones if needed.
// For now, let's derive it or define it if essential consumers exist.
// Checking cacao.ts, we had 'fresh_fruit', 'browned_fruit', 'vegetal', 'floral', 'woody', 'spice', 'nutty', 'caramel', 'sweetness'
export const COMPLEMENTARY_ATTRIBUTES = currentConfig.attributes
    .map(a => a.id)
    .filter(id => !CORE_ATTRIBUTES.includes(id) && !DEFECT_ATTRIBUTES.includes(id));

export const ALL_ATTRIBUTES = [...CORE_ATTRIBUTES, ...COMPLEMENTARY_ATTRIBUTES, ...DEFECT_ATTRIBUTES];

/**
 * Complete TDS analysis via Config
 */
export const analyzeTDS = (profile: TDSProfile): TDSAnalysisResult => {
    return currentConfig.tds.analyze(profile);
};

// Helper for UI/Export if needed (applyTDSScoresToAttributes)
// This was generic enough to stay, or can be moved. 
// It was at the end of the file.
import { FlavorAttribute, TDSScoreResult } from '../types';

export const applyTDSScoresToAttributes = (
    attributes: FlavorAttribute[],
    tdsScores: Map<string, TDSScoreResult>
): FlavorAttribute[] => {
    return attributes.map(attr => {
        const tdsResult = tdsScores.get(attr.id);
        if (tdsResult !== undefined) {
            return { ...attr, score: tdsResult.score };
        }
        return attr;
    });
};

// Helper to export TDS intervals as JSON (Moved from csvService)
export const getTDSIntervalsJson = (sample: StoredSample, attrId: string): string => {
    if (!sample.tdsProfile?.events) return '';
    const events = sample.tdsProfile.events.filter(e => e.attrId === attrId);
    if (events.length === 0) return '';

    const intervals = events.map(e => ({
        start: Math.round(e.start * 100) / 100,
        end: Math.round(e.end * 100) / 100
    }));

    // Return JSON string escaped for CSV
    return `"${JSON.stringify(intervals).replace(/"/g, '""')}"`;
};





