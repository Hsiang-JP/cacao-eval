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
                        ? "Esta evaluación digital se basa en las directrices de Cacao of Excellence (CoEx) y se ofrece bajo la licencia Creative Commons Atribución‑NoComercial 4.0 Internacional (CC BY‑NC 4.0). Solo para uso no comercial."
                        : "This digital evaluation is based on the Cacao of Excellence (CoEx) guidelines and is provided under the Creative Commons Attribution‑NonCommercial 4.0 International License (CC BY‑NC 4.0). Non‑commercial use only."}
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
