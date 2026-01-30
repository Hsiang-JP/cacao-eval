import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Header from '../components/Header';
import ScoreSlider from '../components/ScoreSlider';
import FlavorRadar from '../components/FlavorRadar';
import MobileNav from '../components/MobileNav';
import Footer from '../components/Footer';
import { GradingSession, SampleMetadata, QualityAttribute, SubAttribute } from '../types';
import {
  INITIAL_ATTRIBUTES,
  INITIAL_QUALITY_ATTRIBUTES,
  TRANSLATIONS,

} from '../constants';
import { RefreshCw, CheckCircle, Play, FileText, ChevronDown, ChevronUp, Save, Plus } from 'lucide-react';
import { dbService, StoredSample } from '../services/dbService';
import { getAttributeColor } from '../utils/colors';
import { getCurrentISODate, getCurrentTime } from '../utils/dateUtils';
// ChartJS registration is handled in FlavorRadar.tsx

import { useLanguage } from '../context/LanguageContext';

const EvaluatePage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sampleId = searchParams.get('id');

  // const [language, setLanguage] = useState<'en' | 'es'>('en'); // Lifted to App
  const [isEvaluationStarted, setIsEvaluationStarted] = useState(false);
  const [isGlobalQualityExpanded, setIsGlobalQualityExpanded] = useState(true);
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);

  // Reference for the Radar Chart to export image for PDF
  const chartRef = useRef<any>(null);

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

  useEffect(() => {
    setSession(prev => ({ ...prev, language }));
  }, [language]);

  // Load sample if ID is present
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
            language: language
          });
          setIsEvaluationStarted(true);
        }
      };
      loadSample();
    }
  }, [sampleId]);

  // Unlock function for editing called by a new button or existing flow?
  // For now, let's add a "Edit this evaluation" button if it's loaded and ended?
  // actually, let's just make it editable by default to fix "View Details" linking to "New Evaluation" behavior.
  // User can click "End" again to seal it.

  // Revised approach: Set Ended = true to show the "Result" view (radar etc), 
  // but we need a way to "Unlock" or just have it open. 
  // If inputs are disabled, they can't edit.
  // The user probably wants to SEE the data first. 
  // Let's set Started=true, Ended=true. 
  // And maybe add an 'Edit' button to unlock?
  // Or just Started=true, Ended=false to allow immediate editing.
  // Let's go with Started=true, Ended=false so they can tweak it if they want.
  // BUT if I do Ended=false, the "Save" button might be hidden/disabled if logic requires Ended=true?
  // Check HandleSaveToLibrary: disabled={!isEvaluationEnded}
  // So to SAVE updates, it must be ENDED.
  // So let's load it as Started=true, Ended=true.
  // Then the user can click "Reset" or we need an "Edit" button to set Ended=false.
  // Or, simply change the "Save" button to typically be available?
  // The current UI shows "Save to Library" only when ended.

  // Let's stick to: Load as Started=true, Ended=true (Locked View).
  // This ensures they see the "Finished" state.
  // I will add a small "Edit" button if needed, or they can just Export.
  // Note: users complained "links to new evaluation", which means it was empty.
  // Filling it is the priority.

  // -- Helpers --



  // Helper to identify primary attributes (always visible with optional slider hide)
  const isPrimaryAttribute = (id: string): boolean => {
    const primaryIds = ['cacao', 'bitterness', 'astringency', 'roast', 'acidity'];
    return primaryIds.includes(id);
  };

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

  /* New Save Function with Duplicate Check */
  const handleSaveToLibrary = async () => {
    try {
      // 0. STRICT CHECK: Code, Date, Evaluator (Must be present)
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

      if (session.globalQuality <= 0) {
        const confirmGlobal = window.confirm(language === 'es'
          ? 'La Calidad Global es 0. ¿Desea guardar de todos modos?'
          : 'Global Quality score is 0. Do you want to save anyway?'
        );
        if (!confirmGlobal) return;
      }

      // 2. Check for duplicates (by Sample Code AND Evaluator AND Date)
      // (Variables code, evaluatorName, date already declared above)

      // Look for existing sample with THIS code
      const existingSamples = await dbService.searchBySampleCode(code);

      // Check for collision: matches Code AND Evaluator AND Date
      const collision = existingSamples.find(s =>
        s.sampleCode.toLowerCase() === code.toLowerCase() &&
        s.evaluator.toLowerCase() === evaluatorName.toLowerCase() &&
        s.date === date
      );

      let finalId = sampleId; // Default to current editing ID (if any)

      if (collision) {
        // If we found a sample with this code AND evaluator...
        if (sampleId && collision.id === sampleId) {
          // It's the same record we are editing. Just update.
          finalId = sampleId;
        } else {
          // It's a DIFFERENT record (collision!)
          // Prompt user that this Code+Evaluator+Date combo exists
          const confirmOverwrite = window.confirm(
            language === 'es'
              ? `Ya existe una muestra con código "${code}", evaluador "${evaluatorName}" y fecha "${date}". ¿Desea sobrescribirla?`
              : `A sample with code "${code}", evaluator "${evaluatorName}", and date "${date}" already exists. Do you want to overwrite it?`
          );

          if (!confirmOverwrite) {
            return; // User cancelled
          }

          // User said overwrite -> Use the EXISTING ID to replace it
          finalId = collision.id;
        }
      }

      // Prepare sample data for storage
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
      };

      // Save (create or update based on finalId)
      // If finalId is undefined (new unique sample), saveSample generates new UUID.
      const savedId = await dbService.saveSample(sampleData, finalId || undefined);

      // Show success toast
      alert(language === 'es'
        ? `✅ Muestra ${session.metadata.sampleCode} guardada exitosamente!`
        : `✅ Sample ${session.metadata.sampleCode} saved successfully!`
      );

      console.log('Sample saved with ID:', savedId);

      console.log('Sample saved with ID:', savedId);

      // If staying, update URL to reflect the new ID so subsequent saves just update
      if (savedId !== sampleId) {
        navigate(`/evaluate?id=${savedId}`, { replace: true });
      }

      // Show the post-save choices modal
      setShowPostSaveModal(true);

    } catch (error) {
      console.error('Failed to save sample:', error);
      alert(language === 'es'
        ? `❌ Error al guardar la muestra: ${error}`
        : `❌ Failed to save sample: ${error}`
      );
    }
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



  /* Removed static import of pdfService and ChartJS */



  return (
    <div className="flex flex-col min-h-screen bg-cacao-50 text-gray-800 font-sans">
      <Header />

      <main id="main-content" className="w-full px-4 md:px-8 space-y-8 mb-8 flex-grow">

        {/* Top Section: Metadata */}
        <section className={`bg-white p-6 rounded-xl shadow-sm border border-cacao-100 transition-opacity`}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.evaluator}</label>
              <input
                type="text"
                value={session.metadata.evaluator}
                onChange={(e) => handleMetadataChange('evaluator', e.target.value)}
                className="w-full p-2 bg-gray-50 border rounded-md disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.date} / {t.time}</label>
              <div className="flex gap-2">
                <div className="relative w-full">
                  <input
                    type="date"
                    required
                    value={session.metadata.date}
                    onChange={(e) => handleMetadataChange('date', e.target.value)}
                    className={`w-full p-2 bg-gray-50 border rounded-md disabled:bg-gray-100 ${language === 'es' && session.metadata.date ? 'text-transparent' : ''}`}
                  />
                  {language === 'es' && session.metadata.date && (
                    <div className="absolute inset-0 flex items-center pl-2 pointer-events-none text-gray-800 p-2 bg-gray-50 border border-transparent rounded-md">
                      {(() => {
                        const [y, m, d] = session.metadata.date.split('-');
                        return `${d}/${m}/${y}`;
                      })()}
                    </div>
                  )}
                </div>
                <input
                  type="time"
                  value={session.metadata.time}
                  onChange={(e) => handleMetadataChange('time', e.target.value)}
                  className="w-32 p-2 bg-gray-50 border rounded-md disabled:bg-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.code}</label>
              <input
                type="text"
                value={session.metadata.sampleCode}
                onChange={(e) => handleMetadataChange('sampleCode', e.target.value)}
                className="w-full p-2 bg-gray-50 border rounded-md font-mono disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.evaluationType}</label>
              <select
                value={session.metadata.evaluationType}
                onChange={(e) => handleMetadataChange('evaluationType', e.target.value)}
                className="w-full p-2 bg-gray-50 border rounded-md disabled:bg-gray-100"
              >
                <option value="cacao_mass">{t.cacaoMass}</option>
                <option value="chocolate">{t.chocolate}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.sampleInfoLabel}</label>
              <input
                type="text"
                value={session.metadata.sampleInfo}
                onChange={(e) => handleMetadataChange('sampleInfo', e.target.value)}
                className="w-full p-2 bg-gray-50 border rounded-md disabled:bg-gray-100"
              />
            </div>
          </div>
        </section>

        {/* Start Evaluation Button */}
        {!isEvaluationStarted && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleStartEvaluation}
              className="bg-cacao-600 hover:bg-cacao-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
            >
              <Play size={20} fill="currentColor" />
              {t.startEvaluation}
            </button>
          </div>
        )}

        {/* Main Content: 3-Column Layout */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity ${!isEvaluationStarted ? 'opacity-50' : 'opacity-100'}`}>

          {/* LEFT COLUMN (2/3 width): All Attributes */}
          <div className="lg:col-span-2 space-y-8">

            {/* Attributes List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-cacao-700 sticky top-20 bg-cacao-50 py-2 z-10">{t.basicAttributes}</h3>
              {session.attributes.map(attr => {
                const isPrimary = isPrimaryAttribute(attr.id);
                return (
                  <ScoreSlider
                    key={attr.id}
                    id={attr.id}
                    label={language === 'es' ? attr.nameEs : attr.nameEn}
                    value={attr.score}
                    subAttributes={attr.subAttributes?.map(sub => ({
                      ...sub,
                      name: language === 'es' ? sub.nameEs : sub.nameEn
                    }))}
                    onChange={(val) => handleAttributeChange(attr.id, val)}
                    onSubAttributeChange={(subId, val) => handleSubAttributeChange(attr.id, subId, val)}
                    onSubAttributeDescriptionChange={attr.id === 'defects' ? (subId, desc) => handleSubAttributeDescription(attr.id, subId, desc) : undefined}
                    language={language}
                    customColor={getAttributeColor(attr.id)}
                    isCalculated={attr.isCalculated}
                    disabled={!isEvaluationStarted}
                    defaultExpanded={isPrimary}
                  />
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN (1/3 width): Sidebar with Graph & Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Global Quality */}
              <div className={`bg-white rounded-xl shadow-sm border border-cacao-100 transition-all overflow-hidden ${(!isEvaluationStarted) ? 'opacity-80 pointer-events-none' : ''}`}>
                {/* Accordion Header */}
                <button
                  onClick={() => setIsGlobalQualityExpanded(!isGlobalQualityExpanded)}
                  disabled={!isEvaluationStarted}
                  aria-expanded={isGlobalQualityExpanded}
                  aria-controls="global-quality-content"
                  className="w-full p-4 flex justify-between items-center hover:bg-cacao-50 transition-colors active:bg-cacao-100 touch-manipulation min-h-[44px]"
                >
                  <span className="text-sm font-bold text-cacao-800 uppercase tracking-wide">{t.globalScore}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono font-bold text-cacao-800 min-w-[3rem] text-right">
                      {session.globalQuality}
                    </span>
                    {isGlobalQualityExpanded ? (
                      <ChevronUp size={20} className="text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Accordion Content */}
                <div
                  id="global-quality-content"
                  className="transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isGlobalQualityExpanded ? '500px' : '0',
                    opacity: isGlobalQualityExpanded ? 1 : 0
                  }}
                >
                  <div className="px-4 pb-4 space-y-6">
                    {/* Global Quality Slider */}
                    <div>
                      <div className="flex items-center gap-4">
                        <input
                          type="range" min="0" max="10" step="0.5"
                          value={session.globalQuality}
                          onChange={(e) => setSession(prev => ({ ...prev, globalQuality: parseFloat(e.target.value) }))}
                          disabled={!isEvaluationStarted}
                          className={`w-full h-8 md:h-4 bg-gray-200 rounded-lg appearance-none accent-cacao-800 touch-pan-y ${(!isEvaluationStarted) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                      </div>
                    </div>

                    {/* Quality Characteristic Selector */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 uppercase mb-2">{t.qualityCharacteristic}</h4>
                      <select
                        value={session.selectedQualityId || ''}
                        onChange={(e) => handleQualitySelect(e.target.value)}
                        disabled={!isEvaluationStarted}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-cacao-500 focus:ring-1 focus:ring-cacao-500 disabled:bg-gray-100 outline-none transition-all"
                      >
                        <option value="">{language === 'es' ? "Seleccionar..." : "Select..."}</option>
                        {qualityAttributes.map(q => (
                          <option key={q.id} value={q.id}>
                            {language === 'es' ? q.nameEs : q.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Feedback */}
              <div className={`bg-white p-6 rounded-xl shadow-sm border border-cacao-100 space-y-4 transition-opacity ${(!isEvaluationStarted) ? 'opacity-80 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.flavorNotes}</label>
                  <textarea
                    className="w-full p-3 bg-gray-50 border rounded-lg h-24 text-sm disabled:bg-gray-100"
                    value={session.metadata.notes}
                    onChange={(e) => handleMetadataChange('notes', e.target.value)}
                    disabled={!isEvaluationStarted}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.producerFeedback}</label>
                  <textarea
                    className="w-full p-3 bg-gray-50 border rounded-lg h-24 text-sm disabled:bg-gray-100"
                    value={session.metadata.producerRecommendations}
                    onChange={(e) => handleMetadataChange('producerRecommendations', e.target.value)}
                    disabled={!isEvaluationStarted}
                  />
                </div>
              </div>

              {/* Radar Chart */}
              <FlavorRadar ref={chartRef} attributes={session.attributes} />

              {/* End Evaluation & Actions - End Button Removed */}
              <div className="space-y-4">
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveToLibrary}
                    disabled={!isEvaluationStarted}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 border border-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={20} />
                    {language === 'es' ? 'Guardar en Biblioteca' : 'Save to Library'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/samples')}
                    className="w-full bg-white border border-cacao-200 text-cacao-700 font-bold py-3 rounded-xl shadow-sm hover:bg-cacao-50 transition-colors flex justify-center items-center gap-2"
                  >
                    <FileText size={20} />
                    {language === 'es' ? 'Ver Biblioteca' : 'View Library'}
                  </button>

                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full bg-white border border-gray-300 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors flex justify-center items-center gap-2 shadow-sm"
                >
                  <RefreshCw size={18} /> {t.reset}
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Post-Save Modal */}
      {showPostSaveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-6 transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {language === 'es' ? '¡Muestra Guardada!' : 'Sample Saved!'}
              </h3>
              <p className="text-gray-500">
                {language === 'es' ? '¿Qué operación desea realizar?' : 'What would you like to do next?'}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/samples')}
                className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-3 shadow-sm"
              >
                <FileText size={20} className="text-cacao-600" />
                {t.sampleLibrary}
              </button>

              <button
                onClick={() => {
                  setSession({
                    metadata: getInitialMetadata(),
                    attributes: JSON.parse(JSON.stringify(INITIAL_ATTRIBUTES)),
                    globalQuality: 0,
                    language
                  });
                  setIsEvaluationStarted(false);
                  setShowPostSaveModal(false);
                  window.scrollTo(0, 0);
                  navigate('/evaluate');
                }}
                className="w-full bg-cacao-600 hover:bg-cacao-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-3 shadow-md"
              >
                <Plus size={20} />
                {t.newEvaluation}
              </button>

              <button
                onClick={() => setShowPostSaveModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {language === 'es' ? 'Seguir editando' : 'Keep editing'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <MobileNav
        attributes={session.attributes}
        language={language}
        isEvaluationStarted={isEvaluationStarted}
      />
    </div>
  );
};

export default EvaluatePage;