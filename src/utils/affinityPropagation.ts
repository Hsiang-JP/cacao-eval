/**
 * Affinity Propagation Clustering
 * 
 * This algorithm is ideal for clustering with pre-computed similarity matrices.
 * Unlike K-Means (needs raw coordinates) or Hierarchical (needs distances),
 * Affinity Propagation works directly with similarity scores.
 * 
 * Key Concepts:
 * - Responsibility (R): How well-suited sample k is to be an exemplar for sample i.
 * - Availability (A): How appropriate it is for sample i to choose sample k as its exemplar.
 * - Exemplar: A real sample that best represents its cluster (not an abstract centroid).
 * 
 * @param S - Similarity Matrix (N x N), where High Value = Similar
 * @param damping - Damping factor (0.5 to 0.9), prevents oscillations. Default 0.5.
 * @param preference - The "self-similarity" score.
 *   - High = Many small clusters.
 *   - Low = Few large clusters.
 *   - Default: Median of all similarities.
 * @param maxIter - Maximum iterations. Default 200.
 * @param convergenceThreshold - Stops early if stable for this many iterations. Default 15.
 */
export function runAffinityPropagation(
    S: number[][],
    damping = 0.5,
    preference?: number,
    maxIter = 200,
    convergenceThreshold = 15
): { labels: number[]; exemplars: number[]; exemplarMap: Map<number, number[]> } {
    const N = S.length;

    if (N === 0) {
        return { labels: [], exemplars: [], exemplarMap: new Map() };
    }
    if (N === 1) {
        return { labels: [0], exemplars: [0], exemplarMap: new Map([[0, [0]]]) };
    }

    // 1. Initialize Matrices
    const R: number[][] = Array(N).fill(0).map(() => Array(N).fill(0)); // Responsibility
    const A: number[][] = Array(N).fill(0).map(() => Array(N).fill(0)); // Availability

    // 2. Set Preference (Self-Similarity S[i][i])
    // If not provided, use the median of S (standard practice for balanced clusters)
    const flatS = S.flat().filter((_, idx) => {
        // Exclude diagonal elements for median calculation
        const row = Math.floor(idx / N);
        const col = idx % N;
        return row !== col;
    });
    flatS.sort((a, b) => a - b);
    const medianS = flatS[Math.floor(flatS.length / 2)] || 0;
    const safePref = preference !== undefined ? preference : medianS;

    // Create a working copy of S with preference on diagonal
    const Sw = S.map((row, i) => row.map((val, j) => (i === j ? safePref : val)));

    // 3. Message Passing Loop with Early Convergence Check
    let prevExemplars: number[] = [];
    let stableCount = 0;

    for (let iter = 0; iter < maxIter; iter++) {
        // Update Responsibility (R)
        // r(i, k) <- s(i, k) - max { a(i, k') + s(i, k') } for k' != k
        for (let i = 0; i < N; i++) {
            for (let k = 0; k < N; k++) {
                let maxVal = -Infinity;
                for (let kp = 0; kp < N; kp++) {
                    if (kp !== k) {
                        maxVal = Math.max(maxVal, A[i][kp] + Sw[i][kp]);
                    }
                }
                const newVal = Sw[i][k] - maxVal;
                R[i][k] = (1 - damping) * newVal + damping * R[i][k];
            }
        }

        // Update Availability (A)
        // a(i, k) <- min { 0, r(k, k) + sum max{0, r(i', k)} } for i != k
        // a(k, k) <- sum max{0, r(i', k)} for i' != k
        for (let k = 0; k < N; k++) {
            // First calculate sum of positive responsibilities for this potential exemplar k
            let sumPosR = 0;
            for (let ip = 0; ip < N; ip++) {
                if (ip !== k) {
                    sumPosR += Math.max(0, R[ip][k]);
                }
            }

            for (let i = 0; i < N; i++) {
                let newVal: number;
                if (i === k) {
                    // Self-availability
                    newVal = sumPosR;
                } else {
                    // Availability to others
                    const rPosIK = Math.max(0, R[i][k]);
                    newVal = Math.min(0, R[k][k] + sumPosR - rPosIK);
                }
                A[i][k] = (1 - damping) * newVal + damping * A[i][k];
            }
        }

        // Check for convergence by looking at exemplars
        const currentExemplars: number[] = [];
        for (let i = 0; i < N; i++) {
            if (A[i][i] + R[i][i] > 0) {
                currentExemplars.push(i);
            }
        }

        // Compare with previous
        const sameExemplars =
            currentExemplars.length === prevExemplars.length &&
            currentExemplars.every((e, idx) => e === prevExemplars[idx]);

        if (sameExemplars) {
            stableCount++;
            if (stableCount >= convergenceThreshold) {
                break; // Converged
            }
        } else {
            stableCount = 0;
        }
        prevExemplars = currentExemplars;
    }

    // 4. Identify Final Cluster Assignments
    const labels: number[] = new Array(N).fill(-1);
    const exemplarSet = new Set<number>();

    for (let i = 0; i < N; i++) {
        // Find k that maximizes (A[i][k] + R[i][k])
        let maxK = i; // Default to self
        let maxVal = A[i][i] + R[i][i];
        for (let k = 0; k < N; k++) {
            const score = A[i][k] + R[i][k];
            if (score > maxVal) {
                maxVal = score;
                maxK = k;
            }
        }
        labels[i] = maxK;
        exemplarSet.add(maxK);
    }

    const exemplars = Array.from(exemplarSet).sort((a, b) => a - b);

    // Build exemplar -> members map
    const exemplarMap = new Map<number, number[]>();
    for (const ex of exemplars) {
        exemplarMap.set(ex, []);
    }
    for (let i = 0; i < N; i++) {
        exemplarMap.get(labels[i])?.push(i);
    }

    return { labels, exemplars, exemplarMap };
}
