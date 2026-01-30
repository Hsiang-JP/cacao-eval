import React, { useState } from 'react';
import { Award, Bean, FileText, X, Languages, ExternalLink, ImageOff, PenTool } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import GuidelinesModal from './GuidelinesModal';
import { useLanguage } from '../context/LanguageContext';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

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

          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <img src="logo-cacao.svg" alt="Cacao of Excellence Logo" className="h-12 w-auto" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-wide">{t.title}</h1>
              <p className="text-cacao-300 text-xs tracking-widest uppercase">{t.subtitle}</p>
            </div>
          </div>

          {/* Center: Language Switcher */}
          <div className="flex justify-center">
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="flex items-center gap-2 text-cacao-200 hover:text-white transition-colors bg-cacao-800 px-4 py-1.5 rounded-full border border-cacao-700 shadow-sm"
            >
              <Languages size={16} /> {language === 'en' ? 'Español' : 'English'}
            </button>
          </div>

          {/* Right: Navigation Buttons */}
          <div className="flex gap-4 text-sm font-medium items-center flex-1 justify-end">
            <button
              onClick={() => window.location.pathname !== '/evaluate' && (window.location.href = '/evaluate')}
              className={`flex items-center gap-2 transition-colors ${window.location.pathname === '/evaluate' ? 'text-white font-bold' : 'text-cacao-200 hover:text-white'}`}
            >
              <PenTool size={16} /> {t.evaluation}
            </button>

            <button
              onClick={() => window.location.pathname !== '/samples' && (window.location.href = '/samples')}
              className={`flex items-center gap-2 transition-colors ${window.location.pathname === '/samples' ? 'text-white font-bold' : 'text-cacao-200 hover:text-white'}`}
            >
              <FileText size={16} /> {t.sampleLibrary}
            </button>

            <button
              onClick={() => setIsGuidelinesOpen(true)}
              className="flex items-center gap-2 text-cacao-200 hover:text-white transition-colors"
            >
              <Award size={16} /> {t.guidelines}
            </button>
          </div>
        </div>
      </header>

      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </>
  );
};

export default Header;