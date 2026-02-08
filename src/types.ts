
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
  category: 'basic' | 'aroma' | 'defect' | 'other' | 'core' | 'complementary';
  score: number; // 0-10
  csvHeaderEn: string;
  csvHeaderEs: string;
  subAttributes?: SubAttribute[];
  isCalculated?: boolean;
  color?: string;
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
  totalDuration?: number; // Raw total duration in seconds
  isPresent?: boolean; // Explicit visibility flag
  isFlagged: boolean;
  category: 'core' | 'complementary' | 'defect' | string;
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
    reason?: 'aftertaste' | 'composition' | 'mixed';
  };
}

export interface TDSAnalysisResult {
  scores: Map<string, TDSScoreResult>;
  coreScores: Map<string, TDSScoreResult>;
  aromaIntensity: number;
  aromaPercent: number; // Max percentage in attack phase
  aromaNotes: string[];
  aftertasteIntensity: number;
  aftertastePercent: number; // Max percentage in finish phase
  aftertasteQuality: 'positive' | 'neutral' | 'negative';
  dominantAftertaste: string | null; // The dominant flavor in the aftertaste phase
  aftertasteBoosts: { attrId: string; amount: number }[]; // Attributes boosted due to aftertaste presence
  kickSuggestions: { en: string; es: string }[]; // Bilingual suggestions
  qualitySuggestions: { en: string; es: string }[]; // Bilingual suggestions
  qualityModifier: number;
  firstOnset: number;
  attackPhaseDuration: number;
  adjustedSwallowTime: number;
}

export interface TDSProfile {
  mode: TDSMode;
  id: string; // Evaluation ID
  events: TDSEvent[];
  swallowTime: number; // seconds from start when user clicked swallow
  totalDuration: number; // total profiling time in seconds
  analysis?: TDSAnalysisResult; // Persisted analysis
  lastModified?: number; // For cache invalidation
}

export interface StoredSample {
  id: string; // UUID
  sampleCode: string;
  sampleInfo: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  evaluator: string;
  evaluationType: 'cacao_mass' | 'chocolate';
  attributes: FlavorAttribute[];
  selectedQualityId?: string; // ID of the quality attribute selected
  globalQuality: number;
  notes: string;
  producerRecommendations: string;
  language: 'en' | 'es'; // Language used during evaluation
  tdsProfile?: TDSProfile;
  createdAt?: number;
  updatedAt?: number;
}
