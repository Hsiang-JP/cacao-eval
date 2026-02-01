
import { analyzeTDS, ALL_ATTRIBUTES, COMPLEMENTARY_ATTRIBUTES } from '../src/utils/tdsCalculator';
import { TDSProfile, TDSEvent } from '../src/types';

// Mock profile with Sweetness
const events: TDSEvent[] = [
    { attrId: 'sweetness', start: 0, end: 10, phase: 'melting' } // 10s duration
];

const profile: TDSProfile = {
    mode: 'expert',
    events,
    swallowTime: 10,
    totalDuration: 20 // 10s aftertaste
};

// Simulate Sweetness in Aftertaste
const eventsWithAftertaste: TDSEvent[] = [
    { attrId: 'sweetness', start: 0, end: 10, phase: 'melting' },
    { attrId: 'sweetness', start: 10, end: 18, phase: 'residual' } // 8s aftertaste (Should trigger boost > 5s)
];

const profileWithBoost: TDSProfile = {
    mode: 'expert',
    events: eventsWithAftertaste,
    swallowTime: 10,
    totalDuration: 20
};

console.log("--- Test 1: Sweetness Visibility ---");
const result1 = analyzeTDS(profile);
const sweetness1 = result1.scores.get('sweetness');
if (sweetness1) {
    console.log("Sweetness Found!");
    console.log("Duration %:", sweetness1.durationPercent);
    console.log("Score:", sweetness1.score);
    console.log("Category:", sweetness1.category);
} else {
    console.error("Sweetness MISSING from scores!");
}

console.log("\n--- Test 2: Sweetness Boost ---");
const result2 = analyzeTDS(profileWithBoost);
const sweetness2 = result2.scores.get('sweetness');
if (sweetness2) {
    console.log("Sweetness Found!");
    console.log("Boost Details:", sweetness2.boostDetails);
    if (sweetness2.boostDetails) {
        console.log("Boost working as expected.");
    } else {
        console.error("Boost MISSING!");
    }
} else {
    console.error("Sweetness MISSING from scores!");
}

console.log("\n--- Debug Info ---");
console.log("Is Sweetness in COMPLEMENTARY?", COMPLEMENTARY_ATTRIBUTES.includes('sweetness'));
