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
    // Cocoa = Cocoa + Browned Fruit + Nutty
    cacao: ['cacao', 'browned_fruit', 'nutty'],
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
 * - "Chance Level": 1/13 ≈ 7.7%. Special attributes >7.7% are statistically significant.
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
const mapDurationToScore = (
    durationPercent: number,
    category: 'core' | 'complementary' | 'defect'
): number => {

    // -------------------------------------------------------------------------
    // 1. Defect Attributes (Highest Sensitivity)
    // -------------------------------------------------------------------------
    // "Humans are biologically programmed to detect off-flavors... quickly."
    if (category === 'defect') {
        if (durationPercent === 0) return 0;
        if (durationPercent <= 2) return 2;  // "Clearly Present"
        if (durationPercent <= 5) return 4;
        if (durationPercent <= 10) return 6; // Severe penalty > 10%
        if (durationPercent <= 20) return 8;
        return 10;
    }

    // -------------------------------------------------------------------------
    // 2. Special/Complementary Attributes (High Sensitivity - Logarithmic)
    // -------------------------------------------------------------------------
    // "Rare and precious... rise steeply at the beginning."
    if (category === 'complementary') {
        if (durationPercent === 0) return 0; // Absent

        // 1-5% → Score 2-3 (Low/Characterizing)
        // "Even a brief flash... is a distinct flavor event."
        if (durationPercent <= 5) {
            return Math.round(mapRange(durationPercent, 1, 5, 2, 3));
        }

        // 6-15% → Score 4-6 (Characterizing/Dominant)
        // "15% duration... is statistically significant."
        if (durationPercent <= 15) {
            return Math.round(mapRange(durationPercent, 6, 15, 4, 6));
        }

        // 16-30% → Score 7-8 (Dominant)
        // "Holding attention... is a strong signal."
        if (durationPercent <= 30) {
            return Math.round(mapRange(durationPercent, 16, 30, 7, 8));
        }

        // >30% → Score 9-10 (Max/Overpowering)
        return Math.round(mapRange(durationPercent, 31, 60, 9, 10)); // Cap at 60% for 10
    }

    // -------------------------------------------------------------------------
    // 3. Core Attributes (Low Sensitivity - Linear)
    // -------------------------------------------------------------------------
    // "Expected to be present... requires substantial duration."
    // Default 1 (Trace) even if 0%, as per CoEx ("Core attributes are always present")
    if (durationPercent === 0) {
        return 1;
    }

    // 1-5% → Score 1-2 (Trace/Low)
    if (durationPercent <= 5) {
        return Math.round(mapRange(durationPercent, 0, 5, 1, 2));
    }

    // 6-15% → Score 3-4 (Mid)
    if (durationPercent <= 15) {
        return Math.round(mapRange(durationPercent, 6, 15, 3, 4));
    }

    // 16-30% → Score 5-6 (Mid-High)
    if (durationPercent <= 30) {
        return Math.round(mapRange(durationPercent, 16, 30, 5, 6));
    }

    // >30% → Score 7+ (High - Linear extension)
    // 30% -> 7, 50% -> 7/8? User said "50% Duration ≈ Score 7" in text but table says ">30% is 7+".
    // Let's smooth it out: 30%->7, 75%->10.
    if (durationPercent <= 75) {
        return Math.round(mapRange(durationPercent, 30, 75, 7, 9));
    }

    return 10;
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

    // -------------------------------------------------------------------------
    // 0. Silence Filter (Scientific Nuance)
    // -------------------------------------------------------------------------
    // Remove mechanical lag.
    let startTime = 0;
    if (events.length > 0) {
        startTime = Math.min(...events.map(e => e.start));
    }

    // Adjust timings relative to effective start
    const swallowTime = Math.max(0, rawSwallowTime - startTime);
    const totalDuration = Math.max(0, rawTotalDuration - startTime);

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
    const finishDuration = totalDuration - swallowTime; // Post-swallow duration

    // -------------------------------------------------------------------------
    // 1. Individual Attribute Scores (BASE SCORE: Attack + Body)
    // -------------------------------------------------------------------------
    const scores = new Map<string, TDSScoreResult>();
    const allAttrs = mode === 'normal' ? CORE_ATTRIBUTES : ALL_ATTRIBUTES;

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

        let score = mapDurationToScore(durationPercent, category);
        const originalScore = score;
        let boostDetails: { amount: number; duration: number; type: 'individual' | 'aggregated' } | undefined = undefined;

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
                // Apply boost
                score = Math.min(10, score + accumulatedBoost);

                // Only mark as boosted if it actually changed
                if (score > originalScore) {
                    boostDetails = {
                        amount: accumulatedBoost,
                        duration: Math.round(finishTime * 10) / 10,
                        type: 'individual'
                    };
                }
            }
        }

        scores.set(attrId, {
            score,
            durationPercent: Math.round(durationPercent * 10) / 10,
            isFlagged: isCore && durationPercent === 0,
            category,
            originalScore: originalScore !== score ? originalScore : undefined,
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
            // Aggregate durations first
            const children = PARENT_CHILD_MAPPING[coreAttr] || [coreAttr];
            let totalInMouth = 0;
            let totalFinish = 0;

            for (const child of children) {
                const zoneData = zones.body.get(child) || 0; // Body
                const atkData = zones.attack.get(child) || 0; // Attack
                const finData = zones.finish.get(child) || 0; // Finish
                totalInMouth += zoneData + atkData;
                totalFinish += finData;
            }

            const durationPercent = swallowTime > 0 ? (totalInMouth / swallowTime) * 100 : 0;
            let score = mapDurationToScore(durationPercent, 'core');
            const originalScore = score;
            let boostDetails: { amount: number; duration: number; type: 'individual' | 'aggregated' } | undefined = undefined;

            // Apply Boost Logic
            if (finishDuration > 5 && totalFinish > 0) {
                let accumulatedBoost = 0;
                const finishPercent = (totalFinish / finishDuration) * 100;
                if (totalFinish > 10) accumulatedBoost += 2;
                else if (totalFinish > 5) accumulatedBoost += 1;
                if (finishPercent > 50) accumulatedBoost += 1;

                if (accumulatedBoost > 0) {
                    score = Math.min(10, score + accumulatedBoost);
                    if (score > originalScore) {
                        boostDetails = {
                            amount: accumulatedBoost,
                            duration: Math.round(totalFinish * 10) / 10,
                            type: 'aggregated'
                        };
                    }
                }
            }

            coreScores.set(coreAttr, {
                score,
                durationPercent: Math.round(durationPercent * 10) / 10,
                isFlagged: durationPercent === 0,
                category: 'core',
                originalScore: originalScore !== score ? originalScore : undefined,
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
    // 6. Global Quality Modifier
    // -------------------------------------------------------------------------
    let qualityModifier = 0;
    if (aftertasteQuality === 'positive') qualityModifier += 0.5; // Lingering pleasant or Clean
    if (aftertasteQuality === 'negative') qualityModifier -= 1.5; // Punish lingering negative
    if (aromaIntensity >= 7) qualityModifier += 0.5;

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
        aromaNotes,
        aftertasteIntensity,
        aftertasteQuality,
        dominantAftertaste: dominantFinishAttr,
        aftertasteBoosts,
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
 * Simple score calculation (legacy interface).
 * Returns Map of attrId -> TDSScoreResult
 */
export const calculateScores = (profile: TDSProfile): Map<string, TDSScoreResult> => {
    const analysis = analyzeTDS(profile);

    // For Expert mode, merge individual scores with aggregated Core scores
    if (profile.mode === 'expert') {
        const merged = new Map(analysis.scores);
        // Core scores take precedence (aggregated values)
        for (const [attrId, result] of analysis.coreScores) {
            merged.set(attrId, result);
        }
        return merged;
    }

    return analysis.scores;
};

/**
 * Aggregate durations for CSV export.
 */
export const aggregateDurations = (events: TDSEvent[]): Map<string, number> => {
    const durations = new Map<string, number>();
    for (const event of events) {
        const duration = event.end - event.start;
        durations.set(event.attrId, (durations.get(event.attrId) || 0) + duration);
    }
    return durations;
};

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
 * Calculate Duration % for each attribute (legacy).
 */
export const calculateDurationPercentages = (
    events: TDSEvent[],
    totalDuration: number
): Map<string, number> => {
    const durations = aggregateDurations(events);
    const percentages = new Map<string, number>();

    for (const [attrId, totalTime] of durations) {
        const percentage = totalDuration > 0 ? (totalTime / totalDuration) * 100 : 0;
        percentages.set(attrId, Math.round(percentage * 10) / 10);
    }

    return percentages;
};

/**
 * Serialize TDS events to JSON.
 */
export const serializeEventsToJSON = (events: TDSEvent[]): string => {
    return JSON.stringify(events);
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
