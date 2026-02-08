import { StoredSample } from '../types';
import { CSV_HEADERS_EN, CSV_HEADERS_ES, INITIAL_ATTRIBUTES, INITIAL_QUALITY_ATTRIBUTES, currentConfig } from '../constants';
import { FlavorAttribute, TDSMode, TDSEvent } from '../types';

/**
 * Parse TDS events from JSON.
 */
const parseEventsFromJSON = (json: string): TDSEvent[] => {
    try {
        return JSON.parse(json) as TDSEvent[];
    } catch {
        return [];
    }
};

export const generateCSVRow = (sample: StoredSample, language: 'en' | 'es'): (string | number)[] => {
    return currentConfig.csv.getRow(sample, language);
};



export const parseSamplesFromCSV = (data: any[], language: 'en' | 'es'): Omit<StoredSample, 'id' | 'createdAt' | 'updatedAt'>[] => {
    // attributes and constants should be imported at top level

    // Helper to find value by possible headers (EN or ES)
    const getValue = (row: any, headerEn: string, headerEs: string): string => {
        // Try exact match first
        if (row[headerEn] !== undefined) return row[headerEn];
        if (row[headerEs] !== undefined) return row[headerEs];

        // Try case-insensitive lookup if needed (though PapaParse usually handles exact keys)
        const key = Object.keys(row).find(k => k.trim() === headerEn || k.trim() === headerEs);
        return key ? row[key] : '';
    };

    const getNumber = (row: any, headerEn: string, headerEs: string): number => {
        const val = getValue(row, headerEn, headerEs);
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    // Optimization: Pre-stringify the template to avoid repeated overhead
    const baseAttributesStr = JSON.stringify(INITIAL_ATTRIBUTES);

    return data.map(row => {
        // map base fields
        // Note: evaluationType is not in CSV, defaulting to 'cacao_mass'
        const sample: Omit<StoredSample, 'id' | 'createdAt' | 'updatedAt'> = {
            sampleCode: getValue(row, "CoEx Sample Code", "ID de muestra") || 'Unknown',
            date: getValue(row, "Date Eval (press Ctrl and ;)", "Fecha de evaluación"),
            time: getValue(row, "Time Eval (press Ctrl and :)", "Hora de evaluación"),
            evaluator: getValue(row, "Panelist Initials", "Evaluador"),
            evaluationType: 'cacao_mass',
            sampleInfo: getValue(row, "Sample Information", "Información de muestra"),
            notes: getValue(row, "Overall Flavour comment", "Comentario de sabor general"),
            producerRecommendations: getValue(row, "Feedback comment", "Comentarios de comentarios"),
            globalQuality: getNumber(row, "Global Quality (0 - 10)", "Calidad global (0 - 10)"),
            language: language,
            selectedQualityId: undefined, // Will determine below
            attributes: JSON.parse(baseAttributesStr) // Faster cloning
        };

        // If date is in DD/MM/YYYY format (from Spanish export or Excel), convert to YYYY-MM-DD
        if (sample.date && sample.date.includes('/')) {
            const parts = sample.date.split('/');
            if (parts.length === 3) {
                // Assume DD/MM/YYYY
                sample.date = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        // Map Attributes
        sample.attributes.forEach((attr: FlavorAttribute) => {
            attr.score = getNumber(row, attr.csvHeaderEn, attr.csvHeaderEs);

            if (attr.subAttributes) {
                attr.subAttributes.forEach((sub: any) => {
                    sub.score = getNumber(row, sub.csvHeaderEn, sub.csvHeaderEs);

                    // Special case for "Other Off-Flavour" description
                    if (sub.id === 'def_other') {
                        sub.description = getValue(row, "Other Off-Flavour Description", "Descripción");
                    }
                });
            }
        });

        // Determine Selected Quality (find the one with score 10, or max score)
        let maxQualityScore = 0;
        let selectedQualityId = undefined;

        INITIAL_QUALITY_ATTRIBUTES.forEach((q) => {
            const score = getNumber(row, q.csvHeaderEn, q.csvHeaderEs);
            if (score > maxQualityScore) {
                maxQualityScore = score;
                selectedQualityId = q.id;
            }
        });

        // Only set if we found a positive score (likely 10)
        if (maxQualityScore > 0) {
            sample.selectedQualityId = selectedQualityId;
        }

        // TDS Data Parsing
        const tdsModeStr = getValue(row, "TDS Mode", "Modo TDS");
        if (tdsModeStr && (tdsModeStr === 'normal' || tdsModeStr === 'expert')) {
            const tdsEventsJson = getValue(row, "TDS Events JSON", "Eventos TDS JSON");
            const events = parseEventsFromJSON(tdsEventsJson);

            if (events.length > 0) {
                sample.tdsProfile = {
                    id: crypto.randomUUID(),
                    mode: tdsModeStr as TDSMode,
                    totalDuration: getNumber(row, "TDS Total Duration (s)", "Duración Total TDS (s)"),
                    swallowTime: getNumber(row, "TDS Swallow Time (s)", "Tiempo de Tragado TDS (s)"),
                    events: events
                };
            }
        }

        return sample;
    }).filter(s => s.sampleCode && s.sampleCode !== 'Unknown'); // Filter empty rows
};
