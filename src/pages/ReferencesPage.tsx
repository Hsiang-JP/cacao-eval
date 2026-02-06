import React from 'react';


import { useLanguage } from '../context/LanguageContext';
import { ExternalLink, FileText, User } from 'lucide-react';

const ReferencesPage: React.FC = () => {
    const { language, t } = useLanguage();

    const content = {
        title: {
            en: "References & Citation",
            es: "Referencias y Citación"
        },
        authorTitle: {
            en: "Author",
            es: "Autor"
        },
        authorBio: {
            en: "Hsiang, PhD in Cognitive Neuroscience. Expert in using data-driven approaches to answer complex questions.",
            es: "Hsiang, PhD en Neurociencia Cognitiva. Experto en el uso de enfoques basados en datos para responder preguntas complejas."
        },
        backgroundTitle: {
            en: "Background",
            es: "Antecedentes"
        },
        backgroundText: {
            en: "This application was developed as a side project during my intensive cacao tasting course in Peru. Entering the field with no prior cacao experience, I relied on scientific findings to help me decode the complex sensory profiles of cacao. The concept of TDS (Temporal Dominance of Sensations) helped me significantly to identify different flavor profiles and achieve a high grade on the final exam.",
            es: "Esta aplicación fue desarrollada como un proyecto personal durante mi curso intensivo de cata de cacao en Perú. Al entrar en el campo sin experiencia previa en cacao, confié en hallazgos científicos para ayudarme a descifrar los complejos perfiles sensoriales del cacao. El concepto de TDS (Dominancia Temporal de Sensaciones) me ayudó significativamente a identificar diferentes perfiles de sabor y a obtener una buena calificación en el examen final."
        },
        futureWorkTitle: {
            en: "Future Work",
            es: "Trabajo Futuro"
        },
        futureWorkText: {
            en: "I plan to fine-tune the profiling curve and add more analyses based on my field experience in cacao.",
            es: "Planeo ajustar la curva de perfilado y agregar más análisis basados en mi experiencia de campo con el cacao."
        },
        contactText: {
            en: "Email me if you would like to collaborate on this project:",
            es: "Envíame un correo si deseas colaborar en este proyecto:"
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
        },
        publicationsTitle: {
            en: "Scientific Publications",
            es: "Publicaciones Científicas"
        }
    };

    return (
        <>


            <main className="w-full max-w-4xl mx-auto px-4 md:px-8 py-12 flex-grow space-y-12">
                <h1 className="text-3xl font-bold text-cacao-900 border-b border-cacao-200 pb-4">
                    {content.title[language]}
                </h1>

                {/* Author Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-cacao-800 flex items-center gap-2">
                        <User className="text-cacao-600" />
                        {content.authorTitle[language]}
                    </h2>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-cacao-100 space-y-6">
                        {/* Bio */}
                        <div>
                            <p className="text-lg font-medium text-cacao-900">
                                {content.authorBio[language]}
                            </p>
                        </div>

                        {/* Background */}
                        <div className="space-y-2">
                            <h3 className="font-bold text-cacao-800 text-md uppercase tracking-wide text-sm">
                                {content.backgroundTitle[language]}
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                {content.backgroundText[language]}
                            </p>
                        </div>

                        {/* Future Work */}
                        <div className="space-y-2">
                            <h3 className="font-bold text-cacao-800 text-md uppercase tracking-wide text-sm">
                                {content.futureWorkTitle[language]}
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                {content.futureWorkText[language]}
                            </p>
                            <p className="text-gray-700 mt-2">
                                {content.contactText[language]} <a href="mailto:cacao@live-by-sketch.com" className="text-blue-600 hover:underline font-medium">cacao@live-by-sketch.com</a>
                            </p>
                        </div>
                    </div>
                </section>

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
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-cacao-900 group-hover:text-cacao-700 transition-colors">
                                    {content.guideLink[language]}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 break-all">
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
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-cacao-900 group-hover:text-cacao-700 transition-colors">
                                    {content.websiteLink[language]}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 break-all">
                                    https://www.cacaoofexcellence.org/
                                </p>
                            </div>
                        </a>
                    </div>
                </section>

                {/* Publications Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-cacao-800 flex items-center gap-2">
                        <FileText className="text-cacao-600" />
                        {content.publicationsTitle[language]}
                    </h2>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-cacao-100 space-y-6">
                        <div className="space-y-2">
                            <p className="text-cacao-900 font-medium">
                                Labbe, D., Schlich, P., Pineau, N., Gilbert, F., & Martin, N. (2009).
                            </p>
                            <p className="text-gray-700 italic">
                                Temporal dominance of sensations and sensory profiling: A comparative study.
                            </p>
                            <p className="text-gray-600">
                                Food Quality and Preference, 20(3), 216–221.
                                <a href="https://doi.org/10.1016/j.foodqual.2008.09.006" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1 break-all">
                                    https://doi.org/10.1016/j.foodqual.2008.09.006
                                </a>
                            </p>
                        </div>

                        <div className="border-t border-gray-100 pt-6 space-y-2">
                            <p className="text-cacao-900 font-medium">
                                Pineau, N., Cordelle, S., Imbert, A., Rogeaux, M., & Schlich, P. (2009).
                            </p>
                            <p className="text-gray-700 italic">
                                Temporal Dominance of Sensations: Construction of the TDS curves and comparison with time–intensity.
                            </p>
                            <p className="text-gray-600">
                                Food Quality and Preference, 20(6), 450–455.
                                <a href="https://doi.org/10.1016/j.foodqual.2009.04.005" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1 break-all">
                                    https://doi.org/10.1016/j.foodqual.2009.04.005
                                </a>
                            </p>
                        </div>

                        <div className="border-t border-gray-100 pt-6 space-y-2">
                            <p className="text-cacao-900 font-medium">
                                Januszewska, R. (2018).
                            </p>
                            <p className="text-gray-700 italic">
                                Hidden persuaders in cocoa and chocolate: A flavor lexicon for cocoa and chocolate sensory professionals.
                            </p>
                            <p className="text-gray-600">
                                Woodhead Publishing.
                                <a href="https://doi.org/10.1016/C2017-0-03055-0" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1 break-all">
                                    https://doi.org/10.1016/C2017-0-03055-0
                                </a>
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Minimal Footer for this page too */}
        </>
    );
};

export default ReferencesPage;
