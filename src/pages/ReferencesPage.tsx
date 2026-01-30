import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { ExternalLink, FileText } from 'lucide-react';

const ReferencesPage: React.FC = () => {
    const { language, t } = useLanguage();

    const content = {
        title: {
            en: "References & Citation",
            es: "Referencias y Citación"
        },
        resourcesTitle: {
            en: "Resources",
            es: "Recursos"
        },
        guideLink: {
            en: "Cacao of Excellence: Guide for the Assessment of Cacao Quality and Flavour",
            es: "Cacao of Excellence: Guía para la Evaluación de la Calidad y el Sabor del Cacao"
        },
        websiteLink: {
            en: "Visit Cacao of Excellence Website",
            es: "Visitar Sitio Web de Cacao of Excellence"
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-cacao-50 text-gray-800 font-sans">
            <Header />

            <main className="w-full max-w-4xl mx-auto px-4 md:px-8 py-12 flex-grow space-y-12">
                <h1 className="text-3xl font-bold text-cacao-900 border-b border-cacao-200 pb-4">
                    {content.title[language]}
                </h1>

                {/* Resources Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-cacao-800 flex items-center gap-2">
                        <ExternalLink className="text-cacao-600" />
                        {content.resourcesTitle[language]}
                    </h2>
                    <div className="grid gap-4">
                        <a
                            href="https://www.cacaoofexcellence.org/info-resources"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white p-6 rounded-xl shadow-sm border border-cacao-100 hover:shadow-md transition-shadow flex items-start gap-4 group"
                        >
                            <div className="bg-cacao-100 p-3 rounded-full group-hover:bg-cacao-200 transition-colors">
                                <FileText className="text-cacao-700" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-cacao-900 group-hover:text-cacao-700 transition-colors">
                                    {content.guideLink[language]}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    https://www.cacaoofexcellence.org/info-resources
                                </p>
                            </div>
                        </a>

                        <a
                            href="https://www.cacaoofexcellence.org/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white p-6 rounded-xl shadow-sm border border-cacao-100 hover:shadow-md transition-shadow flex items-start gap-4 group"
                        >
                            <div className="bg-cacao-100 p-3 rounded-full group-hover:bg-cacao-200 transition-colors">
                                <ExternalLink className="text-cacao-700" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-cacao-900 group-hover:text-cacao-700 transition-colors">
                                    {content.websiteLink[language]}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    https://www.cacaoofexcellence.org/
                                </p>
                            </div>
                        </a>
                    </div>
                </section>
            </main>

            {/* Minimal Footer for this page too */}
            <Footer isMinimal={true} />
        </div>
    );
};

export default ReferencesPage;
