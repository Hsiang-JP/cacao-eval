import { FlavorAttribute, QualityAttribute, SubAttribute, TDSAnalysisResult, TDSScoreResult, StoredSample, TDSEvent, TDSProfile, TDSMode } from '../../types';

import { EvaluationConfig } from '../types';
import { TDS_ZONES, SIGNIFICANCE_LEVEL, MIN_DURATION_FOR_PRESENCE, FINISH_SIGNIFICANT_DURATION, FINISH_DOMINANT_DURATION, AROMA_INTENSITY_THRESHOLDS, AFTERTASTE_INTENSITY_THRESHOLDS } from '../sensoryConstants';

// ============================================================================
// 1. DATA MODELS (Attributes)
// ============================================================================

const INITIAL_ATTRIBUTES: FlavorAttribute[] = [
    // 1. Cacao
    {
        id: 'cacao',
        name: 'Cacao',
        nameEn: 'Cacao',
        nameEs: 'Cacao',
        category: 'basic',
        score: 0,
        csvHeaderEn: 'Cacao',
        csvHeaderEs: 'Cacao',
        isCalculated: false,
        color: '#754c29'
    },
    // 2. Bitterness
    {
        id: 'bitterness',
        name: 'Bitterness',
        nameEn: 'Bitterness',
        nameEs: 'Amargor',
        category: 'basic',
        score: 0,
        csvHeaderEn: 'Bitterness',
        csvHeaderEs: 'Amargor',
        isCalculated: false,
        color: '#a01f65'
    },
    // 3. Astringency
    {
        id: 'astringency',
        name: 'Astringency',
        nameEn: 'Astringency',
        nameEs: 'Astringencia',
        category: 'basic',
        score: 0,
        csvHeaderEn: 'Astringency',
        csvHeaderEs: 'Astringencia',
        isCalculated: false,
        color: '#366d99'
    },
    // 4. Roast Degree
    {
        id: 'roast',
        name: 'Roast Degree',
        nameEn: 'Roast Degree',
        nameEs: 'Grado de tostado',
        category: 'basic',
        score: 0,
        csvHeaderEn: 'Roast Degree',
        csvHeaderEs: 'Grado de tostado',
        isCalculated: false,
        color: '#ebab21'
    },
    // 5. Acidity (Total) - Calculated
    {
        id: 'acidity',
        name: 'Acidity (Total)',
        nameEn: 'Acidity (Total)',
        nameEs: 'Acidez (Total)',
        category: 'basic',
        score: 0,
        csvHeaderEn: 'Total Acidity',
        csvHeaderEs: 'Acidez (Total)',
        isCalculated: true,
        color: '#00954c',
        subAttributes: [
            { id: 'acid_fruity', name: 'Fruit', nameEn: 'Fruit', nameEs: 'Frutal', csvHeaderEn: 'Acid - Fruit', csvHeaderEs: 'Acidez - Frutal', score: 0 },
            { id: 'acid_acetic', name: 'Acetic', nameEn: 'Acetic', nameEs: 'Acética', csvHeaderEn: 'Acid - Acetic', csvHeaderEs: 'Acidez - Acética', score: 0 },
            { id: 'acid_lactic', name: 'Lactic', nameEn: 'Lactic', nameEs: 'Láctica', csvHeaderEn: 'Acid - Lactic', csvHeaderEs: 'Acidez - Láctica', score: 0 },
            { id: 'acid_mineral', name: 'Mineral / Butyric', nameEn: 'Mineral / Butyric', nameEs: 'Mineral / Butírica', csvHeaderEn: 'Acid - Mineral and Butyric', csvHeaderEs: 'Acidez - Mineral / Butírica', score: 0 },
        ]
    },
    // 6. Fresh Fruit (Total) - Calculated
    {
        id: 'fresh_fruit',
        name: 'Fresh Fruit (Total)',
        nameEn: 'Fresh Fruit (Total)',
        nameEs: 'Fruta Fresca (Total)',
        category: 'aroma',
        score: 0,
        csvHeaderEn: 'Total Fresh Fruit',
        csvHeaderEs: 'Fruta Fresca (Total)',
        isCalculated: true,
        color: '#f6d809',
        subAttributes: [
            { id: 'ff_berry', name: 'Berry', nameEn: 'Berry', nameEs: 'Bayas', csvHeaderEn: 'Fruit - Berry', csvHeaderEs: 'Fruta - Bayas', score: 0 },
            { id: 'ff_citrus', name: 'Citrus', nameEn: 'Citrus', nameEs: 'Cítricos', csvHeaderEn: 'Fruit - Citrus', csvHeaderEs: 'Fruta - Cítricos', score: 0 },
            { id: 'ff_dark', name: 'Dark', nameEn: 'Dark', nameEs: 'Oscura', csvHeaderEn: 'Fruit - Dark', csvHeaderEs: 'Fruta - Oscura', score: 0 },
            { id: 'ff_pulp', name: 'Yellow / Orange / White flesh', nameEn: 'Yellow / Orange / White flesh', nameEs: 'Pulpa amarilla/Anaranjada/Blanca', csvHeaderEn: 'Fruit - Yellow / Orange / White flesh', csvHeaderEs: 'Fruta - Pulpa amarilla/Anaranjada/Blanca', score: 0 },
            { id: 'ff_tropical', name: 'Tropical', nameEn: 'Tropical', nameEs: 'Tropical', csvHeaderEn: 'Fruit - Tropical', csvHeaderEs: 'Fruta -  Tropical', score: 0 },
        ]
    },
    // 7. Browned Fruit (Total) - Calculated
    {
        id: 'browned_fruit',
        name: 'Browned Fruit (Total)',
        nameEn: 'Browned Fruit (Total)',
        nameEs: 'Fruta Marrón (Total)',
        category: 'aroma',
        score: 0,
        csvHeaderEn: 'Total Browned Fruit',
        csvHeaderEs: 'Fruta Marrón (Total)',
        isCalculated: true,
        color: '#431614',
        subAttributes: [
            { id: 'bf_dried', name: 'Dried', nameEn: 'Dried', nameEs: 'Seca', csvHeaderEn: 'Fruit - Dried', csvHeaderEs: 'Fruta - Seca', score: 0 },
            { id: 'bf_brown', name: 'Brown', nameEn: 'Brown', nameEs: 'Marrón', csvHeaderEn: 'Fruit - Brown', csvHeaderEs: 'Fruta - Marrón', score: 0 },
            { id: 'bf_overripe', name: 'Over ripe', nameEn: 'Over ripe', nameEs: 'Sobre madura', csvHeaderEn: 'Fruit - Over ripe', csvHeaderEs: 'Fruta - Sobre madura', score: 0 },
        ]
    },
    // 8. Vegetal (Total) - Calculated
    {
        id: 'vegetal',
        name: 'Vegetal (Total)',
        nameEn: 'Vegetal (Total)',
        nameEs: 'Vegetal (Total)',
        category: 'aroma',
        score: 0,
        csvHeaderEn: 'Total Vegetal',
        csvHeaderEs: 'Vegetal (Total)',
        isCalculated: true,
        color: '#006260',
        subAttributes: [
            { id: 'veg_green', name: 'Grassy / Green vegetal / Herbal', nameEn: 'Grassy / Green vegetal / Herbal', nameEs: 'Pasto / Vegetal verde / Hierba', csvHeaderEn: 'Vegetal - Grassy / Green vegetal / Herbal', csvHeaderEs: 'Vegetal - Pasto / Vegetal verde / Hierba', score: 0 },
            { id: 'veg_earthy', name: 'Earthy / Mushroom / Moss / Woodsy', nameEn: 'Earthy / Mushroom / Moss / Woodsy', nameEs: 'Terroso / Hongo / Musgo / Bosque', csvHeaderEn: 'Vegetal - Earthy / Mushroom / Moss / Woodsy', csvHeaderEs: 'Vegetal - Terroso / Hongo / Musgo / Bosque', score: 0 },
        ]
    },
    // 9. Floral (Total) - Calculated
    {
        id: 'floral',
        name: 'Floral (Total)',
        nameEn: 'Floral (Total)',
        nameEs: 'Floral (Total)',
        category: 'aroma',
        score: 0,
        csvHeaderEn: 'Total Floral',
        csvHeaderEs: 'Floral (Total)',
        isCalculated: true,
        color: '#8dc63f',
        subAttributes: [
            { id: 'flo_orange', name: 'Orange blossom', nameEn: 'Orange blossom', nameEs: 'Flor de azahar', csvHeaderEn: 'Floral - Orange blossom', csvHeaderEs: 'Floral - Flor de azahar', score: 0 },
            { id: 'flo_flowers', name: 'Flowers', nameEn: 'Flowers', nameEs: 'Flores', csvHeaderEn: 'Floral - Flowers', csvHeaderEs: 'Floral - Flores', score: 0 },
        ]
    },
    // 10. Woody (Total) - Calculated
    {
        id: 'woody',
        name: 'Woody (Total)',
        nameEn: 'Woody (Total)',
        nameEs: 'Madera (Total)',
        category: 'aroma',
        score: 0,
        csvHeaderEn: 'Total Woody',
        csvHeaderEs: 'Madera (Total)',
        isCalculated: true,
        color: '#a97c50',
        subAttributes: [
            { id: 'wood_light', name: 'Light', nameEn: 'Light', nameEs: 'Clara', csvHeaderEn: 'Wood - Light wood', csvHeaderEs: 'Madera - Clara', score: 0 },
            { id: 'wood_dark', name: 'Dark', nameEn: 'Dark', nameEs: 'Oscura', csvHeaderEn: 'Wood - Dark wood', csvHeaderEs: 'Madera - Oscura', score: 0 },
            { id: 'wood_resin', name: 'Resin', nameEn: 'Resin', nameEs: 'Resina', csvHeaderEn: 'Wood - Resin', csvHeaderEs: 'Madera - Resina', score: 0 },
        ]
    },
    // 11. Spice (Total) - Calculated
    {
        id: 'spice',
        name: 'Spice (Total)',
        nameEn: 'Spice (Total)',
        nameEs: 'Especia (Total)',
        category: 'aroma',
        score: 0,
        csvHeaderEn: 'Total Spice',
        csvHeaderEs: 'Especia (Total)',
        isCalculated: true,
        color: '#c33d32',
        subAttributes: [
            { id: 'sp_spices', name: 'Spices', nameEn: 'Spices', nameEs: 'Especias', csvHeaderEn: 'Spice - Spices', csvHeaderEs: 'Especia - Especias', score: 0 },
            { id: 'sp_tobacco', name: 'Tobacco', nameEn: 'Tobacco', nameEs: 'Tabaco', csvHeaderEn: 'Spice - Tobacco', csvHeaderEs: 'Especia - Tabaco', score: 0 },
            { id: 'sp_savory', name: 'Savory / Umami', nameEn: 'Savory / Umami', nameEs: 'Sazonado / Umami', csvHeaderEn: 'Spice - Savory / Umami', csvHeaderEs: 'Especia - Sazonado / Umami', score: 0 },
        ]
    },
    // 12. Nutty (Total) - Calculated
    {
        id: 'nutty',
        name: 'Nutty (Total)',
        nameEn: 'Nutty (Total)',
        nameEs: 'Nuez (Total)',
        category: 'aroma',
        score: 0,
        csvHeaderEn: 'Total Nutty',
        csvHeaderEs: 'Nuez (Total)',
        isCalculated: true,
        color: '#a0a368',
        subAttributes: [
            { id: 'nut_meat', name: 'Nut flesh', nameEn: 'Nut flesh', nameEs: 'Parte interna', csvHeaderEn: 'Nutty - Nut flesh', csvHeaderEs: 'Nuez - Parte interna', score: 0 },
            { id: 'nut_skin', name: 'Nut skins', nameEn: 'Nut skins', nameEs: 'Piel de la nuez', csvHeaderEn: 'Nutty - Nut skins', csvHeaderEs: 'Nuez - Piel de la nuez', score: 0 },
        ]
    },
    // 13. Caramel / Panela
    {
        id: 'caramel',
        name: 'Caramel / Panela',
        nameEn: 'Caramel / Panela',
        nameEs: 'Caramelo / Panela',
        category: 'aroma',
        score: 0,
        csvHeaderEn: 'Caramel / Panela',
        csvHeaderEs: 'Caramelo / Panela',
        isCalculated: false,
        color: '#bd7844'
    },
    // 14. Sweetness (only for chocolate)
    {
        id: 'sweetness',
        name: 'Sweetness (only for chocolate)',
        nameEn: 'Sweetness (only for chocolate)',
        nameEs: 'Dulzor (solo para chocolate)',
        category: 'other',
        score: 0,
        csvHeaderEn: 'Sweetness (for chocolate only)',
        csvHeaderEs: 'Dulzor (solo para chocolate)',
        isCalculated: false,
        color: '#ffc6e0'
    },
    // 15. Off-flavours (Total) - Calculated
    {
        id: 'defects',
        name: 'Off-flavours (Total)',
        nameEn: 'Off-flavours (Total)',
        nameEs: 'Sabores Atípicos / Defectos (Total)',
        category: 'defect',
        score: 0,
        csvHeaderEn: 'Total Off-flavours',
        csvHeaderEs: 'Sabores Atípicos / Defectos (Total)',
        isCalculated: true,
        color: '#a7a9ac',
        subAttributes: [
            { id: 'def_dirty', name: 'Dirty / Dusty', nameEn: 'Dirty / Dusty', nameEs: 'Sucio / Empolvado', csvHeaderEn: 'Dirty / Dusty', csvHeaderEs: 'Sucio / Empolvado', score: 0 },
            { id: 'def_mold', name: 'Musty', nameEn: 'Musty', nameEs: 'Humedad', csvHeaderEn: 'Musty', csvHeaderEs: 'Humedad', score: 0 },
            { id: 'def_moldy', name: 'Mouldy', nameEn: 'Mouldy', nameEs: 'Mohoso', csvHeaderEn: 'Mouldy', csvHeaderEs: 'Mohoso', score: 0 },
            { id: 'def_meaty', name: 'Meaty /Animal /Leather', nameEn: 'Meaty /Animal /Leather', nameEs: 'Carnoso/ Animal / Cuero', csvHeaderEn: 'Meaty / Animal / Leather', csvHeaderEs: 'Carnoso/ Animal / Cuero', score: 0 },
            { id: 'def_over', name: 'Over-fermented / Rotten fruit', nameEn: 'Over-fermented / Rotten fruit', nameEs: 'Sobre­fermentado / Fruta podrida', csvHeaderEn: 'Over-fermented / Rotten fruit', csvHeaderEs: 'Sobre­fermentado / Fruta podrida', score: 0 },
            { id: 'def_manure', name: 'Putrid /  Manure', nameEn: 'Putrid /  Manure', nameEs: 'Podrido / Estiércol', csvHeaderEn: 'Putrid /  Manure', csvHeaderEs: 'Podrido / Estiércol', score: 0 },
            { id: 'def_smoke', name: 'Smoky', nameEn: 'Smoky', nameEs: 'Humo', csvHeaderEn: 'Smoky', csvHeaderEs: 'Humo', score: 0 },
            { id: 'def_other', name: 'Other', nameEn: 'Other', nameEs: 'Otros', csvHeaderEn: 'Other Off-Flavour', csvHeaderEs: 'Otros', score: 0 },
        ]
    },
];

const INITIAL_QUALITY_ATTRIBUTES: QualityAttribute[] = [
    {
        id: 'uniqueness',
        name: 'Uniqueness',
        nameEn: 'Uniqueness',
        nameEs: 'Particularidad (calidad de único)',
        score: 0,
        csvHeaderEn: 'Uniqueness',
        csvHeaderEs: 'Particularidad (calidad de único)'
    },
    {
        id: 'complexity',
        name: 'Complexity',
        nameEn: 'Complexity',
        nameEs: 'Complejidad',
        score: 0,
        csvHeaderEn: 'Complexity',
        csvHeaderEs: 'Complejidad'
    },
    {
        id: 'balance',
        name: 'Harmony / Balance',
        nameEn: 'Harmony / Balance',
        nameEs: 'Armonía / Equilibrio',
        score: 0,
        csvHeaderEn: 'Harmony / Balance',
        csvHeaderEs: 'Armonía / Equilibrio'
    },
    {
        id: 'cleanliness',
        name: 'Clear / Clean / Bright',
        nameEn: 'Clear / Clean / Bright',
        nameEs: 'Claridad / Limpieza / Brillo',
        score: 0,
        csvHeaderEn: 'Clear / Clean / Bright',
        csvHeaderEs: 'Claridad / Limpieza / Brillo'
    },
    {
        id: 'q_acidity',
        name: 'Quality of Acidity',
        nameEn: 'Quality of Acidity',
        nameEs: 'Calidad de la acidez',
        score: 0,
        csvHeaderEn: 'Quality of Acidity',
        csvHeaderEs: 'Calidad de la acidez'
    },
    {
        id: 'q_astringency',
        name: 'Quality of Astringency',
        nameEn: 'Quality of Astringency',
        nameEs: 'Calidad de la astringencia',
        score: 0,
        csvHeaderEn: 'Quality of Astringency',
        csvHeaderEs: 'Calidad de la astringencia'
    },
    {
        id: 'q_bitterness',
        name: 'Quality of Bitterness',
        nameEn: 'Quality of Bitterness',
        nameEs: 'Calidad del amargor',
        score: 0,
        csvHeaderEn: 'Quality of Bitterness',
        csvHeaderEs: 'Calidad del amargor'
    },
    {
        id: 'q_aftertaste',
        name: 'Quality of Finish / Aftertaste',
        nameEn: 'Quality of Finish / Aftertaste',
        nameEs: 'Calidad del final / post-gusto',
        score: 0,
        csvHeaderEn: 'Quality of Finish / Aftertaste',
        csvHeaderEs: 'Calidad del final / regusto'
    },
];

const CSV_HEADERS_EN = [
    "Original Ordering",
    "Date Eval (press Ctrl and ;)",
    "Time Eval (press Ctrl and :)",
    "Panelist Initials",
    "CoEx Sample Code",
    "Sample Information",
    "Cacao",
    "Total Acidity",
    "Acid - Fruit",
    "Acid - Acetic",
    "Acid - Lactic",
    "Acid - Mineral and Butyric",
    "Bitterness",
    "Astringency",
    "Total Fresh Fruit",
    "Fruit - Berry",
    "Fruit - Citrus",
    "Fruit - Dark",
    "Fruit - Yellow / Orange / White flesh",
    "Fruit - Tropical",
    "Total Browned Fruit",
    "Fruit - Dried",
    "Fruit - Brown",
    "Fruit - Over ripe",
    "Total Vegetal",
    "Vegetal - Grassy / Green vegetal / Herbal",
    "Vegetal - Earthy / Mushroom / Moss / Woodsy",
    "Total Floral",
    "Floral - Orange blossom",
    "Floral - Flowers",
    "Total Woody",
    "Wood - Light wood",
    "Wood - Dark wood",
    "Wood - Resin",
    "Total Spice",
    "Spice - Spices",
    "Spice - Tobacco",
    "Spice - Savory / Umami",
    "Total Nutty",
    "Nutty - Nut flesh",
    "Nutty - Nut skins",
    "Caramel / Panela",
    "Sweetness (for chocolate only)",
    "Roast Degree",
    "Total Off-flavours",
    "Dirty / Dusty",
    "Musty",
    "Mouldy",
    "Meaty / Animal / Leather",
    "Over-fermented / Rotten fruit",
    "Putrid /  Manure",
    "Smoky",
    "Other Off-Flavour",
    "Other Off-Flavour Description",
    "Overall Flavour comment",
    "Feedback comment",
    "Global Quality (0 - 10)",
    "Uniqueness",
    "Complexity",
    "Harmony / Balance",
    "Clear / Clean / Bright",
    "Quality of Acidity",
    "Quality of Astringency",
    "Quality of Bitterness",
    "Quality of Finish / Aftertaste",
    // TDS Headers
    "TDS Mode",
    "TDS Total Duration (s)",
    "TDS Swallow Time (s)",
    "TDS Events JSON",
    "TDS Intervals - Cacao",
    "TDS Intervals - Acidity",
    "TDS Intervals - Bitterness",
    "TDS Intervals - Astringency",
    "TDS Intervals - Roast",
    "TDS Intervals - Fresh Fruit",
    "TDS Intervals - Browned Fruit",
    "TDS Intervals - Vegetal",
    "TDS Intervals - Floral",
    "TDS Intervals - Woody",
    "TDS Intervals - Spice",
    "TDS Intervals - Nutty",
    "TDS Intervals - Caramel",
    "TDS Intervals - Sweetness",
    "TDS Intervals - Defects",
    "TDS Aroma Intensity",
    "TDS Aftertaste Intensity",
    "TDS Aftertaste Quality",
    "TDS Dominant Aftertaste",
    "TDS Aftertaste Boosts",
    "TDS Attack Duration (s)",
    // Detailed TDS Metrics (Duration % and Score)
    "TDS Duration % - Cacao", "TDS Score - Cacao",
    "TDS Duration % - Acidity", "TDS Score - Acidity",
    "TDS Duration % - Bitterness", "TDS Score - Bitterness",
    "TDS Duration % - Astringency", "TDS Score - Astringency",
    "TDS Duration % - Roast", "TDS Score - Roast",
    "TDS Duration % - Fresh Fruit", "TDS Score - Fresh Fruit",
    "TDS Duration % - Browned Fruit", "TDS Score - Browned Fruit",
    "TDS Duration % - Vegetal", "TDS Score - Vegetal",
    "TDS Duration % - Floral", "TDS Score - Floral",
    "TDS Duration % - Woody", "TDS Score - Woody",
    "TDS Duration % - Spice", "TDS Score - Spice",
    "TDS Duration % - Nutty", "TDS Score - Nutty",
    "TDS Duration % - Caramel", "TDS Score - Caramel",
    "TDS Duration % - Sweetness", "TDS Score - Sweetness",
    "TDS Duration % - Defects", "TDS Score - Defects"
];

const CSV_HEADERS_ES = [
    "Orden Original",
    "Fecha de evaluación",
    "Hora de evaluación",
    "Evaluador",
    "ID de muestra",
    "Información de muestra",
    "Cacao",
    "Acidez (Total)",
    "Acidez - Frutal",
    "Acidez - Acética",
    "Acidez - Láctica",
    "Acidez - Mineral / Butírica",
    "Amargor",
    "Astringencia",
    "Fruta Fresca (Total)",
    "Fruta - Bayas",
    "Fruta - Cítricos",
    "Fruta - Oscura",
    "Fruta - Pulpa amarilla/Anaranjada/Blanca",
    "Fruta -  Tropical",
    "Fruta Marrón (Total)",
    "Fruta - Seca",
    "Fruta - Marrón",
    "Fruta - Sobre madura",
    "Vegetal (Total)",
    "Vegetal - Pasto / Vegetal verde / Hierba",
    "Vegetal - Terroso / Hongo / Musgo / Bosque",
    "Floral (Total)",
    "Floral - Flor de azahar",
    "Floral - Flores",
    "Madera (Total)",
    "Madera - Clara",
    "Madera - Oscura",
    "Madera - Resina",
    "Especia (Total)",
    "Especia - Especias",
    "Especia - Tabaco",
    "Especia - Sazonado / Umami",
    "Nuez (Total)",
    "Nuez - Parte interna",
    "Nuez - Piel de la nuez",
    "Caramelo / Panela",
    "Dulzor (solo para chocolate)",
    "Grado de tostado",
    "Sabores Atípicos / Defectos (Total)",
    "Sucio / Empolvado",
    "Humedad",
    "Mohoso",
    "Carnoso/ Animal / Cuero",
    "Sobre­fermentado / Fruta podrida",
    "Podrido / Estiércol",
    "Humo",
    "Otros",
    "Descripción",
    "Comentario de sabor general",
    "Comentarios de comentarios",
    "Calidad global (0 - 10)",
    "Particularidad (calidad de único)",
    "Complejidad",
    "Armonía / Equilibrio",
    "Claridad / Limpieza / Brillo",
    "Calidad de la acidez",
    "Calidad de la astringencia",
    "Calidad del amargor",
    "Calidad del final / post-gusto",
    // TDS Headers
    "Modo TDS",
    "Duración Total TDS (s)",
    "Tiempo de Tragado TDS (s)",
    "Eventos TDS JSON",
    "Intervalos TDS - Cacao",
    "Intervalos TDS - Acidez",
    "Intervalos TDS - Amargor",
    "Intervalos TDS - Astringencia",
    "Intervalos TDS - Tostado",
    "Intervalos TDS - Fruta Fresca",
    "Intervalos TDS - Fruta Marrón",
    "Intervalos TDS - Vegetal",
    "Intervalos TDS - Floral",
    "Intervalos TDS - Madera",
    "Intervalos TDS - Especia",
    "Intervalos TDS - Nuez",
    "Intervalos TDS - Caramelo",
    "Intervalos TDS - Dulzor",
    "Intervalos TDS - Defectos",
    "Intensidad de Aroma TDS",
    "Intensidad de Post-gusto TDS",
    "Calidad de Post-gusto TDS",
    "Post-gusto Dominante TDS",
    "Refuerzos de Post-gusto TDS",
    "Duración Ataque TDS (s)",
    // Detailed TDS Metrics
    "Duración % TDS - Cacao", "Puntaje TDS - Cacao",
    "Duración % TDS - Acidez", "Puntaje TDS - Acidez",
    "Duración % TDS - Amargor", "Puntaje TDS - Amargor",
    "Duración % TDS - Astringencia", "Puntaje TDS - Astringencia",
    "Duración % TDS - Tostado", "Puntaje TDS - Tostado",
    "Duración % TDS - Fruta Fresca", "Puntaje TDS - Fruta Fresca",
    "Duración % TDS - Fruta Marrón", "Puntaje TDS - Fruta Marrón",
    "Duración % TDS - Vegetal", "Puntaje TDS - Vegetal",
    "Duración % TDS - Floral", "Puntaje TDS - Floral",
    "Duración % TDS - Madera", "Puntaje TDS - Madera",
    "Duración % TDS - Especia", "Puntaje TDS - Especia",
    "Duración % TDS - Nuez", "Puntaje TDS - Nuez",
    "Duración % TDS - Caramelo", "Puntaje TDS - Caramelo",
    "Duración % TDS - Dulzor", "Puntaje TDS - Dulzor",
    "Duración % TDS - Defectos", "Puntaje TDS - Defectos"
];

// ============================================================================
// 2. SCORING LOGIC
// ============================================================================

const calculateAttributeScore = (id: string, subAttributes: SubAttribute[]): number => {
    // 1. Defect Logic (Standard)
    if (id === 'defects') {
        const total = subAttributes.reduce((sum, sub) => sum + sub.score, 0);
        return Math.min(10, total);
    }

    // 2. Acidity Logic (Average of highest 2)
    if (id === 'acidity') {
        const scores = subAttributes.map(s => s.score).sort((a, b) => b - a);
        const top2 = scores.slice(0, 2);
        if (top2.length === 0 || top2[0] === 0) return 0;
        const total = top2.reduce((sum, val) => sum + val, 0);
        return Math.round(total / top2.length);
    }

    // 3. Default Logic (Average of non-zero)
    const activeScores = subAttributes.map(s => s.score).filter(s => s > 0);
    if (activeScores.length === 0) return 0;

    const total = activeScores.reduce((sum, val) => sum + val, 0);
    return Math.round(total / activeScores.length);
};

// ============================================================================
// 3. TDS ANALYSIS LOGIC
// ============================================================================

const PARENT_CHILD_MAPPING: Record<string, string[]> = {
    acidity: ['acidity', 'fresh_fruit'],
    cacao: ['cacao', 'browned_fruit', 'nutty'],
    roast: ['roast', 'caramel'],
    bitterness: ['bitterness', 'vegetal', 'woody'],
    astringency: ['astringency', 'spice'],
};

export const CORE_ATTRIBUTES = ['cacao', 'acidity', 'bitterness', 'astringency', 'roast'];

export const COMPLEMENTARY_ATTRIBUTES = [
    'fresh_fruit', 'browned_fruit', 'vegetal', 'floral',
    'woody', 'spice', 'nutty', 'caramel', 'sweetness'
];

export const DEFECT_ATTRIBUTES = ['defects'];

export const ALL_ATTRIBUTES = [...CORE_ATTRIBUTES, ...COMPLEMENTARY_ATTRIBUTES, ...DEFECT_ATTRIBUTES];

const mapRange = (
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number => {
    const clamped = Math.max(inMin, Math.min(inMax, value));
    return outMin + ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin);
};

const mapDurationToScore = (
    durationPercent: number,
    category: 'core' | 'complementary' | 'defect',
    mode: 'normal' | 'expert' = 'expert'
): number => {
    if (category === 'defect') {
        if (durationPercent === 0) return 0;
        if (durationPercent <= 3.0) return 1;
        if (durationPercent <= SIGNIFICANCE_LEVEL) return 2;
        if (durationPercent <= 15) return Math.round(mapRange(durationPercent, SIGNIFICANCE_LEVEL, 15, 3, 5));
        if (durationPercent <= 30) return Math.round(mapRange(durationPercent, 16, 30, 6, 8));
        return Math.round(mapRange(durationPercent, 31, 60, 9, 10));
    }

    if (mode === 'normal' && category === 'core') {
        if (durationPercent <= 1.5) return 0;
        if (durationPercent <= 10) return 1;
        if (durationPercent <= 19) return 2;
        if (durationPercent <= 35) return Math.round(mapRange(durationPercent, 20, 35, 3, 4));
        if (durationPercent <= 60) return Math.round(mapRange(durationPercent, 36, 60, 5, 7));
        return Math.round(mapRange(durationPercent, 61, 90, 8, 10));
    }

    if (category === 'complementary') {
        if (durationPercent < 1.5) return 0;
        if (durationPercent <= 4.0) return 1;
        if (durationPercent <= SIGNIFICANCE_LEVEL) return 2;
        if (durationPercent <= 15) return Math.round(mapRange(durationPercent, SIGNIFICANCE_LEVEL, 15, 3, 4));
        if (durationPercent <= 30) return Math.round(mapRange(durationPercent, 16, 30, 5, 7));
        return Math.round(mapRange(durationPercent, 31, 60, 8, 10));
    }

    // Expert Mode - Core Attributes
    if (durationPercent < 2.0) return 0;
    if (durationPercent <= SIGNIFICANCE_LEVEL) return 1;
    if (durationPercent <= 20) return Math.round(mapRange(durationPercent, SIGNIFICANCE_LEVEL, 20, 2, 3));
    if (durationPercent <= 40) return Math.round(mapRange(durationPercent, 21, 40, 4, 6));
    return Math.round(mapRange(durationPercent, 41, 80, 7, 10));
};

export interface ZoneAnalysis {
    attack: Map<string, number>;
    body: Map<string, number>;
    finish: Map<string, number>;
}

const normalizeTime = (time: number, swallowTime: number): number => {
    if (swallowTime === 0) return time > 0 ? 1.0 : 0;
    return time / swallowTime;
};

const splitEventByZones = (
    event: TDSEvent,
    swallowTime: number
): { attack: number; body: number; finish: number } => {
    const startNorm = normalizeTime(event.start, swallowTime);
    const endNorm = normalizeTime(event.end, swallowTime);
    const result = { attack: 0, body: 0, finish: 0 };

    if (startNorm < TDS_ZONES.ATTACK.end && endNorm > TDS_ZONES.ATTACK.start) {
        const overlapStart = Math.max(startNorm, TDS_ZONES.ATTACK.start);
        const overlapEnd = Math.min(endNorm, TDS_ZONES.ATTACK.end);
        result.attack = (overlapEnd - overlapStart) * swallowTime;
    }
    if (startNorm < TDS_ZONES.BODY.end && endNorm > TDS_ZONES.BODY.start) {
        const overlapStart = Math.max(startNorm, TDS_ZONES.BODY.start);
        const overlapEnd = Math.min(endNorm, TDS_ZONES.BODY.end);
        result.body = (overlapEnd - overlapStart) * swallowTime;
    }
    if (endNorm > TDS_ZONES.FINISH.start) {
        const overlapStart = Math.max(startNorm, TDS_ZONES.FINISH.start);
        result.finish = (endNorm - overlapStart) * swallowTime;
    }
    return result;
};

const analyzeByZone = (events: TDSEvent[], swallowTime: number): ZoneAnalysis => {
    const attack = new Map<string, number>();
    const body = new Map<string, number>();
    const finish = new Map<string, number>();

    for (const event of events) {
        const zones = splitEventByZones(event, swallowTime);
        attack.set(event.attrId, (attack.get(event.attrId) || 0) + zones.attack);
        body.set(event.attrId, (body.get(event.attrId) || 0) + zones.body);
        finish.set(event.attrId, (finish.get(event.attrId) || 0) + zones.finish);
    }
    return { attack, body, finish };
};

const calculateBoost = (finishTime: number, finishDuration: number): number => {
    if (finishDuration <= FINISH_SIGNIFICANT_DURATION || finishTime <= 0) return 0;
    let boost = 0;
    if (finishTime > FINISH_DOMINANT_DURATION) boost += 2;
    else if (finishTime > FINISH_SIGNIFICANT_DURATION) boost += 1;
    if ((finishTime / finishDuration) > 0.5) boost += 1;
    return boost;
};

const analyzeTDS = (profile: TDSProfile): TDSAnalysisResult => {
    const { events, swallowTime: rawSwallowTime, totalDuration: rawTotalDuration, mode } = profile;

    const effectiveSwallowTime = (rawSwallowTime === null || rawSwallowTime === 0) ? rawTotalDuration : rawSwallowTime;
    const effectiveTotalDuration = rawTotalDuration;

    let startTime = 0;
    if (events.length > 0) {
        startTime = Math.min(...events.map(e => e.start));
    }

    const swallowTime = Math.max(0, effectiveSwallowTime - startTime);
    const totalDuration = Math.max(0, effectiveTotalDuration - startTime);

    const adjustedEvents = events.map(e => ({
        ...e,
        start: Math.max(0, e.start - startTime),
        end: Math.max(0, e.end - startTime)
    }));

    const zones = analyzeByZone(adjustedEvents, swallowTime);

    const attackDuration = swallowTime * TDS_ZONES.ATTACK.end;
    const bodyDuration = swallowTime * (TDS_ZONES.BODY.end - TDS_ZONES.BODY.start);
    const finishDuration = Math.max(0, totalDuration - swallowTime);

    const scores = new Map<string, TDSScoreResult>();
    const allAttrs = mode === 'normal' ? [...CORE_ATTRIBUTES, ...DEFECT_ATTRIBUTES] : ALL_ATTRIBUTES;

    for (const attrId of allAttrs) {
        const bodyTime = zones.body.get(attrId) || 0;
        const attackTime = zones.attack.get(attrId) || 0;
        const finishTime = zones.finish.get(attrId) || 0;

        const inMouthTime = attackTime + bodyTime;
        const durationPercent = swallowTime > 0 ? (inMouthTime / swallowTime) * 100 : 0;

        const isDefect = DEFECT_ATTRIBUTES.includes(attrId);
        const isCore = CORE_ATTRIBUTES.includes(attrId);
        const category = isDefect ? 'defect' : isCore ? 'core' : 'complementary';

        let score = mapDurationToScore(durationPercent, category, mode);

        const accumulatedBoost = calculateBoost(finishTime, finishDuration);

        let boostDetails: TDSScoreResult['boostDetails'] = undefined;

        if (accumulatedBoost > 0) {
            boostDetails = {
                amount: accumulatedBoost,
                duration: Math.round(finishTime * 10) / 10,
                type: 'individual',
                reason: 'aftertaste'
            };
        }

        const totalRaw = inMouthTime + finishTime;
        const finalDurationPercent = Math.min(durationPercent, 100);

        scores.set(attrId, {
            score,
            durationPercent: Math.round(finalDurationPercent * 10) / 10,
            totalDuration: Math.round(totalRaw * 10) / 10,
            isPresent: totalRaw > MIN_DURATION_FOR_PRESENCE,
            isFlagged: isCore && finalDurationPercent === 0,
            category,
            originalScore: undefined,
            boostDetails,
            zoneBreakdown: {
                attack: attackDuration > 0 ? Math.round((attackTime / attackDuration) * 1000) / 10 : 0,
                body: bodyDuration > 0 ? Math.round((bodyTime / bodyDuration) * 1000) / 10 : 0,
                finish: finishDuration > 0 ? Math.round((finishTime / finishDuration) * 1000) / 10 : 0,
            }
        });
    }

    const coreScores = new Map<string, TDSScoreResult>();

    if (mode === 'expert') {
        for (const coreAttr of CORE_ATTRIBUTES) {
            const selfBody = zones.body.get(coreAttr) || 0;
            const selfAttack = zones.attack.get(coreAttr) || 0;
            const selfTotal = selfBody + selfAttack;

            const children = PARENT_CHILD_MAPPING[coreAttr] || [];
            let childFinishTotal = 0;
            let childBoost = 0;

            if (children.length > 0) {
                for (const childId of children) {
                    const cFinish = zones.finish.get(childId) || 0;
                    if (cFinish > 0) {
                        childFinishTotal += cFinish;
                        childBoost += calculateBoost(cFinish, finishDuration);
                    }
                }
            }

            const totalDuration = selfTotal;
            const finalDurationPercent = swallowTime > 0 ? (totalDuration / swallowTime) * 100 : 0;

            let score = mapDurationToScore(finalDurationPercent, 'core', 'expert');
            const originalScore = score;

            const selfFinish = zones.finish.get(coreAttr) || 0;
            const selfBoost = calculateBoost(selfFinish, finishDuration);
            const accumulatedBoost = selfBoost + childBoost;

            let boostDetails: TDSScoreResult['boostDetails'] = undefined;
            if (accumulatedBoost > 0) {
                boostDetails = {
                    amount: accumulatedBoost,
                    duration: Math.round((selfFinish + childFinishTotal) * 10) / 10,
                    type: 'aggregated',
                    reason: selfBoost > 0 ? 'aftertaste' : 'mixed'
                };
            }

            coreScores.set(coreAttr, {
                score,
                durationPercent: Math.round(finalDurationPercent * 10) / 10,
                totalDuration: Math.round(totalDuration * 10) / 10,
                isPresent: totalDuration > 0,
                isFlagged: finalDurationPercent === 0,
                category: 'core',
                originalScore,
                boostDetails
            });
        }
    } else {
        for (const coreAttr of CORE_ATTRIBUTES) {
            const existing = scores.get(coreAttr);
            if (existing) {
                coreScores.set(coreAttr, existing);
            } else {
                coreScores.set(coreAttr, {
                    durationPercent: 0,
                    totalDuration: 0,
                    isPresent: false,
                    isFlagged: true,
                    category: 'core',
                    score: 0
                });
            }
        }
    }

    const aromaNotes: string[] = [];
    let maxAttackPercent = 0;

    for (const [attrId, duration] of zones.attack) {
        const percent = attackDuration > 0 ? (duration / attackDuration) * 100 : 0;
        if (percent > 10) {
            aromaNotes.push(attrId);
        }
        if (percent > maxAttackPercent) {
            maxAttackPercent = percent;
        }
    }

    let aromaIntensity = 3;
    if (maxAttackPercent > AROMA_INTENSITY_THRESHOLDS.DOMINANT) aromaIntensity = 8;
    else if (maxAttackPercent > AROMA_INTENSITY_THRESHOLDS.VERY_HIGH) aromaIntensity = 7;
    else if (maxAttackPercent > AROMA_INTENSITY_THRESHOLDS.HIGH) aromaIntensity = 6;
    else if (maxAttackPercent > AROMA_INTENSITY_THRESHOLDS.MEDIUM) aromaIntensity = 5;
    else if (maxAttackPercent > AROMA_INTENSITY_THRESHOLDS.LOW) aromaIntensity = 4;
    else if (maxAttackPercent === 0) aromaIntensity = 2;

    let maxFinishPercent = 0;
    let dominantFinishAttr: string | null = null;

    for (const [attrId, duration] of zones.finish) {
        const percent = finishDuration > 0 ? (duration / finishDuration) * 100 : 0;
        if (percent > maxFinishPercent) {
            maxFinishPercent = percent;
            dominantFinishAttr = attrId;
        }
    }

    let aftertasteIntensity = 3;
    if (maxFinishPercent > AFTERTASTE_INTENSITY_THRESHOLDS.DOMINANT) aftertasteIntensity = 8;
    else if (maxFinishPercent > AFTERTASTE_INTENSITY_THRESHOLDS.VERY_HIGH) aftertasteIntensity = 7;
    else if (maxFinishPercent > AFTERTASTE_INTENSITY_THRESHOLDS.HIGH) aftertasteIntensity = 6;
    else if (maxFinishPercent > AFTERTASTE_INTENSITY_THRESHOLDS.MEDIUM) aftertasteIntensity = 5;
    else if (maxFinishPercent > AFTERTASTE_INTENSITY_THRESHOLDS.LOW) aftertasteIntensity = 4;

    const positiveAttrs = ['cacao', 'fresh_fruit', 'browned_fruit', 'floral', 'caramel', 'sweetness', 'nutty'];
    const negativeAttrs = ['defects', 'astringency', 'bitterness'];

    let aftertasteQuality: 'positive' | 'neutral' | 'negative' = 'neutral';

    if (finishDuration > 2 && maxFinishPercent < 10) {
        aftertasteQuality = 'positive';
    } else if (dominantFinishAttr) {
        if (positiveAttrs.includes(dominantFinishAttr)) aftertasteQuality = 'positive';
        else if (negativeAttrs.includes(dominantFinishAttr)) aftertasteQuality = 'negative';
    }

    let qualityModifier = 0;
    if (aftertasteQuality === 'positive') qualityModifier += 0.5;
    if (aftertasteQuality === 'negative') qualityModifier -= 1.5;
    if (aromaIntensity >= 7) qualityModifier += 0.5;

    const kickSuggestions: { en: string; es: string }[] = [];
    const kickThreshold = attackDuration * 0.5;

    if (zones.attack.size > 0) {
        if ((zones.attack.get('acidity') || 0) > kickThreshold) {
            kickSuggestions.push({
                en: "High acidity in the attack often indicates Fruit notes. Did you perceive Citrus (Lemon/Lime) or Berry?",
                es: "Alta acidez en el ataque a menudo indica notas frutales. ¿Percibiste cítricos (limón/lima) o bayas?"
            });
        }
        if ((zones.attack.get('bitterness') || 0) > kickThreshold) {
            kickSuggestions.push({
                en: "Strong early bitterness can indicate 'Green/Vegetal' notes (if raw) or 'Coffee/Burnt' notes (if roasted). Check these categories.",
                es: "Un fuerte amargor inicial puede indicar notas 'Verdes/Vegetales' (si es crudo) o 'Café/Quemado' (si es tostado). Revisa estas categorías."
            });
        }
        if ((zones.attack.get('astringency') || 0) > kickThreshold) {
            kickSuggestions.push({
                en: "Sharp astringency often comes from 'Nut Skins' or 'Unripe Fruit'. Consider adding these to the profile.",
                es: "La astringencia aguda a menudo proviene de 'Pieles de nuez' o 'Fruta verde'. Considera agregar estos al perfil."
            });
        }
        if ((zones.attack.get('floral') || 0) > (attackDuration * 0.1)) {
            kickSuggestions.push({
                en: "Floral notes often carry subtle 'Spicy' (Coriander) or 'Light Wood' nuances. Did you perceive them?",
                es: "Las notas florales a menudo conllevan matices sutiles de 'Especias' (cilantro) o 'Madera ligera'. ¿Los percibiste?"
            });
        }
        if ((zones.attack.get('sweetness') || 0) > kickThreshold) {
            kickSuggestions.push({
                en: "Sweetness in dark chocolate is often aromatic. Check for 'Caramel/Panela', 'Malt', or 'Vanilla'.",
                es: "El dulzor en el chocolate oscuro suele ser aromático. Busca 'Caramelo/Panela', 'Malta' o 'Vainilla'."
            });
        }
    }

    const qualitySuggestions: { en: string; es: string }[] = [];

    const hasFinish = (id: string) => (zones.finish.get(id) || 0) > 0;

    const defectScore = scores.get('defects')?.score || 0;

    if (defectScore > 0) {
        if (defectScore >= 3) {
            qualitySuggestions.push({
                en: "Defect Intensity 3+ (Clearly characterizing). Recommend Global Quality 0-3.",
                es: "Intensidad de defecto 3+ (Claramente característico). Se recomienda Calidad Global 0-3."
            });
        } else if (defectScore >= 1) {
            qualitySuggestions.push({
                en: "Defect Intensity 1-2 (Low intensity). Recommend Global Quality 4-6.",
                es: "Intensidad de defecto 1-2 (Baja intensidad). Se recomienda Calidad Global 4-6."
            });
        }
    }

    if (defectScore === 0) {
        if (aftertasteQuality === 'positive' && aromaIntensity >= 5) {
            qualitySuggestions.push({
                en: "Clean sample (Absent defects). Recommend Global Quality 7-10.",
                es: "Muestra limpia (Defectos ausentes). Se recomienda Calidad Global 7-10."
            });
        }
    }

    const isUnbalancedPotential = hasFinish('acidity') && hasFinish('bitterness') && !hasFinish('fresh_fruit') && !hasFinish('browned_fruit');

    if (isUnbalancedPotential) {
        if ((zones.finish.get('acidity')! + zones.finish.get('bitterness')!) > (finishDuration * 0.5)) {
            if (mode === 'expert') {
                qualitySuggestions.push({
                    en: "Unbalanced, harsh finish (Sour+Bitter without Fruit). Suggest Low Quality.",
                    es: "Final desequilibrado y áspero (Acidez+Amargor sin fruta). Sugiere Baja Calidad."
                });
            } else {
                qualitySuggestions.push({
                    en: "Harsh finish (Sour+Bitter). If no Fruit was perceived, suggest Low Quality.",
                    es: "Final áspero (Acidez+Amargor). Si no se percibió fruta, sugiere Baja Calidad."
                });
            }
        }
    }

    if (hasFinish('fresh_fruit') && hasFinish('acidity') && hasFinish('sweetness')) {
        qualitySuggestions.push({
            en: "Bright, complex finish detected (Fruit+Acid+Sweet). Suggest Global Quality 8–10.",
            es: "Final brillante y complejo detectado (Fruta+Acidez+Dulzor). Sugiere Calidad Global 8–10."
        });
    }

    if (mode === 'normal' && hasFinish('acidity') && hasFinish('cacao') && !hasFinish('bitterness') && !hasFinish('astringency')) {
        qualitySuggestions.push({
            en: "Clean Cacao + Acidity finish detected. If fruity notes were present, consider Global Quality 8-10.",
            es: "Final limpio de Cacao + Acidez. Si hubo notas frutales, considera Calidad Global 8-10."
        });
    }

    if (hasFinish('cacao') && hasFinish('nutty') && (hasFinish('woody') || hasFinish('spice'))) {
        qualitySuggestions.push({
            en: "Solid, comforting cacao base (Cocoa+Nutty+Woody). Suggest Global Quality 7–9.",
            es: "Base de cacao sólida y reconfortante (Cacao+Nuez+Madera). Sugiere Calidad Global 7–9."
        });
    }

    const aftertasteBoosts: { attrId: string; amount: number }[] = [];
    scores.forEach((result, attrId) => {
        if (result.boostDetails && result.boostDetails.amount > 0) {
            aftertasteBoosts.push({ attrId, amount: result.boostDetails.amount });
        }
    });
    coreScores.forEach((result, attrId) => {
        if (result.boostDetails && result.boostDetails.amount > 0) {
            aftertasteBoosts.push({ attrId, amount: result.boostDetails.amount });
        }
    });

    return {
        scores,
        coreScores,
        aromaIntensity,
        aromaPercent: Math.round(maxAttackPercent * 10) / 10,
        aromaNotes,
        aftertasteIntensity,
        aftertastePercent: Math.round(maxFinishPercent * 10) / 10,
        aftertasteQuality,
        dominantAftertaste: dominantFinishAttr,
        aftertasteBoosts,
        kickSuggestions,
        qualitySuggestions,
        qualityModifier,
        firstOnset: startTime,
        attackPhaseDuration: attackDuration,
        adjustedSwallowTime: swallowTime
    };
};

// Helper to export TDS intervals as JSON (Moved from tdsCalculator to break circular dependency)
const getTDSIntervalsJson = (sample: StoredSample, attrId: string): string => {
    if (!sample.tdsProfile?.events) return '';
    const events = sample.tdsProfile.events.filter(e => e.attrId === attrId);
    if (events.length === 0) return '';

    const intervals = events.map(e => ({
        start: Math.round(e.start * 100) / 100,
        end: Math.round(e.end * 100) / 100
    }));

    // Return JSON string escaped for CSV
    return `"${JSON.stringify(intervals).replace(/"/g, '""')}"`;
};

export const CacaoConfig: EvaluationConfig = {
    id: 'cacao_mass',
    name: { en: 'Cacao Mass', es: 'Masa de Cacao' },
    assets: {
        logo: 'logo-cacao.svg', // Assuming this is in public/
        flavorWheel: {
            en: 'flavor_wheel_en.png',
            es: 'flavor_wheel_es.png'
        },
        scoreInstruction: {
            en: 'score_instruction_en.png',
            es: 'score_instruction_es.png'
        }
    },
    attributes: INITIAL_ATTRIBUTES,
    qualityAttributes: INITIAL_QUALITY_ATTRIBUTES,
    // CSV Export
    csv: {
        headers: {
            en: CSV_HEADERS_EN,
            es: CSV_HEADERS_ES
        },
        getRow: (sample: StoredSample, language: 'en' | 'es'): (string | number)[] => {
            const getDate = () => {
                if (language === 'es' && sample.date) {
                    const parts = sample.date.split('-');
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
                return sample.date;
            };

            // 1. Create a Map for O(1) attribute access
            const attrMap = new Map<string, FlavorAttribute>();
            sample.attributes.forEach(attr => attrMap.set(attr.id, attr));

            // 2. Helper to get scores safely
            const getScore = (attrId: string, subId?: string): number => {
                const attr = attrMap.get(attrId);
                if (!attr) return 0;
                if (subId && attr.subAttributes) {
                    return attr.subAttributes.find(s => s.id === subId)?.score || 0;
                }
                return attr.score;
            };

            // 3. Helper to get sub-attribute description safely
            const getDescription = (attrId: string, subId: string): string => {
                const attr = attrMap.get(attrId);
                return attr?.subAttributes?.find(s => s.id === subId)?.description || '';
            };

            // 4. Prepare TDS Analysis Data
            let analysis: TDSAnalysisResult | null = null;
            if (sample.tdsProfile) {
                if (sample.tdsProfile.analysis) {
                    analysis = sample.tdsProfile.analysis;
                } else {
                    try {
                        analysis = analyzeTDS(sample.tdsProfile);
                    } catch (e) {
                        // Ignore error
                    }
                }
            }

            const getTDSData = (attrId: string): { duration: string, score: string } => {
                if (!analysis || !analysis.scores) return { duration: '', score: '' };

                let result: TDSScoreResult | undefined;
                if (analysis.scores instanceof Map) {
                    result = analysis.scores.get(attrId);
                } else {
                    result = (analysis.scores as any)[attrId];
                }

                if (!result) return { duration: '', score: '' };

                return {
                    duration: result.durationPercent.toFixed(1) + '%',
                    score: result.score.toString()
                };
            };

            const getTDSMetric = (key: 'aromaIntensity' | 'aftertasteIntensity' | 'aftertasteQuality' | 'attackPhaseDuration'): string | number => {
                if (!analysis) return '';
                return analysis[key] || '';
            };

            // 5. Construct the row
            return [
                "", // Original Ordering
                getDate(),
                sample.time,
                sample.evaluator,
                sample.sampleCode,
                sample.sampleInfo,
                getScore('cacao'),

                // Acidity
                getScore('acidity'),
                getScore('acidity', 'acid_fruity'),
                getScore('acidity', 'acid_acetic'),
                getScore('acidity', 'acid_lactic'),
                getScore('acidity', 'acid_mineral'),

                getScore('bitterness'),
                getScore('astringency'),

                // Fresh Fruit
                getScore('fresh_fruit'),
                getScore('fresh_fruit', 'ff_berry'),
                getScore('fresh_fruit', 'ff_citrus'),
                getScore('fresh_fruit', 'ff_dark'),
                getScore('fresh_fruit', 'ff_pulp'),
                getScore('fresh_fruit', 'ff_tropical'),

                // Browned Fruit
                getScore('browned_fruit'),
                getScore('browned_fruit', 'bf_dried'),
                getScore('browned_fruit', 'bf_brown'),
                getScore('browned_fruit', 'bf_overripe'),

                // Vegetal
                getScore('vegetal'),
                getScore('vegetal', 'veg_green'),
                getScore('vegetal', 'veg_earthy'),

                // Floral
                getScore('floral'),
                getScore('floral', 'flo_orange'),
                getScore('floral', 'flo_flowers'),

                // Woody
                getScore('woody'),
                getScore('woody', 'wood_light'),
                getScore('woody', 'wood_dark'),
                getScore('woody', 'wood_resin'),

                // Spice
                getScore('spice'),
                getScore('spice', 'sp_spices'),
                getScore('spice', 'sp_tobacco'),
                getScore('spice', 'sp_savory'),

                // Nutty
                getScore('nutty'),
                getScore('nutty', 'nut_meat'),
                getScore('nutty', 'nut_skin'),

                getScore('caramel'),
                getScore('sweetness'),
                getScore('roast'),

                // Defects
                getScore('defects'),
                getScore('defects', 'def_dirty'),
                getScore('defects', 'def_mold'),
                getScore('defects', 'def_moldy'),
                getScore('defects', 'def_meaty'),
                getScore('defects', 'def_over'),
                getScore('defects', 'def_manure'),
                getScore('defects', 'def_smoke'),
                getScore('defects', 'def_other'),
                `"${getDescription('defects', 'def_other').replace(/"/g, '""')}"`,

                `"${sample.notes.replace(/"/g, '""')}"`,
                `"${sample.producerRecommendations.replace(/"/g, '""')}"`,
                sample.globalQuality,
                sample.selectedQualityId === 'uniqueness' ? 10 : 0,
                sample.selectedQualityId === 'complexity' ? 10 : 0,
                sample.selectedQualityId === 'balance' ? 10 : 0,
                sample.selectedQualityId === 'cleanliness' ? 10 : 0,
                sample.selectedQualityId === 'q_acidity' ? 10 : 0,
                sample.selectedQualityId === 'q_astringency' ? 10 : 0,
                sample.selectedQualityId === 'q_bitterness' ? 10 : 0,
                sample.selectedQualityId === 'q_aftertaste' ? 10 : 0,

                // TDS Columns
                sample.tdsProfile?.mode || '',
                sample.tdsProfile?.totalDuration || '',
                sample.tdsProfile?.swallowTime || '',
                sample.tdsProfile?.events ? `"${JSON.stringify(sample.tdsProfile.events).replace(/"/g, '""')}"` : '',
                // Aggregated TDS intervals per attribute
                getTDSIntervalsJson(sample, 'cacao'),
                getTDSIntervalsJson(sample, 'acidity'),
                getTDSIntervalsJson(sample, 'bitterness'),
                getTDSIntervalsJson(sample, 'astringency'),
                getTDSIntervalsJson(sample, 'roast'),
                getTDSIntervalsJson(sample, 'fresh_fruit'),
                getTDSIntervalsJson(sample, 'browned_fruit'),
                getTDSIntervalsJson(sample, 'vegetal'),
                getTDSIntervalsJson(sample, 'floral'),
                getTDSIntervalsJson(sample, 'woody'),
                getTDSIntervalsJson(sample, 'spice'),
                getTDSIntervalsJson(sample, 'nutty'),
                getTDSIntervalsJson(sample, 'caramel'),
                getTDSIntervalsJson(sample, 'sweetness'),
                getTDSIntervalsJson(sample, 'defects'),

                // New columns: Aroma & Aftertaste Intensity/Quality
                getTDSMetric('aromaIntensity'),
                getTDSMetric('aftertasteIntensity'),
                getTDSMetric('aftertasteQuality'),
                // Dominant Aftertaste and Aftertaste Boosts
                analysis?.dominantAftertaste || '',
                analysis?.aftertasteBoosts?.length
                    ? analysis.aftertasteBoosts.map(b => `${b.attrId} +${b.amount}`).join(', ')
                    : '',
                getTDSMetric('attackPhaseDuration'), // Attack Duration

                // Detailed TDS Metrics (Duration %, Score)
                ...['cacao', 'acidity', 'bitterness', 'astringency', 'roast', 'fresh_fruit', 'browned_fruit',
                    'vegetal', 'floral', 'woody', 'spice', 'nutty', 'caramel', 'sweetness', 'defects']
                    .flatMap(id => {
                        const d = getTDSData(id);
                        return [d.duration, d.score];
                    })
            ];
        }
    },
    scoring: {
        calculateAttributeScore,
    },
    tds: {
        analyze: analyzeTDS
    },
    meta: {
        primaryAttributeIds: ['cacao', 'bitterness', 'astringency', 'roast', 'acidity'],
        radarAttributeIds: [
            'cacao', 'acidity', 'bitterness', 'astringency',
            'fresh_fruit', 'browned_fruit', 'vegetal', 'floral',
            'woody', 'spice', 'nutty', 'caramel',
            'sweetness', 'defects', 'roast'
        ],
        defectAttributeIds: ['defects']
    }
};
