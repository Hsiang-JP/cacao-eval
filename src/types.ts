
export interface SubAttribute {
  id: string;
  name: string; // Current display name
  nameEn: string;
  nameEs: string;
  csvHeaderEn: string;
  csvHeaderEs: string;
  score: number; // 0-10
  description?: string; // For "Other" text input
}

export interface FlavorAttribute {
  id: string;
  name: string; // Current display name
  nameEn: string;
  nameEs: string;
  category: 'basic' | 'aroma' | 'defect' | 'other';
  score: number; // 0-10
  csvHeaderEn: string;
  csvHeaderEs: string;
  subAttributes?: SubAttribute[];
  isCalculated?: boolean;
}

export interface QualityAttribute {
  id: string;
  name: string; // Current display name
  nameEn: string;
  nameEs: string;
  score: number; // 0-10
  csvHeaderEn: string;
  csvHeaderEs: string;
}

export interface SampleMetadata {
  sampleCode: string;
  date: string;
  time: string;
  evaluator: string;
  evaluationType: 'cacao_mass' | 'chocolate';
  sampleInfo: string;
  notes: string;
  producerRecommendations: string;
}

export interface GradingSession {
  metadata: SampleMetadata;
  attributes: FlavorAttribute[];
  selectedQualityId?: string;
  globalQuality: number;
  language: 'en' | 'es';
  tdsProfile?: TDSProfile;
}

// TDS (Temporal Dominance of Sensations) Types
export type TDSMode = 'normal' | 'expert';

export interface TDSEvent {
  attrId: string;
  start: number; // seconds from tasting start
  end: number;   // seconds from tasting start
  phase: 'melting' | 'residual'; // determined by swallow timestamp
}

// TDS Analysis Result (moved from tdsCalculator to avoid circular dependency)
export interface TDSScoreResult {
  score: number;
  durationPercent: number;
  isFlagged: boolean;
  category: 'core' | 'complementary' | 'defect';
  zoneBreakdown?: {
    attack: number;
    body: number;
    finish: number;
  };
  originalScore?: number; // Score before boost
  boostDetails?: {
    amount: number;
    duration: number;
    type: 'individual' | 'aggregated';
  };
}

export interface TDSAnalysisResult {
  scores: Map<string, TDSScoreResult>;
  coreScores: Map<string, TDSScoreResult>;
  aromaIntensity: number;
  aromaNotes: string[];
  aftertasteIntensity: number;
  aftertasteQuality: 'positive' | 'neutral' | 'negative';
  dominantAftertaste: string | null; // The dominant flavor in the aftertaste phase
  aftertasteBoosts: { attrId: string; amount: number }[]; // Attributes boosted due to aftertaste presence
  kickSuggestions: string[]; // Suggestions based on initial kick (0-20%)
  qualitySuggestions: string[]; // Suggestions based on aftertaste quality
  qualityModifier: number;
  firstOnset: number;
  attackPhaseDuration: number;
  adjustedSwallowTime: number;
}

export interface TDSProfile {
  mode: TDSMode;
  events: TDSEvent[];
  swallowTime: number; // seconds from start when user clicked swallow
  totalDuration: number; // total profiling time in seconds
  analysis?: TDSAnalysisResult; // Persisted analysis
}
