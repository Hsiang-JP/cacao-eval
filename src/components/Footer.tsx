import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

interface FooterProps {
    isMinimal?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isMinimal = false }) => {
    const { language } = useLanguage();

    return (
        <footer className="bg-cacao-100 text-cacao-500 py-3 mt-auto text-[10px] text-center border-t border-cacao-200">
            <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4">
                <span>
                    {language === 'es'
                        ? "Este formulario de evaluación ha sido reagrupado del formulario Excel de Cacao of Excellence"
                        : "This evaluation form is regrouped from the Cacao of Excellence Excel form"}
                </span>
                <span className="hidden md:inline text-cacao-400">|</span>
                {!isMinimal && (
                    <Link to="/references" className="hover:text-cacao-900 transition-colors underline decoration-dotted underline-offset-2">
                        {language === 'es' ? 'Citación y Referencias' : 'Citation & References'}
                    </Link>
                )}
            </div>
        </footer>
    );
};

export default Footer;
