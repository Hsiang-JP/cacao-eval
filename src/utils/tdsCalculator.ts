/**
 * TDS Calculator - Advanced Scientific Implementation
 * 
 * Features:
 * 1. 3-Phase Weighted Algorithm (Attack/Body/Finish zones)
 * 2. Parent-Child Hierarchical Aggregation for Expert mode
 * 3. Mode-specific sensitivity thresholds
 * 4. CoEx Guidelines compliance
 */

import { TDSEvent, TDSProfile, TDSMode, FlavorAttribute, TDSScoreResult, TDSAnalysisResult } from '../types';

// ============================================================================
// CONFIGURATION: Parent-Child Aggregation Groups
// ============================================================================

/**
 * Maps Expert mode attributes (children) to Core attributes (parents).
 * When calculating Core scores in Expert mode, child durations are added to parent.
 */
export const PARENT_CHILD_MAPPING: Record<string, string[]> = {
    // Acidity = Acidity + Fresh Fruit (citrus, berry, tropical)
    acidity: ['acidity', 'fresh_fruit'],
    // Cocoa = Cocoa + Browned Fruit + Nutty + Sweetness (often sweet cacao)
    cacao: ['cacao', 'browned_fruit', 'nutty'], // Keep standard for now, user can request specifics
    // Roast = Roast + Caramel (thermal process indicators)
    roast: ['roast', 'caramel'],
    // Bitterness = Bitterness + Vegetal + Woody
    bitterness: ['bitterness', 'vegetal', 'woody'],
    // Astringency = Astringency + Spice (drying notes)
    astringency: ['astringency', 'spice'],
};

// Core attributes (CoEx standard 5)
export const CORE_ATTRIBUTES = ['cacao', 'acidity', 'bitterness', 'astringency', 'roast'];

// Complementary attributes
export const COMPLEMENTARY_ATTRIBUTES = [
    'fresh_fruit', 'browned_fruit', 'vegetal', 'floral',
    'woody', 'spice', 'nutty', 'caramel', 'sweetness'
];

// Defect attributes
export const DEFECT_ATTRIBUTES = ['defects'];

// All Expert mode attributes
export const ALL_ATTRIBUTES = [...CORE_ATTRIBUTES, ...COMPLEMENTARY_ATTRIBUTES, ...DEFECT_ATTRIBUTES];

// ============================================================================
// CONFIGURATION: Mode-Specific Thresholds (Non-Linear Mapping)
// ============================================================================

/**
 * Scientific Rationale:
 * - "Attention vs. Duration": Special attributes (figures) pop up against background (core).
 * - "Chance Level": 1/15 ≈ 6.67%. Special attributes >6.7% are statistically significant.
 * 
 * Categories:
 * - Type A (Core): Low Sensitivity (Linear). 50% duration ≈ Score 7. Always present (Default 1).
 * - Type B (Special): High Sensitivity (Logarithmic). 15% duration ≈ Score 6.
 * - Defect: Highest Sensitivity. Any presence is penalized.
 */

/**
 * Linear interpolation helper.
 * Maps a value from one range to another.
 */
const mapRange = (
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number => {
    const clamped = Math.max(inMin, Math.min(inMax, value));
    return outMin + ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin);
};

/**
 * Map duration percentage to CoEx score using Category-Specific Scaling.
 */
/**
 * Map duration percentage to CoEx score using Category-Specific Scaling.
 */
const mapDurationToScore = (
    durationPercent: number,
    category: 'core' | 'complementary' | 'defect',
    mode: 'normal' | 'expert' = 'expert'
): number => {

    // -------------------------------------------------------------------------
    // 1. Defect Attributes (Always use Table 3)
    // -------------------------------------------------------------------------
    // CSV RULES:
    // 0%           -> 0 (Absent)
    // 0.1% - 3.0%  -> 1 (Flash / Trace)
    // 3.1% - 6.6%  -> 2 (Present)
    // > 6.7%       -> > 3 (Significant)
    if (category === 'defect') {
        if (durationPercent === 0) return 0;
        if (durationPercent <= 3.0) return 1;
        if (durationPercent <= 6.6) return 2;

        // > 6.7%: "Significant (>3)". We extrapolate for high intensity.
        // 6.7 - 15% -> 3 - 5
        if (durationPercent <= 15) return Math.round(mapRange(durationPercent, 6.7, 15, 3, 5));
        // 16 - 30% -> 6 - 8
        if (durationPercent <= 30) return Math.round(mapRange(durationPercent, 16, 30, 6, 8));
        // > 30% -> 9 - 10
        return Math.round(mapRange(durationPercent, 31, 60, 9, 10)); // Cap at 60%
    }

    // -------------------------------------------------------------------------
    // 2. Normal Mode - Core Attributes (Table 4)
    // -------------------------------------------------------------------------
    // CSV RULES:
    // 0 - 1.5%     -> 0
    // 1.6% - 10%   -> 1
    // 11% - 19%    -> 2
    // 20% - 35%    -> 3 - 4
    // 36% - 60%    -> 5 - 7
    // > 60%        -> 8 - 10
    if (mode === 'normal' && category === 'core') {
        if (durationPercent <= 1.5) return 0;
        if (durationPercent <= 10) return 1;
        if (durationPercent <= 19) return 2;
        if (durationPercent <= 35) return Math.round(mapRange(durationPercent, 20, 35, 3, 4));
        if (durationPercent <= 60) return Math.round(mapRange(durationPercent, 36, 60, 5, 7));
        // > 60% -> 8 - 10
        return Math.round(mapRange(durationPercent, 61, 90, 8, 10)); // Soft cap at 90%
    }

    // -------------------------------------------------------------------------
    // 3. Expert Mode - Complementary Attributes
    // -------------------------------------------------------------------------
    // CSV RULES:
    // < 1.5%       -> 0 (Motor Noise)
    // 1.5% - 4.0%  -> 1 (Trace)
    // 4.1% - 6.6%  -> 2 (Trace/Present)
    // 6.7% - 15%   -> 3 - 4 (Significance / Characterizing)
    // 16% - 30%    -> 5 - 7 (Dominant)
    // > 30%        -> 8 - 10 (High Dominance)
    if (category === 'complementary') {
        if (durationPercent < 1.5) return 0;
        if (durationPercent <= 4.0) return 1;
        if (durationPercent <= 6.6) return 2;

        if (durationPercent <= 15) return Math.round(mapRange(durationPercent, 6.7, 15, 3, 4));
        if (durationPercent <= 30) return Math.round(mapRange(durationPercent, 16, 30, 5, 7));

        // > 30%: 8 - 10
        return Math.round(mapRange(durationPercent, 31, 60, 8, 10)); // Cap at 60%
    }

    // -------------------------------------------------------------------------
    // 4. Expert Mode - Core Attributes
    // -------------------------------------------------------------------------
    // CSV RULES:
    // < 2.0%       -> 0 (Motor Noise)
    // 2.0% - 6.6%  -> 1 (Sub-Threshold / Trace)
    // 6.7% - 20%   -> 2 - 3 (Significant / Characterizing)
    // 21% - 40%    -> 4 - 6 (Dominant)
    // > 40%        -> 7 - 10 (High Dominance)

    // < 2.0% -> 0
    if (durationPercent < 2.0) return 0;

    // 2.0% - 6.6% -> 1
    if (durationPercent <= 6.6) return 1;

    // 6.7% - 20% -> 2 - 3
    if (durationPercent <= 20) return Math.round(mapRange(durationPercent, 6.7, 20, 2, 3));

    // 21% - 40% -> 4 - 6
    if (durationPercent <= 40) return Math.round(mapRange(durationPercent, 21, 40, 4, 6));

    // > 40% -> 7 - 10
    // We assume linear up to 100% or a cap. Let's use 80% as a soft cap for 10.
    return Math.round(mapRange(durationPercent, 41, 80, 7, 10));
};

// ============================================================================
// CONFIGURATION: 3-Phase Zone Definitions
// ============================================================================

/**
 * Zones normalized to Swallow event (T_swallow = 1.0)
 * Zone 1 (Attack):  0.0 - 0.2 → Aroma
 * Zone 2 (Body):    0.2 - 1.0 → Main Flavor
 * Zone 3 (Finish):  > 1.0     → Aftertaste
 */
const ZONES = {
    attack: { start: 0, end: 0.2 },
    body: { start: 0.2, end: 1.0 },
    finish: { start: 1.0, end: Infinity },
};

// ============================================================================
// TYPES
// ============================================================================

export interface ZoneAnalysis {
    attack: Map<string, number>;
    body: Map<string, number>;
    finish: Map<string, number>;
}

// ============================================================================
// CORE ZONE FUNCTIONS
// ============================================================================

/**
 * Normalize time to swallow event.
 */
const normalizeTime = (time: number, swallowTime: number): number => {
    if (swallowTime === 0) return time > 0 ? 1.0 : 0;
    return time / swallowTime;
};

/**
 * Split event into zone segments and calculate duration in each.
 */
const splitEventByZones = (
    event: TDSEvent,
    swallowTime: number
): { attack: number; body: number; finish: number } => {
    const startNorm = normalizeTime(event.start, swallowTime);
    const endNorm = normalizeTime(event.end, swallowTime);
    const result = { attack: 0, body: 0, finish: 0 };

    if (startNorm < ZONES.attack.end && endNorm > ZONES.attack.start) {
        const overlapStart = Math.max(startNorm, ZONES.attack.start);
        const overlapEnd = Math.min(endNorm, ZONES.attack.end);
        result.attack = (overlapEnd - overlapStart) * swallowTime;
    }
    if (startNorm < ZONES.body.end && endNorm > ZONES.body.start) {
        const overlapStart = Math.max(startNorm, ZONES.body.start);
        const overlapEnd = Math.min(endNorm, ZONES.body.end);
        result.body = (overlapEnd - overlapStart) * swallowTime;
    }
    if (endNorm > ZONES.finish.start) {
        const overlapStart = Math.max(startNorm, ZONES.finish.start);
        result.finish = (endNorm - overlapStart) * swallowTime;
    }
    return result;
};

/**
 * Analyze events by zone for all attributes.
 */
const analyzeByZone = (events: TDSEvent[], swallowTime: number): ZoneAnalysis => {
    const attack = new Map<string, number>();
    const body = new Map<string, number>();
    const finish = new Map<string, number>();

    for (const event of events) {
        const zones = splitEventByZones(event, swallowTime);
        attack.set(event.attrId, (attack.get(event.attrId) || 0) + zones.attack);
        body.set(event.attrId, (body.get(event.attrId) || 0) + zones.body);
        finish.set(event.attrId, (finish.get(event.attrId) || 0) + zones.finish);
    }
    return { attack, body, finish };
};



/**
 * Complete TDS analysis with 3-phase zones and hierarchical aggregation.
 */
export const analyzeTDS = (profile: TDSProfile): TDSAnalysisResult => {
    const { events, swallowTime: rawSwallowTime, totalDuration: rawTotalDuration, mode } = profile;

    // Fallback: If no swallow time recorded, use total duration (User clicked Finish directly)
    const effectiveSwallowTime = (rawSwallowTime === null || rawSwallowTime === 0) ? rawTotalDuration : rawSwallowTime;
    const effectiveTotalDuration = rawTotalDuration;

    // -------------------------------------------------------------------------
    // 0. Silence Filter (Scientific Nuance)
    // -------------------------------------------------------------------------
    // Remove mechanical lag.
    let startTime = 0;
    if (events.length > 0) {
        startTime = Math.min(...events.map(e => e.start));
    }

    // Adjust timings relative to effective start
    // If fallback was used, effectiveSwallowTime IS rawTotalDuration.
    const swallowTime = Math.max(0, effectiveSwallowTime - startTime);
    const totalDuration = Math.max(0, effectiveTotalDuration - startTime);

    // Adjust events relative to effective start
    const adjustedEvents = events.map(e => ({
        ...e,
        start: Math.max(0, e.start - startTime),
        end: Math.max(0, e.end - startTime)
    }));

    // Analyze by zone using adjusted timings
    const zones = analyzeByZone(adjustedEvents, swallowTime);

    // Calculate zone durations
    const attackDuration = swallowTime * 0.2;
    const bodyDuration = swallowTime * 0.8;
    // Post-swallow duration. 
    // IF fallback used: totalDuration == swallowTime => finishDuration = 0. Correct.
    const finishDuration = Math.max(0, totalDuration - swallowTime);

    // -------------------------------------------------------------------------
    // 1. Individual Attribute Scores (BASE SCORE: Attack + Body)
    // -------------------------------------------------------------------------
    const scores = new Map<string, TDSScoreResult>();
    // Normal mode includes Core + Defects (always important)
    const allAttrs = mode === 'normal' ? [...CORE_ATTRIBUTES, ...DEFECT_ATTRIBUTES] : ALL_ATTRIBUTES;

    for (const attrId of allAttrs) {
        const bodyTime = zones.body.get(attrId) || 0;
        const attackTime = zones.attack.get(attrId) || 0;
        const finishTime = zones.finish.get(attrId) || 0;

        // Base Calculation: Dominance during "In-Mouth" phase (Attack + Body)
        // Denominator is SwallowTime (100% of oral processing)
        const inMouthTime = attackTime + bodyTime;
        const durationPercent = swallowTime > 0 ? (inMouthTime / swallowTime) * 100 : 0;

        const isDefect = DEFECT_ATTRIBUTES.includes(attrId);
        const isCore = CORE_ATTRIBUTES.includes(attrId);
        const category = isDefect ? 'defect' : isCore ? 'core' : 'complementary';

        let score = mapDurationToScore(durationPercent, category, mode);
        const originalScore = score;
        let boostDetails: { amount: number; duration: number; type: 'individual' | 'aggregated'; reason?: 'aftertaste' | 'composition' | 'mixed' } | undefined = undefined;

        // -------------------------------------------------------------------------
        // 2. Post-Swallow Boost (The Finish)
        // -------------------------------------------------------------------------
        // "If an attribute is dominant for a significant duration in the aftertaste..."

        // Calculate Finish Dominance % (Relative to Finish Phase Duration if > 5s, else 0)
        // Let's use absolute seconds for stability.

        if (finishDuration > 5 && finishTime > 0) { // Only boost if finish phase was meaningful

            // Criteria 1: Significant Presence (> 5 seconds) -> Small Boost (+1)
            // Criteria 2: Major Dominance (> 10 seconds) -> Large Boost (+2)
            // Criteria 3: Dominance % of Aftertaste Phase (> 30%) -> Boost (+1)

            let accumulatedBoost = 0;
            const finishPercent = (finishTime / finishDuration) * 100;

            if (finishTime > 10) accumulatedBoost += 2;
            else if (finishTime > 5) accumulatedBoost += 1;

            // Additional boost for dominating the aftertaste context
            if (finishPercent > 50) accumulatedBoost += 1;

            if (accumulatedBoost > 0) {
                // Apply boost as recommendation ONLY (Do not modify score)
                boostDetails = {
                    amount: accumulatedBoost,
                    duration: Math.round(finishTime * 10) / 10,
                    type: 'individual',
                    reason: 'aftertaste'
                };
            }
        }

        // Recalculate full duration including finish for visibility
        const totalRaw = inMouthTime + finishTime;

        // Sanity Check: Ensure in-mouth percentage doesn't exceed 100% due to floating point or rare edge cases
        const finalDurationPercent = Math.min(durationPercent, 100);

        scores.set(attrId, {
            score,
            durationPercent: Math.round(finalDurationPercent * 10) / 10,
            totalDuration: Math.round(totalRaw * 10) / 10,
            isPresent: totalRaw > 0.05, // Lower threshold to catch quick clicks
            isFlagged: isCore && finalDurationPercent === 0,
            category,
            originalScore: undefined,
            boostDetails,
            zoneBreakdown: {
                attack: attackDuration > 0 ? Math.round((attackTime / attackDuration) * 1000) / 10 : 0,
                body: bodyDuration > 0 ? Math.round((bodyTime / bodyDuration) * 1000) / 10 : 0,
                finish: finishDuration > 0 ? Math.round((finishTime / finishDuration) * 1000) / 10 : 0,
            }
        });
    }

    // -------------------------------------------------------------------------
    // 3. Aggregated Core Scores (Expert mode Parent-Child)
    // -------------------------------------------------------------------------
    // Note: Expert mode Core Scores also need boost logic!
    const coreScores = new Map<string, TDSScoreResult>();

    if (mode === 'expert') {
        for (const coreAttr of CORE_ATTRIBUTES) {
            // 1. Calculate Score based ONLY on the Core Attribute itself
            const selfBody = zones.body.get(coreAttr) || 0;
            const selfAttack = zones.attack.get(coreAttr) || 0;
            const selfTotal = selfBody + selfAttack;

            // -------------------------------------------------------------------------
            // 3a. Parent-Child Aggregation (Expert Mode)
            // -------------------------------------------------------------------------
            // "Specific notes contribute to broader categories automatically."

            const children = PARENT_CHILD_MAPPING[coreAttr] || [];
            let childDuration = 0;
            let childFinishTotal = 0;
            let childBoost = 0;

            const activeChildren: string[] = [];

            if (children.length > 0) {
                // Sum duration of valid child attributes
                for (const childId of children) {
                    const cBody = zones.body.get(childId) || 0;
                    const cAttack = zones.attack.get(childId) || 0;
                    childDuration += (cBody + cAttack);

                    if (cBody + cAttack > 0) activeChildren.push(childId);

                    // Child Boost (Aftertaste)
                    const cFinish = zones.finish.get(childId) || 0;
                    if (finishDuration > 5 && cFinish > 0) {
                        childFinishTotal += cFinish; // Accumulate finish duration

                        // "If a child attribute lingers... it boosts the parent."
                        let cb = 0;
                        if (cFinish > 10) cb += 2;
                        else if (cFinish > 5) cb += 1;
                        if ((cFinish / finishDuration) > 0.5) cb += 1; // Dominant finish

                        if (cb > 0) childBoost += cb;
                    }
                }
            }

            // TOTAL Duration
            // UPDATED: No Parent-Child Aggregation for Scores. 
            // Child durations are used for Boosts only.
            // totalDuration = selfTotal.
            const totalDuration = selfTotal;
            const finalDurationPercent = swallowTime > 0 ? (totalDuration / swallowTime) * 100 : 0;

            // Map Score (Expert logic handles aggregation, but score mapping itself is standard Expert Core)
            let score = mapDurationToScore(finalDurationPercent, 'core', 'expert');
            const originalScore = score; // Track original before modifications

            // -------------------------------------------------------------------------
            // 3b. Boost Calculations (Parent-Child)
            // -------------------------------------------------------------------------

            let boostDetails: { amount: number; duration: number; type: 'individual' | 'aggregated'; reason?: 'aftertaste' | 'composition' | 'mixed' } | undefined = undefined;
            let accumulatedBoost = 0;
            let boostFromAftertaste = 0;

            // Boost Logic ... (Existing)
            const selfFinish = zones.finish.get(coreAttr) || 0;
            if (finishDuration > 5 && selfFinish > 0) {
                // ... logic
            }
            // ... (rest of boost logic)

            // Update Map
            if (coreScores.has(coreAttr)) {
                coreScores.set(coreAttr, {
                    ...coreScores.get(coreAttr)!,
                    score,
                    durationPercent: Math.round(finalDurationPercent * 10) / 10,
                    totalDuration: Math.round(totalDuration * 10) / 10,
                    isPresent: totalDuration > 0, // Ensure visibility if any duration exists
                    originalScore
                });
            }


            coreScores.set(coreAttr, {
                score,
                durationPercent: Math.round(finalDurationPercent * 10) / 10,
                isFlagged: finalDurationPercent === 0, // Flag if 0
                category: 'core',
                originalScore: undefined,
                boostDetails
            });
        }
    } else {
        // Normal mode: Core scores are direct
        for (const coreAttr of CORE_ATTRIBUTES) {
            const existing = scores.get(coreAttr);
            if (existing) {
                coreScores.set(coreAttr, existing);
            } else {
                coreScores.set(coreAttr, {
                    score: 1,
                    durationPercent: 0,
                    isFlagged: true,
                    category: 'core',
                });
            }
        }
    }

    // -------------------------------------------------------------------------
    // 4. Aroma Analysis (Attack Zone)
    // -------------------------------------------------------------------------
    const aromaNotes: string[] = [];
    let maxAttackPercent = 0;

    for (const [attrId, duration] of zones.attack) {
        const percent = attackDuration > 0 ? (duration / attackDuration) * 100 : 0;
        if (percent > 10) {
            aromaNotes.push(attrId);
        }
        if (percent > maxAttackPercent) {
            maxAttackPercent = percent;
        }
    }

    // Aroma intensity
    let aromaIntensity = 3;
    if (maxAttackPercent > 50) aromaIntensity = 8;
    else if (maxAttackPercent > 30) aromaIntensity = 7;
    else if (maxAttackPercent > 20) aromaIntensity = 6;
    else if (maxAttackPercent > 10) aromaIntensity = 5;
    else if (maxAttackPercent > 5) aromaIntensity = 4;
    else if (maxAttackPercent === 0) aromaIntensity = 2;

    // -------------------------------------------------------------------------
    // 5. Aftertaste Analysis (Finish Zone)
    // -------------------------------------------------------------------------
    let maxFinishPercent = 0;
    let dominantFinishAttr: string | null = null;

    for (const [attrId, duration] of zones.finish) {
        const percent = finishDuration > 0 ? (duration / finishDuration) * 100 : 0;
        if (percent > maxFinishPercent) {
            maxFinishPercent = percent;
            dominantFinishAttr = attrId;
        }
    }

    // Aftertaste intensity
    let aftertasteIntensity = 3;
    if (maxFinishPercent > 60) aftertasteIntensity = 8;
    else if (maxFinishPercent > 40) aftertasteIntensity = 7;
    else if (maxFinishPercent > 25) aftertasteIntensity = 6;
    else if (maxFinishPercent > 15) aftertasteIntensity = 5;
    else if (maxFinishPercent > 5) aftertasteIntensity = 4;

    // Aftertaste quality - positive if pleasant flavors linger
    const positiveAttrs = ['cacao', 'fresh_fruit', 'browned_fruit', 'floral', 'caramel', 'sweetness', 'nutty'];
    const negativeAttrs = ['defects', 'astringency', 'bitterness'];

    let aftertasteQuality: 'positive' | 'neutral' | 'negative' = 'neutral';

    // Clean Finish Logic
    // If finish drops to zero quickly (finishDuration short OR maxFinishPercent low)
    if (finishDuration > 2 && maxFinishPercent < 10) {
        // "Clean Finish"
        aftertasteQuality = 'positive';
    } else if (dominantFinishAttr) {
        if (positiveAttrs.includes(dominantFinishAttr)) aftertasteQuality = 'positive';
        else if (negativeAttrs.includes(dominantFinishAttr)) aftertasteQuality = 'negative';
    }

    // -------------------------------------------------------------------------
    // 6. Global Quality Modifier & Recommendation System
    // -------------------------------------------------------------------------
    let qualityModifier = 0;
    if (aftertasteQuality === 'positive') qualityModifier += 0.5; // Lingering pleasant or Clean
    if (aftertasteQuality === 'negative') qualityModifier -= 1.5; // Punish lingering negative
    if (aromaIntensity >= 7) qualityModifier += 0.5;

    // Recommendation System: Initial Kick (0-20%)
    const kickSuggestions: { en: string; es: string }[] = [];
    const kickThreshold = attackDuration * 0.5; // 50% of zone 1

    if (zones.attack.size > 0) {
        // Logic 1: Acidity -> Fresh Fruit
        if ((zones.attack.get('acidity') || 0) > kickThreshold) {
            kickSuggestions.push({
                en: "High acidity in the attack often indicates Fruit notes. Did you perceive Citrus (Lemon/Lime) or Berry?",
                es: "Alta acidez en el ataque a menudo indica notas frutales. ¿Percibiste cítricos (limón/lima) o bayas?"
            });
        }
        // Logic 2: Bitterness -> Vegetal or Roast
        if ((zones.attack.get('bitterness') || 0) > kickThreshold) {
            kickSuggestions.push({
                en: "Strong early bitterness can indicate 'Green/Vegetal' notes (if raw) or 'Coffee/Burnt' notes (if roasted). Check these categories.",
                es: "Un fuerte amargor inicial puede indicar notas 'Verdes/Vegetales' (si es crudo) o 'Café/Quemado' (si es tostado). Revisa estas categorías."
            });
        }
        // Logic 3: Astringency -> Nutty or Unripe Fruit
        // For astringency, user said "if Dominant", let's use the threshold too for consistency
        if ((zones.attack.get('astringency') || 0) > kickThreshold) {
            kickSuggestions.push({
                en: "Sharp astringency often comes from 'Nut Skins' or 'Unripe Fruit'. Consider adding these to the profile.",
                es: "La astringencia aguda a menudo proviene de 'Pieles de nuez' o 'Fruta verde'. Considera agregar estos al perfil."
            });
        }
        // Logic 4: Floral -> Spice or Wood
        // Floral is complementary, so we check if it has significant presence (e.g. > 10% of zone)
        if ((zones.attack.get('floral') || 0) > (attackDuration * 0.1)) {
            kickSuggestions.push({
                en: "Floral notes often carry subtle 'Spicy' (Coriander) or 'Light Wood' nuances. Did you perceive them?",
                es: "Las notas florales a menudo conllevan matices sutiles de 'Especias' (cilantro) o 'Madera ligera'. ¿Los percibiste?"
            });
        }
        // Logic 5: Sweetness -> Caramel/Vanilla (if high cacao?)
        // We lack 'Sugar %' data here. Assuming high Cacao context given the app usage.
        if ((zones.attack.get('sweetness') || 0) > kickThreshold) {
            kickSuggestions.push({
                en: "Sweetness in dark chocolate is often aromatic. Check for 'Caramel/Panela', 'Malt', or 'Vanilla'.",
                es: "El dulzor en el chocolate oscuro suele ser aromático. Busca 'Caramelo/Panela', 'Malta' o 'Vainilla'."
            });
        }
    }

    // Recommendation System: Aftertaste Quality (> 100%)
    const qualitySuggestions: { en: string; es: string }[] = [];

    // Helper to check presence in aftertaste
    const hasFinish = (id: string) => (zones.finish.get(id) || 0) > 0;
    const isFinishDominant = (id: string) => (zones.finish.get(id) || 0) > (finishDuration * 0.3); // >30% dominance

    // -------------------------------------------------------------------------
    // NEW: Defect-Specific Global Quality Suggestions (3-Tier)
    // -------------------------------------------------------------------------
    // "Humans are biologically programmed to detect off-flavors..."
    const defectScore = scores.get('defects')?.score || 0;

    if (defectScore > 0) {
        if (defectScore >= 3) {
            qualitySuggestions.push({
                en: "Defect Intensity 3+ (Clearly characterizing). Recommend Global Quality 0-3.",
                es: "Intensidad de defecto 3+ (Claramente característico). Se recomienda Calidad Global 0-3."
            });
        } else if (defectScore >= 1) {
            qualitySuggestions.push({
                en: "Defect Intensity 1-2 (Low intensity). Recommend Global Quality 4-6.",
                es: "Intensidad de defecto 1-2 (Baja intensidad). Se recomienda Calidad Global 4-6."
            });
        }
        // Note: Score 0 (Absent) is handled by default (no suggestion push), 
        // implying "Clean" -> Recommend 7-10 logic handled below generally.
    }

    // General Positive Reinforcement (if clean)
    if (defectScore === 0) {
        // Only push if finish is clean or pleasant, avoiding redundancy if aroma is low
        if (aftertasteQuality === 'positive' && aromaIntensity >= 5) {
            qualitySuggestions.push({
                en: "Clean sample (Absent defects). Recommend Global Quality 7-10.",
                es: "Muestra limpia (Defectos ausentes). Se recomienda Calidad Global 7-10."
            });
        }
    }

    // Rancid: Sour + Bitter (no Fruit)
    if (hasFinish('acidity') && hasFinish('bitterness') && !hasFinish('fresh_fruit') && !hasFinish('browned_fruit')) {
        if ((zones.finish.get('acidity')! + zones.finish.get('bitterness')!) > (finishDuration * 0.5)) {
            qualitySuggestions.push({
                en: "Unbalanced, harsh finish (Sour+Bitter without Fruit). Suggest Low Quality.",
                es: "Final desequilibrado y áspero (Acidez+Amargor sin fruta). Sugiere Baja Calidad."
            });
        }
    }

    // B. High Quality Indicators
    // Complex: Fruit + Acid + Sweet
    if (hasFinish('fresh_fruit') && hasFinish('acidity') && hasFinish('sweetness')) {
        qualitySuggestions.push({
            en: "Bright, complex finish detected (Fruit+Acid+Sweet). Suggest Global Quality 8–10.",
            es: "Final brillante y complejo detectado (Fruta+Acidez+Dulzor). Sugiere Calidad Global 8–10."
        });
    }

    // Fine Cacao Base: Cocoa + Nutty + Woody
    if (hasFinish('cacao') && hasFinish('nutty') && (hasFinish('woody') || hasFinish('spice'))) {
        qualitySuggestions.push({
            en: "Solid, comforting cacao base (Cocoa+Nutty+Woody). Suggest Global Quality 7–9.",
            es: "Base de cacao sólida y reconfortante (Cacao+Nuez+Madera). Sugiere Calidad Global 7–9."
        });
    }

    // Collect aftertaste boosts from scores
    const aftertasteBoosts: { attrId: string; amount: number }[] = [];
    scores.forEach((result, attrId) => {
        if (result.boostDetails && result.boostDetails.amount > 0) {
            aftertasteBoosts.push({ attrId, amount: result.boostDetails.amount });
        }
    });
    // Also include core scores boosts (expert mode)
    coreScores.forEach((result, attrId) => {
        if (result.boostDetails && result.boostDetails.amount > 0) {
            aftertasteBoosts.push({ attrId, amount: result.boostDetails.amount });
        }
    });

    return {
        scores,
        coreScores,
        aromaIntensity,
        aromaPercent: Math.round(maxAttackPercent * 10) / 10,
        aromaNotes,
        aftertasteIntensity,
        aftertastePercent: Math.round(maxFinishPercent * 10) / 10,
        aftertasteQuality,
        dominantAftertaste: dominantFinishAttr,
        aftertasteBoosts,
        kickSuggestions,
        qualitySuggestions,
        qualityModifier,
        firstOnset: startTime,
        attackPhaseDuration: attackDuration,
        adjustedSwallowTime: swallowTime
    };
};

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================





/**
 * Apply TDS scores to attributes.
 */
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





/**
 * Parse TDS events from JSON.
 */
export const parseEventsFromJSON = (json: string): TDSEvent[] => {
    try {
        return JSON.parse(json) as TDSEvent[];
    } catch {
        return [];
    }
};
