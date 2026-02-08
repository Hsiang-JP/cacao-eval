
import { FlavorAttribute, QualityAttribute, SubAttribute, TDSProfile, TDSAnalysisResult } from '../types';

export interface EvaluationConfig {
    id: string; // 'cacao' | 'coffee'
    name: { en: string; es: string };
    assets: {
        logo: string;
        flavorWheel: {
            en: string;
            es: string;
        };
        scoreInstruction: {
            en: string;
            es: string;
        };
    };

    // Data Models
    attributes: FlavorAttribute[];
    qualityAttributes: QualityAttribute[];

    // CSV Export
    csv: {
        headers: {
            en: string[];
            es: string[];
        };
        getRow: (sample: any, language: 'en' | 'es') => (string | number)[];
    };

    // Logic: Scoring
    scoring: {
        calculateAttributeScore: (id: string, subAttributes: SubAttribute[]) => number;
    };

    // Logic: TDS Analysis
    tds: {
        analyze: (profile: TDSProfile) => TDSAnalysisResult;
    };

    // Metadata / UI Helpers
    meta: {
        primaryAttributeIds: string[]; // For UI highlighting
        radarAttributeIds?: string[]; // Order for Radar Chart (optional, defaults to attributes order if missing)
        defectAttributeIds: string[];
    };
}
