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

    // Calculate Absolute Similarity
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) {
                simMatrix[i][j] = 100;
            } else {
                const d = distMatrix[i][j];
                // Normalize against the theoretical maximum possible distance
                // limiting to 0 in case of float weirdness (though shouldn't happen)
                const sim = 100 * (1 - (d / MAX_THEORETICAL_DISTANCE));
                simMatrix[i][j] = Math.max(0, Math.round(sim));
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
// 4. CLUSTERING ENGINE
// ---------------------------------------------------------------------------
export async function performClustering(samples: StoredSample[], distanceResult?: DistanceResult): Promise<ClusterResult[]> {
    if (samples.length < 2) return [];

    const distData = distanceResult || calculateDistanceMatrix(samples);

    // Dynamic import to prevent load-time crashes if library differs in environment
    // Use try-catch to handle potential module loading errors
    let agnes;
    try {
        const module = await import('ml-hclust');
        agnes = module.agnes;
    } catch (e) {
        console.error("Failed to load clustering library (ml-hclust)", e);
        return []; // Graceful degradation
    }

    // Create cluster tree using Ward's method
    const tree = agnes(distData.matrix, { method: 'ward' });

    // Dynamic Cut: 
    // Simple heuristic based on dataset size for MVP
    // Ideally use gap statistic or silhouette score
    let k = 2;
    const N = samples.length;
    if (N >= 15) k = 4;
    else if (N >= 8) k = 3;

    // Use library's grouping feature
    // ml-hclust group(k) returns a Cluster object where children are subgroups
    const clusterGroup = tree.group(k);

    // Extract separate clusters from the root group
    // Adjust based on library return structure. Assuming standard ml-hclust behavior:
    // group(k) returns the root node of the cut subtree. Its children are the clusters.
    const clusters = clusterGroup.children || [clusterGroup];

    return clusters.map((clusterNode: any, index: number) => {
        // Traverse to find all leaf indices belonging to this cluster
        const indices = getLeafIndices(clusterNode);
        const uniqueIndices = Array.from(new Set(indices)); // Dedup just in case

        const clusterSamples = uniqueIndices.map(i => samples[i]);

        // Calculate simple average stats
        const avgQ = clusterSamples.reduce((sum, s) => sum + s.globalQuality, 0) / (clusterSamples.length || 1);

        // Identify dominant traits (simplified)
        // Find attributes that > 50% of samples have score > 4
        const traitCounts: Record<string, number> = {};
        clusterSamples.forEach(sample => {
            if (sample.globalQuality > 7) traitCounts['High Quality'] = (traitCounts['High Quality'] || 0) + 1;

            sample.attributes.forEach(attr => {
                // Check if it's a "defining" flavor (e.g., > 3 intensity)
                if (attr.score >= 3 && !['cacao', 'bitterness', 'astringency'].includes(attr.id.replace('attr_', ''))) {
                    // Exclude base flavors to find nuances
                    const name = attr.id.replace('attr_', '').replace('_', ' ');
                    traitCounts[name] = (traitCounts[name] || 0) + 1;
                }
            });
        });

        // Pick top 2 traits
        const sortedTraits = Object.entries(traitCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([name]) => name);

        // Generate Name
        const groupName = sortedTraits.length > 0
            ? toTitleCase(sortedTraits.join(' & '))
            : `Group ${index + 1}`;

        return {
            id: index + 1,
            name: groupName,
            sampleCodes: clusterSamples.map(s => s.sampleCode),
            sampleIds: clusterSamples.map(s => s.id),
            avgQuality: Number(avgQ.toFixed(1)),
            dominantTraits: sortedTraits
        };
    });
}

function getLeafIndices(node: any): number[] {
    if (!node) return [];
    if (node.isLeaf) return [node.index];

    let indices: number[] = [];
    if (node.children) {
        node.children.forEach((child: any) => {
            indices = indices.concat(getLeafIndices(child));
        });
    }
    return indices;
}

function toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
