import { useState, useEffect } from 'react';
import {
    GradingSession,
    SampleMetadata,
    QualityAttribute,
    SubAttribute,
    TDSProfile
} from '../types';
import {
    INITIAL_ATTRIBUTES,
    INITIAL_QUALITY_ATTRIBUTES
} from '../constants';
import { dbService, StoredSample } from '../services/dbService';
import { getCurrentISODate, getCurrentTime } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import { applyTDSScoresToAttributes, analyzeTDS } from '../utils/tdsCalculator';

export const useGradingSession = (sampleId: string | null) => {
    const { language, t } = useLanguage();
    const [isEvaluationStarted, setIsEvaluationStarted] = useState(false);
    const [isGlobalQualityExpanded, setIsGlobalQualityExpanded] = useState(true);
    const [showPostSaveModal, setShowPostSaveModal] = useState(false);

    // Initial State Setup
    const getInitialMetadata = (): SampleMetadata => ({
        sampleCode: '',
        date: '',
        time: '',
        evaluator: '',
        evaluationType: 'cacao_mass',
        sampleInfo: '',
        notes: '',
        producerRecommendations: ''
    });

    const [session, setSession] = useState<GradingSession>({
        metadata: getInitialMetadata(),
        attributes: JSON.parse(JSON.stringify(INITIAL_ATTRIBUTES)),
        globalQuality: 0,
        language: 'en'
    });

    const [qualityAttributes] = useState<QualityAttribute[]>(
        JSON.parse(JSON.stringify(INITIAL_QUALITY_ATTRIBUTES))
    );

    // Sync language
    useEffect(() => {
        setSession(prev => ({ ...prev, language }));
    }, [language]);

    // Load sample
    useEffect(() => {
        if (sampleId) {
            const loadSample = async () => {
                const storedSample = await dbService.getSample(sampleId);
                if (storedSample) {
                    setSession({
                        metadata: {
                            sampleCode: storedSample.sampleCode,
                            date: storedSample.date,
                            time: storedSample.time,
                            evaluator: storedSample.evaluator,
                            evaluationType: storedSample.evaluationType,
                            sampleInfo: storedSample.sampleInfo,
                            notes: storedSample.notes,
                            producerRecommendations: storedSample.producerRecommendations
                        },
                        attributes: storedSample.attributes,
                        globalQuality: storedSample.globalQuality,
                        selectedQualityId: storedSample.selectedQualityId,
                        language: language,
                        tdsProfile: storedSample.tdsProfile
                    });
                    setIsEvaluationStarted(true);
                }
            };
            loadSample();
        }
    }, [sampleId, language]);

    // Logic Helpers
    const calculateAttributeScore = (id: string, subAttributes: SubAttribute[]): number => {
        const scores = subAttributes.map(s => s.score);
        const sorted = [...scores].sort((a, b) => b - a); // Descending
        const getVal = (k: number) => sorted[k - 1] || 0; // 1-based index

        let total = 0;

        switch (id) {
            case 'acidity':
            case 'defects':
                total = scores.reduce((a, b) => a + b, 0);
                break;
            case 'fresh_fruit':
                total = getVal(1) + (getVal(2) * 0.75) + ((getVal(3) + getVal(4) + getVal(5)) / 3);
                break;
            case 'browned_fruit':
            case 'woody':
            case 'spice':
                total = getVal(1) + (getVal(2) * 0.75) + (getVal(3) / 3);
                break;
            case 'vegetal':
            case 'floral':
            case 'nutty':
                total = getVal(1) + (getVal(2) * 0.75);
                break;
            default:
                total = 0;
        }

        const cappedTotal = Math.min(total, 10);
        return Math.round((cappedTotal + Number.EPSILON) * 10) / 10;
    };

    // Handlers
    const handleMetadataChange = (field: keyof SampleMetadata, value: string) => {
        setSession(prev => ({
            ...prev,
            metadata: { ...prev.metadata, [field]: value }
        }));
    };

    const handleAttributeChange = (id: string, value: number) => {
        setSession(prev => {
            const newAttributes = prev.attributes.map(attr => {
                if (attr.id === id) {
                    return { ...attr, score: value };
                }
                return attr;
            });
            return { ...prev, attributes: newAttributes };
        });
    };

    const handleSubAttributeChange = (attrId: string, subId: string, value: number) => {
        setSession(prev => {
            const newAttributes = prev.attributes.map(attr => {
                if (attr.id === attrId && attr.subAttributes) {
                    const newSubs = attr.subAttributes.map(sub =>
                        sub.id === subId ? { ...sub, score: value } : sub
                    );

                    let newScore = attr.score;
                    if (attr.isCalculated) {
                        newScore = calculateAttributeScore(attr.id, newSubs);
                    }

                    return { ...attr, score: newScore, subAttributes: newSubs };
                }
                return attr;
            });
            return { ...prev, attributes: newAttributes };
        });
    };

    const handleSubAttributeDescription = (attrId: string, subId: string, desc: string) => {
        setSession(prev => {
            const newAttributes = prev.attributes.map(attr => {
                if (attr.id === attrId && attr.subAttributes) {
                    return {
                        ...attr,
                        subAttributes: attr.subAttributes.map(sub =>
                            sub.id === subId ? { ...sub, description: desc } : sub
                        )
                    };
                }
                return attr;
            });
            return { ...prev, attributes: newAttributes };
        });
    };

    const handleQualitySelect = (id: string) => {
        setSession(prev => ({ ...prev, selectedQualityId: id }));
    };

    const handleStartEvaluation = () => {
        const dateStr = getCurrentISODate();
        const timeStr = getCurrentTime();

        setSession(prev => ({
            ...prev,
            metadata: { ...prev.metadata, date: dateStr, time: timeStr }
        }));
        setIsEvaluationStarted(true);
    };

    const handleReset = () => {
        if (window.confirm(t.confirmReset)) {
            setSession({
                metadata: getInitialMetadata(),
                attributes: JSON.parse(JSON.stringify(INITIAL_ATTRIBUTES)),
                globalQuality: 0,
                language
            });
            setIsEvaluationStarted(false);
            window.scrollTo(0, 0);
        }
    };

    const handleSaveToLibrary = async (navigate: (path: string, options?: any) => void) => {
        try {
            // 0. STRICT CHECK: Code, Date, Evaluator
            const code = session.metadata.sampleCode.trim();
            const evaluatorName = session.metadata.evaluator.trim();
            const date = session.metadata.date;

            if (!code || !evaluatorName || !date) {
                const missing = [];
                if (!code) missing.push(language === 'es' ? 'Código de Muestra' : 'Sample Code');
                if (!evaluatorName) missing.push(language === 'es' ? 'Evaluador' : 'Evaluator');
                if (!date) missing.push(language === 'es' ? 'Fecha' : 'Date');

                alert(language === 'es'
                    ? `Por favor complete los siguientes campos obligatorios antes de guardar:\n- ${missing.join('\n- ')}`
                    : `Please complete the following required fields before saving:\n- ${missing.join('\n- ')}`
                );
                return;
            }

            // 1. CHECK REQUIRED SCORES (Warn only)
            const requiredAttributes = ['cacao', 'bitterness', 'astringency', 'roast', 'acidity'];
            const missingFields = requiredAttributes.filter(id => {
                const attr = session.attributes.find(a => a.id === id);
                return !attr || attr.score <= 0;
            });

            if (missingFields.length > 0) {
                const missingNames = missingFields.map(id => {
                    const attr = session.attributes.find(a => a.id === id);
                    return language === 'es' ? attr?.nameEs : attr?.nameEn;
                }).join(', ');

                const confirmSave = window.confirm(language === 'es'
                    ? `Los siguientes campos principales tienen valor 0 (Ausente): ${missingNames}.\n\n¿Desea guardar de todos modos?`
                    : `The following core attributes are set to 0 (Absent): ${missingNames}.\n\nDo you want to save anyway?`
                );
                if (!confirmSave) return;
            }

            // Check Global Quality (Warn only)
            if (session.globalQuality <= 0) {
                const confirmGlobal = window.confirm(language === 'es'
                    ? 'La Calidad Global es 0. ¿Desea guardar de todos modos?'
                    : 'Global Quality score is 0. Do you want to save anyway?'
                );
                if (!confirmGlobal) return;
            }

            // 2. Check for duplicates
            const existingSamples = await dbService.searchBySampleCode(code);
            const collision = existingSamples.find(s =>
                s.sampleCode.toLowerCase() === code.toLowerCase() &&
                s.evaluator.toLowerCase() === evaluatorName.toLowerCase() &&
                s.date === date
            );

            let finalId = sampleId;

            if (collision) {
                if (sampleId && collision.id === sampleId) {
                    finalId = sampleId;
                } else {
                    const confirmOverwrite = window.confirm(
                        language === 'es'
                            ? `Ya existe una muestra con código "${code}", evaluador "${evaluatorName}" y fecha "${date}". ¿Desea sobrescribirla?`
                            : `A sample with code "${code}", evaluator "${evaluatorName}", and date "${date}" already exists. Do you want to overwrite it?`
                    );
                    if (!confirmOverwrite) return;
                    finalId = collision.id;
                }
            }

            const sampleData: Omit<StoredSample, 'id' | 'createdAt' | 'updatedAt'> = {
                sampleCode: session.metadata.sampleCode,
                date: session.metadata.date,
                time: session.metadata.time,
                evaluator: session.metadata.evaluator,
                evaluationType: session.metadata.evaluationType,
                sampleInfo: session.metadata.sampleInfo,
                notes: session.metadata.notes,
                producerRecommendations: session.metadata.producerRecommendations,
                attributes: session.attributes,
                globalQuality: session.globalQuality,
                selectedQualityId: session.selectedQualityId,
                language: language,
                tdsProfile: session.tdsProfile,
            };

            const savedId = await dbService.saveSample(sampleData, finalId || undefined);

            alert(language === 'es'
                ? `✅ Muestra ${session.metadata.sampleCode} guardada exitosamente!`
                : `✅ Sample ${session.metadata.sampleCode} saved successfully!`
            );

            if (savedId !== sampleId) {
                navigate(`/evaluate?id=${savedId}`, { replace: true });
            }
            setShowPostSaveModal(true);

        } catch (error) {
            console.error('Failed to save sample:', error);
            alert(language === 'es'
                ? `❌ Error al guardar la muestra: ${error}`
                : `❌ Failed to save sample: ${error}`
            );
        }
    };

    // TDS Integration Helpers
    // TDS Integration Helpers
    const applyTDSData = (profile: TDSProfile, analysisResult: any, applyScores: boolean = true) => {
        let updatedAttributes = session.attributes;

        if (applyScores) {
            updatedAttributes = applyTDSScoresToAttributes(session.attributes, analysisResult.scores);
        }

        const updatedProfile = { ...profile, analysis: analysisResult };

        setSession(prev => ({
            ...prev,
            attributes: updatedAttributes,
            tdsProfile: updatedProfile
        }));
        setIsEvaluationStarted(true);
    };

    return {
        session,
        setSession,
        qualityAttributes,
        isEvaluationStarted,
        setIsEvaluationStarted,
        isGlobalQualityExpanded,
        setIsGlobalQualityExpanded,
        showPostSaveModal,
        setShowPostSaveModal,
        getInitialMetadata, // Exposed for reset logic in UI if needed
        handlers: {
            handleMetadataChange,
            handleAttributeChange,
            handleSubAttributeChange,
            handleSubAttributeDescription,
            handleQualitySelect,
            handleStartEvaluation,
            handleReset,
            handleSaveToLibrary,
            applyTDSData
        }
    };
};
