import { useState, useEffect } from 'react';
import { dbService, StoredSample } from '../services/dbService';

interface UseSamplesResult {
    samples: StoredSample[];
    loading: boolean;
    error: Error | null;
}

/**
 * Hook to fetch samples from the database.
 * @param ids Optional array of sample IDs to filter by. If empty/null, fetches all.
 */
export const useSamples = (ids?: string[]): UseSamplesResult => {
    const [samples, setSamples] = useState<StoredSample[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchSamples = async () => {
            try {
                setLoading(true);
                const allSamples = await dbService.getAllSamples();

                if (isMounted) {
                    if (ids && ids.length > 0) {
                        setSamples(allSamples.filter(s => ids.includes(s.id)));
                    } else {
                        setSamples(allSamples);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Failed to load samples'));
                    console.error("Error fetching samples:", err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSamples();

        return () => {
            isMounted = false;
        };
    }, [JSON.stringify(ids)]); // Deep compare IDs array

    return { samples, loading, error };
};
