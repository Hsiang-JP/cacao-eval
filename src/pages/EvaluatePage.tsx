import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Papa from 'papaparse';
import Header from '../components/Header';
import ScoreSlider from '../components/ScoreSlider';
import FlavorRadar from '../components/FlavorRadar';
import MobileNav from '../components/MobileNav';
import { GradingSession, SampleMetadata, QualityAttribute, SubAttribute } from '../types';
import {
  INITIAL_ATTRIBUTES,
  INITIAL_QUALITY_ATTRIBUTES,
  TRANSLATIONS,
  CSV_HEADERS_EN,
  CSV_HEADERS_ES
} from '../constants';
import { RefreshCw, CheckCircle, Play, Download, FileText, ChevronDown, ChevronUp, Save } from 'lucide-react';
import IndividualBarChart from '../components/comparison/IndividualBarChart';
import { dbService, StoredSample } from '../services/dbService';
// ChartJS registration is handled in FlavorRadar.tsx

interface EvaluatePageProps {
  language: 'en' | 'es';
  onLanguageChange: (lang: 'en' | 'es') => void;
}

const EvaluatePage: React.FC<EvaluatePageProps> = ({ language, onLanguageChange }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sampleId = searchParams.get('id');

  // const [language, setLanguage] = useState<'en' | 'es'>('en'); // Lifted to App
  const t = TRANSLATIONS[language];
  const [isEvaluationStarted, setIsEvaluationStarted] = useState(false);
  const [isEvaluationEnded, setIsEvaluationEnded] = useState(false);
  const [isGlobalQualityExpanded, setIsGlobalQualityExpanded] = useState(true);

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
          // Set state to allow viewing/editing
          setIsEvaluationStarted(true);
          // We assume saved samples are "in progress" or "ended". 
          // For now, let's treat them as accessible. 
          // If we want to lock them, we could set isEvaluationEnded(true).
          // But "View & Edit" implies we might want to change them.
          // Let's set Ended -> true so it looks "Complete" but user can still hit "Save" again to update?
          // Actually, if Ended is true, inputs might be disabled in the UI. 
          // Let's check the UI code... 
          // Yes, disabled={!isEvaluationStarted || isEvaluationEnded}
          // So if we want to Edit, we should NOT set isEvaluationEnded(true).
          // But if we want to just View, we might want it disabled.
          // Let's default to Editable for now (Started=true, Ended=false).
          setIsEvaluationEnded(true); // Locked by default
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

  const getAttributeColor = (id: string) => {
    switch (id) {
      case 'cacao': return '#754c29';
      case 'bitterness': return '#a01f65';
      case 'astringency': return '#366d99';
      case 'roast': return '#ebab21';
      case 'acidity': return '#00954c';
      case 'fresh_fruit': return '#f6d809';
      case 'browned_fruit': return '#431614';
      case 'vegetal': return '#006260';
      case 'floral': return '#8dc63f';
      case 'woody': return '#a97c50';
      case 'spice': return '#c33d32';
      case 'nutty': return '#a0a368';
      case 'caramel': return '#bd7844';
      case 'sweetness': return '#ffc6e0';
      case 'defects': return '#a7a9ac';
      default: return '#a0785a';
    }
  };

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

  const handleSaveToLibrary = async () => {
    try {
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

      const sampleId = await dbService.saveSample(sampleData);

      // Show success toast
      alert(language === 'es'
        ? `✅ Muestra ${session.metadata.sampleCode} guardada exitosamente!`
        : `✅ Sample ${session.metadata.sampleCode} saved successfully!`
      );

      console.log('Sample saved with ID:', sampleId);

      // Offer to view in library
      if (window.confirm(language === 'es' ? '¿Ver en la biblioteca?' : 'View in Library?')) {
        navigate('/samples');
      }
    } catch (error) {
      console.error('Failed to save sample:', error);
      alert(language === 'es'
        ? `❌ Error al guardar la muestra: ${error}`
        : `❌ Failed to save sample: ${error}`
      );
    }
  };

  const handleStartEvaluation = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

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
      setIsEvaluationEnded(false);
      window.scrollTo(0, 0);
    }
  };

  const handleEndEvaluation = () => {
    setIsEvaluationEnded(true);
  };

  /* Removed static import of pdfService and ChartJS */

  const handleDownloadPdf = async () => {
    const { generatePdf } = await import('../services/pdfService');
    const { generateShimmedSample, generateCSVRow } = await import('../services/csvService');
    // Capture chart image from the ref
    const chartImage = chartRef.current?.toBase64Image();
    generatePdf(session, chartImage);
  };

  const handleDownloadCsv = async () => {
    const { generateShimmedSample, generateCSVRow } = await import('../services/csvService');
    const headers = language === 'es' ? CSV_HEADERS_ES : CSV_HEADERS_EN;

    const shimmedSample = generateShimmedSample(session, language);
    const row = generateCSVRow(shimmedSample, language);

    // Use Papa.unparse to handle quoting and newlines correctly
    const csv = Papa.unparse({
      fields: headers,
      data: [row]
    }, {
      quotes: true // Force quotes on all fields to preserve strings like "002"
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CoEx_${session.metadata.sampleCode || 'Sample'}_${session.metadata.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-cacao-50 text-gray-800 font-sans pb-20">
      <Header language={language} onLanguageChange={onLanguageChange} />

      <main id="main-content" className="w-full px-4 md:px-8 space-y-8">

        {/* Top Section: Metadata */}
        <section className={`bg-white p-6 rounded-xl shadow-sm border border-cacao-100 transition-opacity ${isEvaluationEnded ? 'opacity-80 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.evaluator}</label>
              <input
                type="text"
                value={session.metadata.evaluator}
                onChange={(e) => handleMetadataChange('evaluator', e.target.value)}
                disabled={isEvaluationEnded}
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
                    disabled={isEvaluationEnded}
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
                  disabled={isEvaluationEnded}
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
                disabled={isEvaluationEnded}
                className="w-full p-2 bg-gray-50 border rounded-md font-mono disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.evaluationType}</label>
              <select
                value={session.metadata.evaluationType}
                onChange={(e) => handleMetadataChange('evaluationType', e.target.value)}
                disabled={isEvaluationEnded}
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
                disabled={isEvaluationEnded}
                className="w-full p-2 bg-gray-50 border rounded-md disabled:bg-gray-100"
              />
            </div>
          </div>
        </section>

        {/* Start Evaluation Button */}
        {!isEvaluationStarted && !isEvaluationEnded && (
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
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity ${!isEvaluationStarted && !isEvaluationEnded ? 'opacity-50' : 'opacity-100'}`}>

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
                    disabled={!isEvaluationStarted || isEvaluationEnded}
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
              <div className={`bg-white rounded-xl shadow-sm border border-cacao-100 transition-all overflow-hidden ${(!isEvaluationStarted || isEvaluationEnded) ? 'opacity-80 pointer-events-none' : ''}`}>
                {/* Accordion Header */}
                <button
                  onClick={() => setIsGlobalQualityExpanded(!isGlobalQualityExpanded)}
                  disabled={!isEvaluationStarted || isEvaluationEnded}
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
                          disabled={!isEvaluationStarted || isEvaluationEnded}
                          className={`w-full h-8 md:h-4 bg-gray-200 rounded-lg appearance-none accent-cacao-800 ${(!isEvaluationStarted || isEvaluationEnded) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                      </div>
                    </div>

                    {/* Quality Characteristic Selector */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 uppercase mb-2">{t.qualityCharacteristic}</h4>
                      <select
                        value={session.selectedQualityId || ''}
                        onChange={(e) => handleQualitySelect(e.target.value)}
                        disabled={!isEvaluationStarted || isEvaluationEnded}
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
              <div className={`bg-white p-6 rounded-xl shadow-sm border border-cacao-100 space-y-4 transition-opacity ${(!isEvaluationStarted || isEvaluationEnded) ? 'opacity-80 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.flavorNotes}</label>
                  <textarea
                    className="w-full p-3 bg-gray-50 border rounded-lg h-24 text-sm disabled:bg-gray-100"
                    value={session.metadata.notes}
                    onChange={(e) => handleMetadataChange('notes', e.target.value)}
                    disabled={!isEvaluationStarted || isEvaluationEnded}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.producerFeedback}</label>
                  <textarea
                    className="w-full p-3 bg-gray-50 border rounded-lg h-24 text-sm disabled:bg-gray-100"
                    value={session.metadata.producerRecommendations}
                    onChange={(e) => handleMetadataChange('producerRecommendations', e.target.value)}
                    disabled={!isEvaluationStarted || isEvaluationEnded}
                  />
                </div>
              </div>

              {/* Radar Chart */}
              <FlavorRadar ref={chartRef} attributes={session.attributes} language={language} />

              {/* Bar Chart (Results View) */}
              {isEvaluationEnded && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-cacao-100">
                  <h4 className="text-sm font-bold text-gray-700 uppercase mb-4 text-center">{language === 'es' ? 'Perfil de Sabor (Detallado)' : 'Flavor Profile (Detailed)'}</h4>
                  <IndividualBarChart
                    sample={{
                      ...session.metadata,
                      id: 'current',
                      timestamp: Date.now(),
                      lastModified: Date.now(),
                      attributes: session.attributes,
                      globalQuality: session.globalQuality,
                      selectedQualityId: session.selectedQualityId
                    } as any} // Cast as StoredSample-like object
                    language={language}
                  />
                </div>
              )}

              {/* End Evaluation & Actions */}
              <div className="space-y-4">
                {!isEvaluationEnded ? (
                  <button
                    type="button"
                    onClick={handleEndEvaluation}
                    disabled={!isEvaluationStarted}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 text-lg uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={24} />
                    {t.endEvaluation}
                  </button>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-500 font-bold py-3 rounded-xl border border-gray-200 text-center uppercase tracking-wide flex justify-center items-center gap-2">
                    <CheckCircle size={20} />
                    {language === 'es' ? 'Evaluación Finalizada' : 'Evaluation Ended'}
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveToLibrary}
                    disabled={!isEvaluationEnded}
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
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="w-full bg-cacao-700 hover:bg-cacao-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 border border-cacao-600"
                  >
                    <Download size={20} />
                    {t.downloadCsv}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={!isEvaluationEnded}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 border border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText size={20} />
                    {t.downloadPdf}
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

      <MobileNav
        attributes={session.attributes}
        language={language}
        isEvaluationStarted={isEvaluationStarted}
        isEvaluationEnded={isEvaluationEnded}
      />
    </div>
  );
};

export default EvaluatePage;