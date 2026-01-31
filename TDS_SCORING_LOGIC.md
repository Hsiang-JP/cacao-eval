# TDS to CoEx Scoring Logic

## Overview
This document explains the scientific algorithm used to convert **Temporal Dominance of Sensations (TDS)** data (Duration %) into **CoEx Attribute Scores** (0-10 Scale).

The goal is to translate objective time data into subjective intensity scores that align with Cacao of Excellence (CoEx) sensory evaluation guidelines.

---

## 1. Scientific Principles

### A. Attention vs. Duration ("Figure vs. Ground")
In cognitive psychology and sensory science:
*   **Ground (Background):** Core attributes like **Cocoa** and **Bitterness** form the continuous backdrop of the flavor profile. They are persistent.
*   **Figure (Feature):** Special attributes like **Floral** or **Spices** are "figures" that pop up against this background.

**Implication:** A special note (Figure) that grabs attention for even a short time is highly significant, whereas a core note (Background) needs to be dominant for a long time to be considered "intense."

### B. Chance Level Significance
In **Expert Mode** (15 attributes), the statistical "Chance Level" ($P_0$) is $1/15 \approx 6.7\%$.
*   Any attribute dominance **> 7%** is statistically significant.
*   Therefore, a duration of **15%** for a special attribute is a strong signal, justifying a high CoEx score (Characterizing/Dominant).

### C. The "Silence" Filter
TDS profiles often have a "mechanical lag" at the start (e.g., placing sample in mouth, melting time) where no attribute is selected.
*   **Adjustment:** The algorithm effectively starts counting `t=0` from the **first button click (Onset)**.
*   **Benefit:** This ensures dominance ratios are not artificially diluted by the user's reaction time or initial melting phase.

---

## 2. The Conversion Algorithm

We use **Category-Specific Sensitivity Curves** to map Duration % to Scores.

### Type A: Core Attributes (Low Sensitivity)
*   **Attributes:** Cocoa, Bitterness, Astringency, Roast, Acidity.
*   **Behavior:** **Linear Scaling**.
*   **Rationale:** These are expected to be present. A high score requires high dominance duration.
*   **0% Duration:** Defaults to **Score 1** (Trace), as core attributes are rarely completely absent in chocolate.

| Duration % | Score | Definition |
|------------|-------|------------|
| 0% | 1 | Trace (Default) |
| 1-15% | 1-4 | Low |
| 16-30% | 5-6 | Medium |
| 31-75% | 7-9 | High |
| >75% | 10 | Overpowering |

### Type B: Special Attributes (High Sensitivity)
*   **Attributes:** Floral, Fresh Fruit, Spice, Nutty, etc.
*   **Behavior:** **Logarithmic Scaling** (Steep initial rise).
*   **Rationale:** "Rare and Precious." Brief pop-ups are highly characterizing.
*   **Visual Feedback:** The app displays a ✨ tooltip when these receive boosted scores due to rarity.

| Duration % | Score | Definition |
|------------|-------|------------|
| 0% | 0 | Absent |
| 1-5% | 2-3 | Characterizing (Low) |
| **6-15%** | **4-6** | **Characterizing (Mid)** |
| **16-30%** | **7-8** | **Dominant** |
| >30% | 9-10 | Overpowering |

> **Key Difference:** 20% Duration results in **Score 5** for Cocoa (Type A) but **Score 8** for Floral (Type B).

### Type C: Defects (Maximum Sensitivity)
*   **Attributes:** Mold, Smoky, Hammy, etc.
*   **Behavior:** **Aggressive Penalty**.
*   **Rationale:** Humans are biologically programmed to detect off-flavors instantly.
*   **>2% Duration** = Score 2+ (Clearly Present).
*   **>10% Duration** = Score 6+ (Severe Defect).

---

## 3. Zone Analysis Methodology

The duration percentage is calculated against the **Effective Total Swallow Time** (Swallow Time - First Event Start).

### Zones
1.  **Attack (0% - 20% of Effective Swallow Time):**
    *   **"The Kick"**: Volatile flavors (Floral, High Acidity) often appear here.
    *   **Usage:**
        *   Contributes to **Flavor Score** (Summed with Body).
        *   Generates **Aroma Notes** for text comments (e.g., "Fruity attack").
2.  **Body (20% - 100% of Effective Swallow Time):**
    *   The primary window for sustained flavor.
    *   **Behavior:** Combined with Attack for total dominance calculation.
    *   Calculation: `(Dominance in Attack + Dominance in Body) / Effective Swallow Time`.
3.  **Finish (> 100% of Effective Swallow Time):**
    *   **"Aftertaste"**: Retronasal release after swallowing.
    *   **Isolation:** COMPLETELY EXCLUDED from Flavor Attribute scores to prevent dilution.
    *   **Usage:**
        *   Determines **Aftertaste Intensity** (0-10).
        *   Dominant attribute here modifies **Global Quality**.

---

## 4. Implementation Details

*   **File:** `src/utils/tdsCalculator.ts`
*   **Main Function:** `analyzeTDS(profile)`
*   **Logic:**
    1.  **Filter Silence:** `startTime = min(events.start)`. Shift all times by `-startTime`.
    2.  **Zone Split:** `splitEventByZones` separates duration into Attack/Body/Finish.
    3.  **Flavor Calculation:** `(Attack + Body) / SwallowTime`.
    4.  **Mapping:** `mapDurationToScore(percent, category)`.
