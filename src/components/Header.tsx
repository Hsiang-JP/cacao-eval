import React, { useState } from 'react';
import { Award, Bean, FileText, X, Languages, ExternalLink, ImageOff } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface HeaderProps {
  language: 'en' | 'es';
  onLanguageChange: (lang: 'en' | 'es') => void;
}

const Header: React.FC<HeaderProps> = ({ language, onLanguageChange }) => {
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const t = TRANSLATIONS[language];

  // Local images from the public/ folder
  const FLAVOR_WHEEL_URL_EN = "flavor_wheel_en.png";
  const FLAVOR_WHEEL_URL_ES = "flavor_wheel_es.png";

  const SCORE_INSTRUCTION_URL_EN = "score_instruction_en.png";
  const SCORE_INSTRUCTION_URL_ES = "score_instruction_es.png";

  const currentWheelUrl = language === 'es' ? FLAVOR_WHEEL_URL_ES : FLAVOR_WHEEL_URL_EN;
  const currentScoreUrl = language === 'es' ? SCORE_INSTRUCTION_URL_ES : SCORE_INSTRUCTION_URL_EN;

  return (
    <>
      <header className="bg-cacao-900 text-cacao-50 py-6 px-4 shadow-lg sticky top-0 z-50">
        <div className="w-full px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <img src="logo-cacao.svg" alt="Cacao of Excellence Logo" className="h-12 w-auto" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-wide">{t.title}</h1>
              <p className="text-cacao-300 text-xs tracking-widest uppercase">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex gap-4 text-sm font-medium items-center">
            <button
              onClick={() => window.location.pathname !== '/samples' && (window.location.href = '/samples')}
              className={`flex items-center gap-2 transition-colors ${window.location.pathname === '/samples' ? 'text-white font-bold' : 'text-cacao-200 hover:text-white'}`}
            >
              <FileText size={16} /> {language === 'es' ? 'Muestras' : 'Samples'}
            </button>
            <button
              onClick={() => onLanguageChange(language === 'en' ? 'es' : 'en')}
              className="flex items-center gap-2 text-cacao-200 hover:text-white transition-colors bg-cacao-800 px-3 py-1 rounded-full"
            >
              <Languages size={16} /> {language === 'en' ? 'Español' : 'English'}
            </button>
            <button
              onClick={() => setIsGuidelinesOpen(true)}
              className="flex items-center gap-2 text-cacao-200 hover:text-white transition-colors"
            >
              <Award size={16} /> {t.guidelines}
            </button>
            {/* 
            <button className="flex items-center gap-2 text-cacao-200 hover:text-white transition-colors opacity-50 cursor-not-allowed hidden sm:flex">
              <FileText size={16} /> {t.history}
            </button> 
            */}
          </div>
        </div>
      </header>

      {isGuidelinesOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-cacao-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-cacao-50 rounded-t-xl sticky top-0 z-10">
              <h2 className="font-serif text-xl md:text-2xl font-bold text-cacao-800">{t.guidelinesTitle}</h2>
              <button
                onClick={() => setIsGuidelinesOpen(false)}
                className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8 overflow-y-auto">

              {language === 'es' ? (
                /* Spanish Guidelines */
                <section>
                  <h3 className="font-bold text-lg mb-3 text-cacao-800 border-l-4 border-cacao-500 pl-3">
                    Cómo utilizar el formato
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 space-y-3">
                    <p><strong>1)</strong> Ingrese el Evaluador, ID de muestra y otros datos.</p>
                    <p><strong>2)</strong> Haga clic en el botón "Iniciar evaluación" (se establece la fecha y hora automáticamente).</p>
                    <p><strong>3)</strong> Ingrese los valores usando los deslizadores para cada atributo.</p>
                    <p><strong>4)</strong> Haga clic en "Finalizar Evaluación" para bloquear los datos.</p>
                    <p><strong>5)</strong> "Descargar CSV" guarda los datos brutos en su dispositivo.</p>
                    <p><strong>6)</strong> "Descargar Reporte PDF" genera un documento imprimible con los resultados (solo disponible tras finalizar).</p>
                  </div>
                </section>
              ) : (
                /* English Guidelines */
                <section>
                  <h3 className="font-bold text-lg mb-3 text-cacao-800 border-l-4 border-amber-500 pl-3">
                    How to use the form
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 space-y-3">
                    <p><strong>1)</strong> Enter Evaluator, Sample ID, and other details.</p>
                    <p><strong>2)</strong> Click "Start Evaluation" to begin (sets date/time automatically).</p>
                    <p><strong>3)</strong> Enter values using the sliders for each attribute (0-10).</p>
                    <p><strong>4)</strong> Click "End Evaluation" to lock the data.</p>
                    <p><strong>5)</strong> "Download CSV" saves the raw data file to your device.</p>
                    <p><strong>6)</strong> "Download PDF Report" generates a printable document of the results (available after evaluation).</p>
                  </div>
                </section>
              )}

              {/* Flavor Wheel Section */}
              <div className="mt-8">
                <h3 className="font-bold text-lg mb-3 text-cacao-800 border-l-4 border-cacao-500 pl-3">
                  {language === 'es' ? 'Rueda de Sabor' : 'Flavour Wheel'}
                </h3>
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50 min-h-[200px] flex items-center justify-center relative bg-gray-100">
                  <img
                    src={currentWheelUrl}
                    alt={language === 'es' ? "Rueda de Sabor Cacao de Excelencia" : "Cacao of Excellence Flavour Wheel"}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="flex flex-col items-center justify-center p-8 text-center text-gray-500">
                            <p class="font-bold mb-2 flex items-center gap-2">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                              Image not found
                            </p>
                            <p class="text-xs mb-3">Ensure <code>${currentWheelUrl.replace('/', '')}</code> is in your <code>public</code> folder.</p>
                        </div>
                      `;
                    }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <a
                    href={currentWheelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cacao-500 underline hover:text-cacao-800 flex items-center justify-center gap-1"
                  >
                    <ExternalLink size={12} />
                    {language === 'es' ? 'Abrir imagen' : 'Open image'}
                  </a>
                </div>
              </div>

              {/* Score Meaning Section */}
              <div className="mt-8">
                <h3 className="font-bold text-lg mb-3 text-cacao-800 border-l-4 border-cacao-500 pl-3">
                  {language === 'es' ? 'Significado de las puntuaciones' : 'Meaning of the scores'}
                </h3>
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50 min-h-[200px] flex items-center justify-center relative bg-gray-100">
                  <img
                    src={currentScoreUrl}
                    alt={language === 'es' ? "Significado de las puntuaciones" : "Meaning of the scores"}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="flex flex-col items-center justify-center p-8 text-center text-gray-500">
                            <p class="font-bold mb-2 flex items-center gap-2">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                              Image not found
                            </p>
                            <p class="text-xs mb-3">Ensure <code>${currentScoreUrl.replace('/', '')}</code> is in your <code>public</code> folder.</p>
                        </div>
                      `;
                    }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <a
                    href={currentScoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cacao-500 underline hover:text-cacao-800 flex items-center justify-center gap-1"
                  >
                    <ExternalLink size={12} />
                    {language === 'es' ? 'Abrir imagen' : 'Open image'}
                  </a>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end sticky bottom-0 z-10">
              <button
                onClick={() => setIsGuidelinesOpen(false)}
                className="px-6 py-2 bg-cacao-800 text-white rounded-lg font-medium hover:bg-cacao-700 transition-colors shadow-sm"
              >
                {t.guidelinesClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;