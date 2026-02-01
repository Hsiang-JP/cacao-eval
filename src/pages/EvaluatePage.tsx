import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Header from '../components/Header';
import ScoreSlider from '../components/ScoreSlider';
import FlavorRadar from '../components/FlavorRadar';
import MobileNav from '../components/MobileNav';
import Footer from '../components/Footer';
import TDSProfilerModal from '../components/tds/TDSProfilerModal';
import TDSSummary from '../components/tds/TDSSummary';
import TDSModeSelector from '../components/tds/TDSModeSelector';
import { GradingSession, SampleMetadata, QualityAttribute, SubAttribute, TDSMode, TDSProfile, TDSScoreResult, TDSAnalysisResult } from '../types';
// Note: Constants and Calculator imports moved to hooks, but we need INITIAL_ATTRIBUTES for local resets if used
import { INITIAL_ATTRIBUTES } from '../constants';
import { RefreshCw, CheckCircle, Play, FileText, ChevronDown, ChevronUp, Save, Plus, Activity } from 'lucide-react';
import { getAttributeColor } from '../utils/colors';

// Custom Hooks
import { useGradingSession } from '../hooks/useGradingSession';
import { useTDSControl } from '../hooks/useTDSControl';
// ChartJS registration is handled in FlavorRadar.tsx

import { useLanguage } from '../context/LanguageContext';

const EvaluatePage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sampleId = searchParams.get('id');
  const chartRef = useRef<any>(null);

  // Use Custom Hook for Grading Session
  const {
    session,
    setSession, // Exposed if needed for direct manipulation outside handlers
    qualityAttributes,
    isEvaluationStarted,
    setIsEvaluationStarted,
    isGlobalQualityExpanded,
    setIsGlobalQualityExpanded,
    showPostSaveModal,
    setShowPostSaveModal,
    getInitialMetadata,
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
  } = useGradingSession(sampleId);

  // Use Custom Hook for TDS Control
  const {
    state: tdsState,
    actions: tdsActions
  } = useTDSControl({
    onApply: applyTDSData,
    onStartEvaluation: handleStartEvaluation // Callback to ensure session starts when TDS starts
  });

  // Helper to identify primary attributes
  const isPrimaryAttribute = (id: string): boolean => {
    const primaryIds = ['cacao', 'bitterness', 'astringency', 'roast', 'acidity'];
    return primaryIds.includes(id);
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

        {/* Start Evaluation & TDS Buttons */}
        {!isEvaluationStarted && (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              type="button"
              onClick={handleStartEvaluation}
              className="bg-cacao-600 hover:bg-cacao-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
            >
              <Play size={20} fill="currentColor" />
              {t.startEvaluation}
            </button>
            <button
              type="button"
              onClick={tdsActions.handleStartTDS}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
            >
              <Activity size={20} />
              {language === 'es' ? 'Perfil TDS' : 'TDS Profile'}
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
                      <div className="flex items-center gap-4 touch-pan-y">
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
                    onClick={() => handleSaveToLibrary(navigate)}
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

      {/* TDS Mode Selection Modal */}
      {tdsState.showTDSModeSelect && (
        <TDSModeSelector
          onSelect={tdsActions.handleTDSModeSelect}
          onCancel={() => tdsActions.setShowTDSModeSelect(false)}
        />
      )}

      {/* TDS Profiler Modal */}
      {tdsState.showTDSProfiler && (
        <TDSProfilerModal
          mode={tdsState.tdsMode}
          onComplete={tdsActions.handleTDSComplete}
          onCancel={() => tdsActions.setShowTDSProfiler(false)}
        />
      )}

      {/* TDS Summary Modal (Analysis Results) */}
      {tdsState.showTDSSummary && tdsState.tdsProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl">
            <TDSSummary
              profile={tdsState.tdsProfile}
              onApply={tdsActions.handleTDSApply}
              onDiscard={tdsActions.handleTDSDiscard}
              onSave={tdsActions.handleTDSSave}
            />
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