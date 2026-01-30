import { StoredSample } from './dbService';
import { CSV_HEADERS_EN, CSV_HEADERS_ES, INITIAL_ATTRIBUTES, INITIAL_QUALITY_ATTRIBUTES } from '../constants';
import { FlavorAttribute } from '../types';

export const generateCSVRow = (sample: StoredSample, language: 'en' | 'es'): (string | number)[] => {
    const getDate = () => {
        if (language === 'es' && sample.date) {
            const parts = sample.date.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return sample.date;
    };

    // 1. Create a Map for O(1) attribute access
    const attrMap = new Map<string, FlavorAttribute>();
    sample.attributes.forEach(attr => attrMap.set(attr.id, attr));

    // 2. Helper to get scores safely
    const getScore = (attrId: string, subId?: string): number => {
        const attr = attrMap.get(attrId);
        if (!attr) return 0;
        if (subId && attr.subAttributes) {
            return attr.subAttributes.find(s => s.id === subId)?.score || 0;
        }
        return attr.score;
    };

    // 3. Helper to get sub-attribute description safely
    const getDescription = (attrId: string, subId: string): string => {
        const attr = attrMap.get(attrId);
        return attr?.subAttributes?.find(s => s.id === subId)?.description || '';
    };

    // 4. Construct the row
    return [
        "", // Original Ordering
        getDate(),
        sample.time,
        sample.evaluator,
        sample.sampleCode,
        sample.sampleInfo,
        getScore('cacao'),

        // Acidity
        getScore('acidity'),
        getScore('acidity', 'acid_fruity'),
        getScore('acidity', 'acid_acetic'),
        getScore('acidity', 'acid_lactic'),
        getScore('acidity', 'acid_mineral'),

        getScore('bitterness'),
        getScore('astringency'),

        // Fresh Fruit
        getScore('fresh_fruit'),
        getScore('fresh_fruit', 'ff_berry'),
        getScore('fresh_fruit', 'ff_citrus'),
        getScore('fresh_fruit', 'ff_dark'),
        getScore('fresh_fruit', 'ff_pulp'),
        getScore('fresh_fruit', 'ff_tropical'),

        // Browned Fruit
        getScore('browned_fruit'),
        getScore('browned_fruit', 'bf_dried'),
        getScore('browned_fruit', 'bf_brown'),
        getScore('browned_fruit', 'bf_overripe'),

        // Vegetal
        getScore('vegetal'),
        getScore('vegetal', 'veg_green'),
        getScore('vegetal', 'veg_earthy'),

        // Floral
        getScore('floral'),
        getScore('floral', 'flo_orange'),
        getScore('floral', 'flo_flowers'),

        // Woody
        getScore('woody'),
        getScore('woody', 'wood_light'),
        getScore('woody', 'wood_dark'),
        getScore('woody', 'wood_resin'),

        // Spice
        getScore('spice'),
        getScore('spice', 'sp_spices'),
        getScore('spice', 'sp_tobacco'),
        getScore('spice', 'sp_savory'),

        // Nutty
        getScore('nutty'),
        getScore('nutty', 'nut_meat'),
        getScore('nutty', 'nut_skin'),

        getScore('caramel'),
        getScore('sweetness'),
        getScore('roast'),

        // Defects
        getScore('defects'),
        getScore('defects', 'def_dirty'),
        getScore('defects', 'def_mold'),
        getScore('defects', 'def_moldy'),
        getScore('defects', 'def_meaty'),
        getScore('defects', 'def_over'),
        getScore('defects', 'def_manure'),
        getScore('defects', 'def_smoke'),
        getScore('defects', 'def_other'),
        `"${getDescription('defects', 'def_other').replace(/"/g, '""')}"`,

        `"${sample.notes.replace(/"/g, '""')}"`,
        `"${sample.producerRecommendations.replace(/"/g, '""')}"`,
        sample.globalQuality,
        sample.selectedQualityId === 'uniqueness' ? 10 : 0,
        sample.selectedQualityId === 'complexity' ? 10 : 0,
        sample.selectedQualityId === 'balance' ? 10 : 0,
        sample.selectedQualityId === 'cleanliness' ? 10 : 0,
        sample.selectedQualityId === 'q_acidity' ? 10 : 0,
        sample.selectedQualityId === 'q_astringency' ? 10 : 0,
        sample.selectedQualityId === 'q_bitterness' ? 10 : 0,
        sample.selectedQualityId === 'q_aftertaste' ? 10 : 0,
    ];
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
        sample.attributes.forEach((attr: any) => {
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

        INITIAL_QUALITY_ATTRIBUTES.forEach((q: any) => {
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

        return sample;
    }).filter(s => s.sampleCode && s.sampleCode !== 'Unknown'); // Filter empty rows
};
