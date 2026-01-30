import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Footer from '../components/Footer';

const ComparePage: React.FC = () => {
    const { language, t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen bg-cacao-50 text-gray-800 font-sans">
            <Header />

            <main className="w-full px-4 md:px-8 space-y-6 flex-grow">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => navigate('/samples')}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-cacao-900">{t.compare || "Compare Samples"}</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-cacao-100 p-12 text-center">
                    <h2 className="text-xl font-bold text-gray-400 mb-2">
                        {language === 'es' ? 'Próximamente' : 'Coming Soon'}
                    </h2>
                    <p className="text-gray-500">
                        {language === 'es'
                            ? 'Esta funcionalidad está en desarrollo.'
                            : 'This feature is currently under development.'}
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ComparePage;
