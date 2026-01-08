
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
}
