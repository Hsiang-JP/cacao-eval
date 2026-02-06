import { dbService } from '../../dbService';
import { TDSProfile, TDSAnalysisResult } from '../../types';
import { generateStreamData, SmoothedPoint } from '../../features/tds/logic/tdsMath';
import { analyzeTDS } from '../../utils/tdsCalculator';
import { INITIAL_ATTRIBUTES } from '../../constants';

const ALL_ATTRIBUTE_IDS = INITIAL_ATTRIBUTES.map(a => a.id);

export interface CachedAnalysis {
    schemaVersion: number;
    lastComputed: number; // Timestamp
    streamData: SmoothedPoint[]; // The "130-point array"
    summaryStats: TDSAnalysisResult; // The summary object
}

// In a real app, we might use a separate Object Store for results.
// For now, we will compute on demand (async) and return.
// To implement TRUE caching, we would add 'analysisResults' store to IndexedDB.
// Given constraints, I will use a simple in-memory cache for the session life
// + persistent storage if we upgrade DB schema.

// Current Plan: Run Logic Async (Simulated Worker)
// This solves the 'Block UI' issue.
// Later we can persist to DB.

class AnalysisService {
    private memoryCache: Map<string, CachedAnalysis> = new Map();

    /**
     * getAnalysis
     * Checks cache -> Computes (Async) -> Returns
     */
    async getAnalysis(profile: TDSProfile): Promise<CachedAnalysis> {
        const cacheKey = `${profile.id}-${profile.lastModified}`; // Simple cache key

        if (this.memoryCache.has(cacheKey)) {
            return this.memoryCache.get(cacheKey)!;
        }

        // Simulate Worker Delay (yield to main thread)
        await new Promise(resolve => setTimeout(resolve, 0));

        try {
            // 1. Heavy Math (Stream Data)
            const streamData = generateStreamData(
                profile.events,
                profile.totalDuration,
                ALL_ATTRIBUTE_IDS
            );

            // 2. Heavy Math (Analysis Stats)
            const summaryStats = analyzeTDS(profile);

            const result: CachedAnalysis = {
                schemaVersion: 1,
                lastComputed: Date.now(),
                streamData,
                summaryStats
            };

            // 3. Cache it
            this.memoryCache.set(cacheKey, result);

            return result;
        } catch (e) {
            console.error("Analysis Computation Error", e);
            throw e;
        }
    }

    invalidate(sessionId: string) {
        // Invalidate memory cache keys starting with ID
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(sessionId)) {
                this.memoryCache.delete(key);
            }
        }
    }
}

export const analysisService = new AnalysisService();
