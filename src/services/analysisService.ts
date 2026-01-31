import { StoredSample } from './dbService';

// ---------------------------------------------------------------------------
// 1. CONFIGURATION: WEIGHTS
// ---------------------------------------------------------------------------
const ATTRIBUTE_WEIGHTS: Record<string, number> = {
    'defects_total': 5.0,
    'global_quality': 3.0,
    'cacao': 1.5,
    'acidity': 1.5,
    'bitterness': 1.5,
    'astringency': 1.5,
    'roast': 1.2,
    'fresh_fruit': 1.0,
    'browned_fruit': 1.0,
    'floral': 1.0,
    'spice': 1.0,
    'woody': 1.0,
    'nutty': 1.0,
    'vegetal': 1.0,
    'sweetness': 1.0
};

export interface DistanceResult {
    matrix: number[][];       // N x N matrix of weighted Euclidean distances
    similarityMatrix: number[][]; // N x N matrix of 0-100 scores
    vectors: number[][];      // The weighted vectors used for calc
    sampleIds: string[];      // Order of samples in the matrix
}

export interface ClusterResult {
    id: number;
    name: string;
    sampleCodes: string[];
    sampleIds: string[];
    avgQuality: number;
    dominantTraits: string[];
}

// ---------------------------------------------------------------------------
// 2. CORE: DATA TRANSFORMATION
// ---------------------------------------------------------------------------
function transformToVectors(samples: StoredSample[]): { vectors: number[][], ids: string[] } {
    const attributeKeys = Object.keys(ATTRIBUTE_WEIGHTS);

    const vectors = samples.map(sample => {
        const attrMap = new Map(sample.attributes.map(a => [a.id, a.score]));

        return attributeKeys.map(key => {
            let rawValue = 0;

            if (key === 'global_quality') {
                rawValue = sample.globalQuality || 0;
            } else if (key === 'defects_total') {
                // Fallback checks for defects
                rawValue = attrMap.get('defects') || attrMap.get('defects_intens') || 0;
            } else {
                // Direct access by ID found in ATTRIBUTE_WEIGHTS keys (which match DB ids)
                rawValue = attrMap.get(key) || 0;
            }

            const weight = ATTRIBUTE_WEIGHTS[key] || 1.0;
            return rawValue * Math.sqrt(weight);
        });
    });

    return { vectors, ids: samples.map(s => s.id) };
}

// ---------------------------------------------------------------------------
// 3. CORE: DISTANCE CALCULATION
// ---------------------------------------------------------------------------
// Calculate Theoretical Max Distance for Absolute Normalization
// Max possible difference per attribute is 10 (0 vs 10).
// Max Dist = sqrt(sum(weight * (10)^2)) = 10 * sqrt(sum(weights))
const TOTAL_WEIGHT_SUM = Object.values(ATTRIBUTE_WEIGHTS).reduce((sum, w) => sum + w, 0);
const MAX_THEORETICAL_DISTANCE = 10 * Math.sqrt(TOTAL_WEIGHT_SUM);

export function calculateDistanceMatrix(samples: StoredSample[]): DistanceResult {
    const { vectors, ids } = transformToVectors(samples);
    const n = vectors.length;

    const distMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
    const simMatrix = Array(n).fill(0).map(() => Array(n).fill(0));

    // We no longer rely on 'maxDist' from the group for normalization
    // purely for the matrix calculation loop
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            let sumSq = 0;
            const vecA = vectors[i];
            const vecB = vectors[j];

            for (let k = 0; k < vecA.length; k++) {
                const diff = vecA[k] - vecB[k];
                sumSq += diff * diff;
            }

            const dist = Math.sqrt(sumSq);
            distMatrix[i][j] = dist;
            distMatrix[j][i] = dist;
        }
    }

    // Calculate Similarity using Gaussian Kernel (RBF)
    // Formula: Similarity(%) = 100 × e^(-distance²/(2σ²))
    // σ = 5.0 is tuned for sensory data:
    //   - distance 0.0 → 100% (identical)
    //   - distance 2.5 → ~88% (very close)
    //   - distance 5.0 → ~60% (distinct)
    //   - distance 7.5 → ~32% (different)
    //   - distance 10.0 → ~13% (unrelated)
    const SIGMA = 5.0;
    const TWO_SIGMA_SQ = 2 * SIGMA * SIGMA; // Pre-calculate: 50

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) {
                simMatrix[i][j] = 100;
            } else {
                const d = distMatrix[i][j];
                // Gaussian kernel: 100 * e^(-d²/(2σ²))
                const sim = 100 * Math.exp(-(d * d) / TWO_SIGMA_SQ);
                simMatrix[i][j] = Math.round(sim);
            }
        }
    }

    return {
        matrix: distMatrix,
        similarityMatrix: simMatrix,
        vectors,
        sampleIds: ids
    };
}


// ---------------------------------------------------------------------------
// 4. CLUSTERING ENGINE (Affinity Propagation)
// ---------------------------------------------------------------------------
import { runAffinityPropagation } from '../utils/affinityPropagation';

export interface ClusterResultWithExemplar extends ClusterResult {
    exemplarCode: string; // The sample code of the exemplar (representative)
    exemplarId: string;   // The ID of the exemplar
}

export async function performClustering(samples: StoredSample[], distanceResult?: DistanceResult): Promise<ClusterResultWithExemplar[]> {
    if (samples.length < 2) return [];

    const distData = distanceResult || calculateDistanceMatrix(samples);

    // Use Affinity Propagation with similarity matrix (not distance!)
    // AP natively works with similarity, which is perfect for Gaussian Kernel output.
    const apResult = runAffinityPropagation(distData.similarityMatrix);

    // Build results from AP output
    const results: ClusterResultWithExemplar[] = [];

    apResult.exemplars.forEach((exemplarIdx, clusterIndex) => {
        const memberIndices = apResult.exemplarMap.get(exemplarIdx) || [];
        const clusterSamples = memberIndices.map(i => samples[i]);
        const exemplarSample = samples[exemplarIdx];

        // Calculate simple average quality
        const avgQ = clusterSamples.reduce((sum, s) => sum + s.globalQuality, 0) / (clusterSamples.length || 1);

        // Identify dominant traits (simplified)
        // Find attributes that > 50% of samples have score > 3
        const traitCounts: Record<string, number> = {};
        clusterSamples.forEach(sample => {
            sample.attributes.forEach(attr => {
                // Check if it's a "defining" flavor (e.g., > 3 intensity)
                if (attr.score >= 3 && !['cacao', 'bitterness', 'astringency'].includes(attr.id.replace('attr_', ''))) {
                    // Exclude base flavors to find nuances
                    const key = attr.id.replace('attr_', '');
                    traitCounts[key] = (traitCounts[key] || 0) + 1;
                }
            });
        });

        // Pick top 2 traits
        const sortedTraits = Object.entries(traitCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([name]) => name);

        // Generate Name (Using keys, UI will translate)
        const groupName = sortedTraits.length > 0
            ? sortedTraits.join('|') // Use separator for UI parsing
            : `Group ${clusterIndex + 1}`;

        results.push({
            id: clusterIndex + 1,
            name: groupName,
            sampleCodes: clusterSamples.map(s => s.sampleCode),
            sampleIds: clusterSamples.map(s => s.id),
            avgQuality: Number(avgQ.toFixed(1)),
            dominantTraits: sortedTraits,
            exemplarCode: exemplarSample.sampleCode,
            exemplarId: exemplarSample.id
        });
    });

    return results;
}

