
import { FlavorAttribute, QualityAttribute } from './types';




import { CacaoConfig } from './config/products/cacao';
// Active Configuration
export const currentConfig = CacaoConfig;

// Export data models from config for backward compatibility
export const INITIAL_ATTRIBUTES = currentConfig.attributes;
export const INITIAL_QUALITY_ATTRIBUTES = currentConfig.qualityAttributes;

// Export CSV Headers
export const CSV_HEADERS_EN = currentConfig.csv.headers.en;
export const CSV_HEADERS_ES = currentConfig.csv.headers.es;
