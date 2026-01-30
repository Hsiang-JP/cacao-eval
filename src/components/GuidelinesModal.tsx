import React, { useState } from 'react';
import { X, ExternalLink, ChevronDown, ChevronRight, Languages } from 'lucide-react';
import glossaryData from '../data/glossary.json';

import { useLanguage } from '../context/LanguageContext';

interface GuidelinesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRIMARY_COLOR = '#6f4e37';

const GuidelinesModal: React.FC<GuidelinesModalProps> = ({
    isOpen,
    onClose
}) => {
    const { language, setLanguage } = useLanguage();
    // Helper for language toggle
    const onLanguageChange = (lang: 'en' | 'es') => setLanguage(lang);

    if (!isOpen) return null;

    const t = {
        title: { en: "Guidelines", es: "Instrucciones" },
        close: { en: "Close", es: "Cerrar" },
        flavorWheel: { en: "Flavour Wheel", es: "Rueda de Sabor" },
        openImage: { en: "Open image", es: "Abrir imagen" },
        imageNotFound: { en: "Image not found", es: "Imagen no encontrada" },
        ensurePath: { en: "Ensure file is in public folder:", es: "Asegúrese de que el archivo esté en la carpeta public:" },
        globalQuality: { en: "Global Quality", es: "Calidad Global" },
        attributes: { en: "Attributes", es: "Atributos" },
        offFlavors: { en: "Off-flavours", es: "Sabores Atípicos / Defectos" },
        intensityScale: { en: "Intensity Scale", es: "Escala de Intensidad" },
        score: { en: "Score", es: "Puntuación" },
        description: { en: "Description", es: "Descripción" },
        switchLang: { en: "Español", es: "English" }
    };

    const FLAVOR_WHEEL_URL = language === 'es' ? "flavor_wheel_es.png" : "flavor_wheel_en.png";

    // Helper to get text based on language
    const gl = (obj: any) => obj?.[language] || obj?.['en'] || '';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
            <div className="bg-white text-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 rounded-t-xl sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="font-serif text-2xl font-bold" style={{ color: PRIMARY_COLOR }}>
                            {t.title[language]}
                        </h2>
                        <button
                            onClick={() => onLanguageChange(language === 'en' ? 'es' : 'en')}
                            className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-white px-3 py-1 rounded-full border border-[color:var(--primary)] text-[color:var(--primary)] hover:bg-[color:var(--primary)]"
                            style={{ '--primary': PRIMARY_COLOR } as React.CSSProperties}
                        >
                            <Languages size={14} /> {t.switchLang[language]}
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 text-gray-500 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-12 scroll-smooth">

                    {/* 1. Flavor Wheel Section */}
                    <section>
                        <h3 className="text-xl font-bold mb-4 pb-2 border-b-2" style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
                            {t.flavorWheel[language]}
                        </h3>
                        <div className="flex flex-col items-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="relative w-full max-w-2xl">
                                <img
                                    src={FLAVOR_WHEEL_URL}
                                    alt={t.flavorWheel[language]}
                                    className="w-full h-auto object-contain rounded shadow-sm"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = `
                                    <div class="text-center p-8 text-gray-400">
                                        <p class="mb-2 font-bold">${t.imageNotFound[language]}</p>
                                        <code class="text-xs bg-gray-100 p-1 rounded">${FLAVOR_WHEEL_URL}</code>
                                    </div>
                                `;
                                    }}
                                />
                            </div>
                            <a
                                href={FLAVOR_WHEEL_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 flex items-center gap-1 text-sm underline hover:opacity-80 transition-opacity"
                                style={{ color: PRIMARY_COLOR }}
                            >
                                <ExternalLink size={14} /> {t.openImage[language]}
                            </a>
                        </div>
                    </section>



                    {/* 3. Intensity Scale */}
                    <section>
                        <h3 className="text-xl font-bold mb-4 pb-2 border-b-2" style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
                            {t.intensityScale[language]}
                        </h3>
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {glossaryData.intensity_scale.map((item, idx) => (
                                <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-3 flex gap-3 items-start">
                                    <div className="font-bold text-lg min-w-[3rem] text-center px-2 py-1 bg-white rounded border border-gray-200" style={{ color: PRIMARY_COLOR }}>
                                        {item.score}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">{gl(item)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3.1 Glossary Setup */}
                    <section>
                        {(() => {
                            const setupData = language === 'es' ? (glossaryData as any).glossary_setup.attribute_groups_es : (glossaryData as any).glossary_setup.attribute_groups_en;
                            return (
                                <div className="bg-amber-50 rounded-lg p-6 border border-amber-100">
                                    <h3 className="font-bold text-lg mb-3" style={{ color: PRIMARY_COLOR }}>
                                        {setupData.title}
                                    </h3>
                                    <ul className="space-y-2">
                                        {setupData.groups.map((group: string, idx: number) => (
                                            <li key={idx} className="text-gray-700 font-medium">
                                                {group}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })()}
                    </section>

                    {/* 4. Attributes (Core) */}
                    <section>
                        <h3 className="text-xl font-bold mb-6 pb-2 border-b-2" style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
                            {t.attributes[language]} - {gl({ en: "Core", es: "Principales" })}
                        </h3>
                        <div className="space-y-8">
                            {glossaryData.attributes.core.map((attr) => (
                                <AttributeCard
                                    key={attr.id}
                                    attr={attr}
                                    language={language}
                                    gl={gl}
                                    primaryColor={PRIMARY_COLOR}
                                />
                            ))}
                        </div>
                    </section>

                    {/* 5. Attributes (Complementary) */}
                    <section>
                        <h3 className="text-xl font-bold mb-6 pb-2 border-b-2" style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
                            {t.attributes[language]} - {gl({ en: "Complementary", es: "Complementarios" })}
                        </h3>
                        <div className="space-y-8">
                            {glossaryData.attributes.complementary_attributes.map((attr) => (
                                <AttributeCard
                                    key={attr.id}
                                    attr={attr}
                                    language={language}
                                    gl={gl}
                                    primaryColor={PRIMARY_COLOR}
                                />
                            ))}
                        </div>
                    </section>

                    {/* 6. Off Flavours */}
                    <section>
                        <h3 className="text-xl font-bold mb-4 pb-2 border-b-2" style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
                            {gl(glossaryData.attributes.off_flavours.name)}
                        </h3>

                        <div className="bg-red-50/50 border border-red-100 rounded-lg p-6">
                            <p className="mb-4 text-gray-800 font-medium">
                                {gl(glossaryData.attributes.off_flavours.description)}
                            </p>

                            <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3 mb-8">
                                {glossaryData.attributes.off_flavours.list.map((item: any, idx: number) => (
                                    <li key={idx} className="flex gap-2 items-start text-sm">
                                        <span className="text-red-400 mt-1.5">•</span>
                                        <span>{gl(item)}</span>
                                    </li>
                                ))}
                            </ul>

                            <h4 className="font-bold mb-3 text-lg" style={{ color: PRIMARY_COLOR }}>
                                {t.score[language]}
                            </h4>
                            <div className="space-y-2">
                                {glossaryData.attributes.off_flavours.scoring.map((score: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 p-3 bg-white rounded border border-gray-100">
                                        <span className="font-bold w-12 text-center" style={{ color: PRIMARY_COLOR }}>{score.level}</span>
                                        <span className="text-gray-700">{gl(score)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 2. Global Quality Section (Moved to end) */}
                    <section>
                        <div className="mb-6 bg-[#fefefe] p-4 border-l-[5px] whitespace-pre-wrap shadow-sm rounded-r" style={{ borderColor: PRIMARY_COLOR }}>
                            <h3 className="text-xl font-bold mb-2" style={{ color: PRIMARY_COLOR }}>
                                {gl(glossaryData.global_quality_section.descriptor)}
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                {gl(glossaryData.global_quality_section.description)}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <h4 className="font-bold mb-3 text-lg text-gray-800">
                                {gl(glossaryData.global_quality_section.scores_meaning_table_title)}
                            </h4>

                            <table className="w-full border-collapse text-sm shadow-sm">
                                <thead>
                                    <tr className="text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
                                        <th className="p-3 text-center whitespace-nowrap w-24">
                                            {gl(glossaryData.global_quality_section.table_headers.score)}
                                        </th>
                                        <th className="p-3 text-left w-1/5">
                                            {gl(glossaryData.global_quality_section.table_headers.off_flavours)}
                                        </th>
                                        <th className="p-3 text-left w-1/5">
                                            {gl(glossaryData.global_quality_section.table_headers.core_attributes)}
                                        </th>
                                        <th className="p-3 text-left w-1/5">
                                            {gl(glossaryData.global_quality_section.table_headers.complementary_attributes)}
                                        </th>
                                        <th className="p-3 text-left">
                                            {gl(glossaryData.global_quality_section.table_headers.notes)}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {glossaryData.global_quality_section.table_data.map((row, idx) => (
                                        <tr key={idx} className="even:bg-[#f9f4f1] border-b border-gray-200">
                                            <td className="p-3 border-r border-gray-200 text-center font-bold text-lg align-top" style={{ color: PRIMARY_COLOR }}>
                                                {row.score}
                                            </td>
                                            <td className="p-3 border-r border-gray-200 align-top">{gl(row.off_flavours)}</td>
                                            <td className="p-3 border-r border-gray-200 align-top">{gl(row.core_attributes)}</td>
                                            <td className="p-3 border-r border-gray-200 align-top">{gl(row.complementary_attributes)}</td>
                                            <td className="p-3 align-top italic text-gray-600">{gl(row.notes)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-white font-medium rounded-lg shadow min-w-[100px] hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                        {t.close[language]}
                    </button>
                </div>

            </div>
        </div>
    );
};

// Sub-component for singular Attributes
const AttributeCard = ({ attr, language, gl, primaryColor }: { attr: any, language: any, gl: any, primaryColor: string }) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-wrap gap-2 items-baseline justify-between">
                <h4 className="text-lg font-bold" style={{ color: primaryColor }}>
                    {gl(attr.name)}
                </h4>
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                    {attr.id}
                </span>
            </div>

            <div className="p-5 space-y-4">
                <p className="text-gray-700 italic border-l-4 pl-3 py-1" style={{ borderColor: primaryColor + '40' }}>
                    {gl(attr.description)}
                </p>

                {/* Sub-attributes if any */}
                {attr.sub_attributes && (
                    <div className="mt-3">
                        <h5 className="text-xs font-bold uppercase text-gray-400 mb-2">Sub-attributes</h5>
                        <ul className="text-sm space-y-1 text-gray-600 pl-2">
                            {attr.sub_attributes.map((sub: any, i: number) => (
                                <li key={i}>{gl(sub)}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Reference Notes */}
                {attr.reference_notes && attr.reference_notes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <h5 className="text-xs font-bold uppercase text-gray-400 mb-3">Reference / Calibration</h5>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {attr.reference_notes.map((note: any, i: number) => (
                                <div key={i} className="text-sm bg-gray-50 p-2 rounded border border-gray-100">
                                    {note.level && (
                                        <span className="block font-bold mb-1 text-xs" style={{ color: primaryColor }}>
                                            Level {note.level}
                                        </span>
                                    )}
                                    {note.type_en && (
                                        <span className="block font-bold mb-1 text-xs text-gray-500">
                                            {language === 'es' ? note.type_es : note.type_en}
                                        </span>
                                    )}
                                    <span className="text-gray-600">{gl(note)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default GuidelinesModal;
