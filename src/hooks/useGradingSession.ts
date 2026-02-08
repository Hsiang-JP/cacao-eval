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
    INITIAL_QUALITY_ATTRIBUTES,
    currentConfig
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
    const [validationError, setValidationError] = useState<string | null>(null);

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
                        newScore = currentConfig.scoring.calculateAttributeScore(attr.id, newSubs);
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

    const handleReset = async (confirmDialog?: (msg: string) => Promise<boolean>) => {
        const confirmFn = confirmDialog || window.confirm;
        // Logic adapter: window.confirm returns boolean synchronously, but we treat it as async or sync
        // If we pass window.confirm, it returns true/false immediately.
        // If we pass async modal, it awaits.

        const proceed = await Promise.resolve(confirmFn(t('confirmReset')));

        if (proceed) {
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

    const handleSaveToLibrary = async (
        navigate: (path: string, options?: any) => void,
        confirmDialog?: (msg: string) => Promise<boolean>
    ) => {
        // Fallback to window.confirm if not provided (though we aim to replace it)
        const confirmFn = confirmDialog || (async (msg: string) => window.confirm(msg));
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

                setValidationError(t('validation.missingFields', { fields: missing.join('\n- ') }));
                return;
            }

            // 1. CHECK REQUIRED SCORES (Warn only)
            const requiredAttributes = currentConfig.meta.primaryAttributeIds;
            const missingFields = requiredAttributes.filter(id => {
                const attr = session.attributes.find(a => a.id === id);
                return !attr || attr.score <= 0;
            });

            if (missingFields.length > 0) {
                const missingNames = missingFields.map(id => {
                    const attr = session.attributes.find(a => a.id === id);
                    return language === 'es' ? attr?.nameEs : attr?.nameEn;
                }).join(', ');

                const confirmSave = await confirmFn(t('validation.zeroAttributes', { attributes: missingNames }));
                if (!confirmSave) return;
            }

            // Check Global Quality (Warn only)
            if (session.globalQuality <= 0) {
                const confirmGlobal = await confirmFn(t('validation.zeroGlobalQuality'));
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
                    const confirmOverwrite = await confirmFn(t('validation.overwriteSample', {
                        code,
                        evaluator: evaluatorName,
                        date
                    }));
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

            setValidationError(null); // Clear any previous errors (though alerts are different)
            // Success "Alert" -> We can just show the modal, but the user requested 'modal' for messages.
            // The success message is actually shown in the PostSaveModal anyway?
            // Wait, the code shows postSaveModal right after.
            // But before that it showed an alert.
            // Let's remove the alert completely since we have the PostSaveModal!

            // alert(language === 'es'
            //     ? `✅ Muestra ${session.metadata.sampleCode} guardada exitosamente!`
            //     : `✅ Sample ${session.metadata.sampleCode} saved successfully!`
            // );

            if (savedId !== sampleId) {
                navigate(`/evaluate?id=${savedId}`, { replace: true });
            }
            setShowPostSaveModal(true);

        } catch (error) {
            console.error('Failed to save sample:', error);
            setValidationError(t('validation.saveFailed', { error }));
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
        validationError, // Exposed for UI
        setValidationError,
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
