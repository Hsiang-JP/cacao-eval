import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

type Language = 'en' | 'es';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t, i18n } = useTranslation();

    const setLanguage = (lang: Language) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
    };

    // Ensure we start with a supported language or fallback
    useEffect(() => {
        if (!i18n.language) {
            const saved = localStorage.getItem('language') || 'en';
            i18n.changeLanguage(saved);
        }
    }, [i18n]);

    const language = (i18n.language?.split('-')[0] as Language) || 'en';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
