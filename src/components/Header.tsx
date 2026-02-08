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
              <h1 className="font-serif text-2xl font-bold tracking-wide text-brand-50">{t('title')}</h1>
              <p className="text-brand-300 text-xs tracking-widest uppercase">{t('subtitle')}</p>
            </div>
          </div>

          {/* Center: Language Switcher */}
          <div className="flex justify-center">
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="flex items-center gap-2 text-brand-200 hover:text-white transition-colors bg-brand-800 px-4 py-1.5 rounded-full border border-brand-700 shadow-sm"
            >
              <Languages size={16} /> {language === 'en' ? 'Español' : 'English'}
            </button>
          </div>

          {/* Right: Navigation Buttons */}
          <div className="flex gap-4 text-sm font-medium items-center flex-1 justify-end">
            <button
              onClick={() => navigate('/evaluate')}
              className={`flex items-center gap-2 transition-colors ${location.pathname === '/evaluate' ? 'text-white font-bold' : 'text-brand-200 hover:text-white'}`}
            >
              {t('evaluation')}
            </button>

            <button
              onClick={() => navigate('/samples')}
              className={`flex items-center gap-2 transition-colors ${location.pathname === '/samples' ? 'text-white font-bold' : 'text-brand-200 hover:text-white'}`}
            >
              {t('sampleLibrary')}
            </button>

            <button
              onClick={() => setIsGuidelinesOpen(true)}
              className="flex items-center gap-2 text-brand-200 hover:text-white transition-colors"
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