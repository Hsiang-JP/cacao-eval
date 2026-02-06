import { useState, useEffect } from 'react';
import { TDSProfile } from '../../../types';
import { analysisService, CachedAnalysis } from '../../../services/analysis/analysisService';

export const useAnalysisResults = (profile: TDSProfile | null) => {
    const [data, setData] = useState<CachedAnalysis | null>(null);
    const [streamData, setStreamData] = useState<CachedAnalysis['streamData']>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!profile || !profile.id) {
            setStreamData([]);
            return;
        }

        let isMounted = true;
        setLoading(true);

        // "Compute-Once, Read-Many" flow
        analysisService.getAnalysis(profile)
            .then(result => {
                if (isMounted) {
                    setData(result);
                    setStreamData(result.streamData);
                    setLoading(false);
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error("Analysis Computation Failed", err);
                    setError(err);
                    setLoading(false);
                }
            });

        return () => { isMounted = false; };
    }, [profile?.id, profile?.lastModified]); // Re-run if ID changes or Modified timestamp updates (e.g. user adds events)

    return { data, streamData, loading, error };
};
