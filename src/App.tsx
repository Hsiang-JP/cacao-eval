import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ScoreSlider from './components/ScoreSlider';
import FlavorRadar from './components/FlavorRadar';
import { GradingSession, SampleMetadata, QualityAttribute, SubAttribute } from './types';
import {
  INITIAL_ATTRIBUTES,
  INITIAL_QUALITY_ATTRIBUTES,
  TRANSLATIONS,
  CSV_HEADERS_EN,
  CSV_HEADERS_ES
} from './constants';
import { RefreshCw, CheckCircle, Play, Download, FileText } from 'lucide-react';
// ChartJS registration is handled in FlavorRadar.tsx

const App: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const t = TRANSLATIONS[language];
  const [isEvaluationStarted, setIsEvaluationStarted] = useState(false);
  const [isEvaluationEnded, setIsEvaluationEnded] = useState(false);

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
    // Lazy load the PDF service
    const { generatePdf } = await import('./services/pdfService');
    // Capture chart image from the ref
    const chartImage = chartRef.current?.toBase64Image();
    generatePdf(session, chartImage);
  };

  const handleDownloadCsv = () => {
    const headers = language === 'es' ? CSV_HEADERS_ES : CSV_HEADERS_EN;
    const getDate = () => {
      if (language === 'es' && session.metadata.date) {
        const parts = session.metadata.date.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return session.metadata.date;
    };

    const row = [
      "", // Original Ordering
      getDate(),
      session.metadata.time,
      session.metadata.evaluator,
      session.metadata.sampleCode,
      session.metadata.sampleInfo,
      session.attributes.find(a => a.id === 'cacao')?.score || 0,
      // Acidity
      session.attributes.find(a => a.id === 'acidity')?.score || 0,
      session.attributes.find(a => a.id === 'acidity')?.subAttributes?.find(s => s.id === 'acid_fruity')?.score || 0,
      session.attributes.find(a => a.id === 'acidity')?.subAttributes?.find(s => s.id === 'acid_acetic')?.score || 0,
      session.attributes.find(a => a.id === 'acidity')?.subAttributes?.find(s => s.id === 'acid_lactic')?.score || 0,
      session.attributes.find(a => a.id === 'acidity')?.subAttributes?.find(s => s.id === 'acid_mineral')?.score || 0,

      session.attributes.find(a => a.id === 'bitterness')?.score || 0,
      session.attributes.find(a => a.id === 'astringency')?.score || 0,

      // Fresh Fruit
      session.attributes.find(a => a.id === 'fresh_fruit')?.score || 0,
      session.attributes.find(a => a.id === 'fresh_fruit')?.subAttributes?.find(s => s.id === 'ff_berry')?.score || 0,
      session.attributes.find(a => a.id === 'fresh_fruit')?.subAttributes?.find(s => s.id === 'ff_citrus')?.score || 0,
      session.attributes.find(a => a.id === 'fresh_fruit')?.subAttributes?.find(s => s.id === 'ff_dark')?.score || 0,
      session.attributes.find(a => a.id === 'fresh_fruit')?.subAttributes?.find(s => s.id === 'ff_pulp')?.score || 0,
      session.attributes.find(a => a.id === 'fresh_fruit')?.subAttributes?.find(s => s.id === 'ff_tropical')?.score || 0,

      // Browned Fruit
      session.attributes.find(a => a.id === 'browned_fruit')?.score || 0,
      session.attributes.find(a => a.id === 'browned_fruit')?.subAttributes?.find(s => s.id === 'bf_dried')?.score || 0,
      session.attributes.find(a => a.id === 'browned_fruit')?.subAttributes?.find(s => s.id === 'bf_brown')?.score || 0,
      session.attributes.find(a => a.id === 'browned_fruit')?.subAttributes?.find(s => s.id === 'bf_overripe')?.score || 0,

      // Vegetal
      session.attributes.find(a => a.id === 'vegetal')?.score || 0,
      session.attributes.find(a => a.id === 'vegetal')?.subAttributes?.find(s => s.id === 'veg_green')?.score || 0,
      session.attributes.find(a => a.id === 'vegetal')?.subAttributes?.find(s => s.id === 'veg_earthy')?.score || 0,

      // Floral
      session.attributes.find(a => a.id === 'floral')?.score || 0,
      session.attributes.find(a => a.id === 'floral')?.subAttributes?.find(s => s.id === 'flo_orange')?.score || 0,
      session.attributes.find(a => a.id === 'floral')?.subAttributes?.find(s => s.id === 'flo_flowers')?.score || 0,

      // Woody
      session.attributes.find(a => a.id === 'woody')?.score || 0,
      session.attributes.find(a => a.id === 'woody')?.subAttributes?.find(s => s.id === 'wood_light')?.score || 0,
      session.attributes.find(a => a.id === 'woody')?.subAttributes?.find(s => s.id === 'wood_dark')?.score || 0,
      session.attributes.find(a => a.id === 'woody')?.subAttributes?.find(s => s.id === 'wood_resin')?.score || 0,

      // Spice
      session.attributes.find(a => a.id === 'spice')?.score || 0,
      session.attributes.find(a => a.id === 'spice')?.subAttributes?.find(s => s.id === 'sp_spices')?.score || 0,
      session.attributes.find(a => a.id === 'spice')?.subAttributes?.find(s => s.id === 'sp_tobacco')?.score || 0,
      session.attributes.find(a => a.id === 'spice')?.subAttributes?.find(s => s.id === 'sp_savory')?.score || 0,

      // Nutty
      session.attributes.find(a => a.id === 'nutty')?.score || 0,
      session.attributes.find(a => a.id === 'nutty')?.subAttributes?.find(s => s.id === 'nut_meat')?.score || 0,
      session.attributes.find(a => a.id === 'nutty')?.subAttributes?.find(s => s.id === 'nut_skin')?.score || 0,

      session.attributes.find(a => a.id === 'caramel')?.score || 0,
      session.attributes.find(a => a.id === 'sweetness')?.score || 0,
      session.attributes.find(a => a.id === 'roast')?.score || 0,

      // Defects
      session.attributes.find(a => a.id === 'defects')?.score || 0,
      session.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_dirty')?.score || 0,
      session.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_mold')?.score || 0,
      session.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_moldy')?.score || 0,
      session.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_meaty')?.score || 0,
      session.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_over')?.score || 0,
      session.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_manure')?.score || 0,
      session.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_smoke')?.score || 0,
      session.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_other')?.score || 0,
      `"${(session.attributes.find(a => a.id === 'defects')?.subAttributes?.find(s => s.id === 'def_other')?.description || '').replace(/"/g, '""')}"`,

      `"${session.metadata.notes.replace(/"/g, '""')}"`,
      `"${session.metadata.producerRecommendations.replace(/"/g, '""')}"`,
      session.globalQuality,
      session.selectedQualityId === 'uniqueness' ? 10 : 0,
      session.selectedQualityId === 'complexity' ? 10 : 0,
      session.selectedQualityId === 'balance' ? 10 : 0,
      session.selectedQualityId === 'cleanliness' ? 10 : 0,
      session.selectedQualityId === 'q_acidity' ? 10 : 0,
      session.selectedQualityId === 'q_astringency' ? 10 : 0,
      session.selectedQualityId === 'q_bitterness' ? 10 : 0,
      session.selectedQualityId === 'q_aftertaste' ? 10 : 0,
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CoEx_${session.metadata.sampleCode || 'Sample'}_${session.metadata.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-cacao-50 text-gray-800 font-sans pb-20">
      <Header language={language} onLanguageChange={setLanguage} />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">

        {/* Top Section: Metadata */}
        <section className={`bg-white p-6 rounded-xl shadow-sm border border-cacao-100 transition-opacity ${isEvaluationEnded ? 'opacity-80 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
              {session.attributes.map(attr => (
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
                />
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN (1/3 width): Sidebar with Graph & Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Global Quality */}
              <div className={`bg-white p-6 rounded-xl shadow-sm border border-cacao-100 space-y-6 transition-opacity ${(!isEvaluationStarted || isEvaluationEnded) ? 'opacity-80 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-sm font-bold text-cacao-800 uppercase mb-2">{t.globalScore}</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min="0" max="10" step="1"
                      value={session.globalQuality}
                      onChange={(e) => setSession(prev => ({ ...prev, globalQuality: parseFloat(e.target.value) }))}
                      disabled={!isEvaluationStarted || isEvaluationEnded}
                      className={`w-full h-4 bg-gray-200 rounded-lg appearance-none accent-cacao-800 ${(!isEvaluationStarted || isEvaluationEnded) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    />
                    <span className="text-3xl font-mono font-bold text-cacao-800">{session.globalQuality}</span>
                  </div>
                </div>

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
    </div>
  );
};

export default App;