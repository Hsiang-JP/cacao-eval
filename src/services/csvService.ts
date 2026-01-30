import { StoredSample } from './dbService';
import { CSV_HEADERS_EN, CSV_HEADERS_ES, INITIAL_ATTRIBUTES, INITIAL_QUALITY_ATTRIBUTES } from '../constants';

export const generateCSVRow = (sample: StoredSample, language: 'en' | 'es'): (string | number)[] => {
    const getDate = () => {
        if (language === 'es' && sample.date) {
            const parts = sample.date.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return sample.date;
    };

    return [
        "", // Original Ordering
        getDate(),
        sample.time,
        sample.evaluator,
        sample.sampleCode,
        sample.sampleInfo,
        sample.attributes.find(a => a.id === 'cacao')?.score || 0,
        // Acidity
        sample.attributes.find(a => a.id === 'acidity')?.score || 0,
        sample.attributes.find(a => a.id === 'acidity')?.subAttributes?.find(s => s.id === 'acid_fruity')?.score || 0,
        sample.attributes.find(a => a.id === 'acidity')?.subAttributes?.find(s => s.id === 'acid_acetic')?.score || 0,
        sample.attributes.find(a => a.id === 'acidity')?.subAttributes?.find(s => s.id === 'acid_lactic')?.score || 0,
        sample.attributes.find(a => a.id === 'acidity')?.subAttributes?.find(s => s.id === 'acid_mineral')?.score || 0,

        sample.attributes.find(a => a.id === 'bitterness')?.score || 0,
        sample.attributes.find(a => a.id === 'astringency')?.score || 0,

        // Fresh Fruit
        sample.attributes.find(a => a.id === 'fresh_fruit')?.score || 0,
        sample.attributes.find(a => a.id === 'fresh_fruit')?.subAttributes?.find(s => s.id === 'ff_berry')?.score || 0,
        sample.attributes.find(a => a.id === 'fresh_fruit')?.subAttributes?.find(s => s.id === 'ff_citrus')?.score || 0,
        sample.attributes.find(a => a.id === 'fresh_fruit')?.subAttributes?.find(s => s.id === 'ff_dark')?.score || 0,
        sample.attributes.find(a => a.id === 'fresh_fruit')?.subAttributes?.find(s => s.id === 'ff_pulp')?.score || 0,
        sample.attributes.find(a => a.id === 'fresh_fruit')?.subAttributes?.find(s => s.id === 'ff_tropical')?.score || 0,

        // Browned Fruit
        sample.attributes.find(a => a.id === 'browned_fruit')?.score || 0,
        sample.attributes.find(a => a.id === 'browned_fruit')?.subAttributes?.find(s => s.id === 'bf_dried')?.score || 0,
        sample.attributes.find(a => a.id === 'browned_fruit')?.subAttributes?.find(s => s.id === 'bf_brown')?.score || 0,
        sample.attributes.find(a => a.id === 'browned_fruit')?.subAttributes?.find(s => s.id === 'bf_overripe')?.score || 0,

        // Vegetal
        sample.attributes.find(a => a.id === 'vegetal')?.score || 0,
        sample.attributes.find(a => a.id === 'vegetal')?.subAttributes?.find(s => s.id === 'veg_green')?.score || 0,
        sample.attributes.find(a => a.id === 'vegetal')?.subAttributes?.find(s => s.id === 'veg_earthy')?.score || 0,

        // Floral
        sample.attributes.find(a => a.id === 'floral')?.score || 0,
        sample.attributes.find(a => a.id === 'floral')?.subAttributes?.find(s => s.id === 'flo_orange')?.score || 0,
        sample.attributes.find(a => a.id === 'floral')?.subAttributes?.find(s => s.id === 'flo_flowers')?.score || 0,

        // Woody
        sample.attributes.find(a => a.id === 'woody')?.score || 0,
        sample.attributes.find(a => a.id === 'woody')?.subAttributes?.find(s => s.id === 'wood_light')?.score || 0,
        sample.attributes.find(a => a.id === 'woody')?.subAttributes?.find(s => s.id === 'wood_dark')?.score || 0,
        sample.attributes.find(a => a.id === 'woody')?.subAttributes?.find(s => s.id === 'wood_resin')?.score || 0,

        // Spice
        sample.attributes.find(a => a.id === 'spice')?.score || 0,
        sample.attributes.find(a => a.id === 'spice')?.subAttributes?.find(s => s.id === 'sp_spices')?.score || 0,
        sample.attributes.find(a => a.id === 'spice')?.subAttributes?.find(s => s.id === 'sp_tobacco')?.score || 0,
        sample.attributes.find(a => a.id === 'spice')?.subAttributes?.find(s => s.id === 'sp_savory')?.score || 0,

        // Nutty
        sample.attributes.find(a => a.id === 'nutty')?.score || 0,
        sample.attributes.find(a => a.id === 'nutty')?.subAttributes?.find(s => s.id === 'nut_meat')?.score || 0,
        sample.attributes.find(a => a.id === 'nutty')?.subAttributes?.find(s => s.id === 'nut_skin')?.score || 0,

        sample.attributes.find(a => a.id === 'caramel')?.score || 0,
        sample.attributes.find(a => a.id === 'sweetness')?.score || 0,
        sample.attributes.find(a => a.id === 'roast')?.score || 0,

        // Defects
        sample.attributes.find(a => a.id === 'defects')?.score || 0,
        sample.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_dirty')?.score || 0,
        sample.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_mold')?.score || 0,
        sample.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_moldy')?.score || 0,
        sample.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_meaty')?.score || 0,
        sample.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_over')?.score || 0,
        sample.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_manure')?.score || 0,
        sample.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_smoke')?.score || 0,
        sample.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_other')?.score || 0,
        `"${(sample.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_other')?.description || '').replace(/"/g, '""')}"`,

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

export const generateShimmedSample = (session: any, language: 'en' | 'es'): StoredSample => {
    // Helper to convert session to StoredSample-like object for export
    return {
        sampleCode: session.metadata.sampleCode,
        date: session.metadata.date,
        time: session.metadata.time,
        evaluator: session.metadata.evaluator,
        evaluationType: session.metadata.evaluationType,
        sampleInfo: session.metadata.sampleInfo,
        notes: session.metadata.notes,
        producerRecommendations: session.metadata.producerRecommendations,
        attributes: session.attributes,
        globalQuality: session.globalQuality,
        selectedQualityId: session.selectedQualityId,
        language: language,
        // Dumb values for rest
        id: 'temp',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
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
            attributes: JSON.parse(JSON.stringify(INITIAL_ATTRIBUTES)) // Deep copy initial
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
