import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import GuidelinesModal from './GuidelinesModal';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { currentConfig } from '../constants';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Unused constants removed

  return (
    <>
      <header className="bg-brand-900 text-brand-200 py-6 px-4 shadow-lg sticky top-0 z-50">
        <div className="w-full px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">

          {/* Left: Logo & Title */}
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <img src={currentConfig.assets.logo} alt={`${currentConfig.name[language]} flavor profiling Logo`} className="h-12 w-auto" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide text-brand-50">{t('title')}</h1>
              <p className="text-brand-300 text-xs tracking-widest uppercase">{t('subtitle')}</p>
            </div>
          </div>

          {/* Center: Language Switcher */}
          <div className="flex justify-center">
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="flex items-center gap-2 text-brand-100 hover:text-white hover:bg-brand-700 transition-all duration-200 bg-brand-800/50 px-4 py-1.5 rounded-full border border-white/10 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
            >
              <Languages size={16} /> {language === 'en' ? 'Español' : 'English'}
            </button>
          </div>

          {/* Right: Navigation Buttons */}
          <div className="flex gap-6 text-sm font-medium items-center flex-1 justify-end">
            <button
              onClick={() => navigate('/evaluate')}
              className={`flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 ${location.pathname === '/evaluate' ? 'text-white font-bold border-b-2 border-accent-orange pb-0.5' : 'text-brand-200 hover:text-accent-orange'}`}
            >
              {t('evaluation')}
            </button>

            <button
              onClick={() => navigate('/samples')}
              className={`flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 ${location.pathname === '/samples' ? 'text-white font-bold border-b-2 border-accent-orange pb-0.5' : 'text-brand-200 hover:text-accent-orange'}`}
            >
              {t('sampleLibrary')}
            </button>

            <button
              onClick={() => setIsGuidelinesOpen(true)}
              className="flex items-center gap-2 text-brand-200 hover:text-accent-teal transition-all duration-200 hover:-translate-y-0.5"
            >
              {t('guidelines')}
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