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
    const [activeTab, setActiveTab] = useState<'scoring' | 'tds'>('scoring');

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
        switchLang: { en: "Español", es: "English" },
        // Tabs
        tabScoring: { en: "How to Score", es: "Cómo Puntuar" },
        tabTds: { en: "TDS Profiling", es: "Perfilado TDS" }
    };

    const FLAVOR_WHEEL_URL = language === 'es' ? "flavor_wheel_es.png" : "flavor_wheel_en.png";

    // Helper to get text based on language
    const gl = (obj: any) => obj?.[language] || obj?.['en'] || '';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
            <div className="bg-white text-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex flex-col border-b border-gray-100 bg-gray-50 rounded-t-xl sticky top-0 z-10 shrink-0">
                    <div className="flex justify-between items-center p-5 pb-2">
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

                    {/* Tab Navigation */}
                    <div className="flex gap-6 px-5 pb-0">
                        <button
                            onClick={() => setActiveTab('scoring')}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'scoring'
                                ? `border-[${PRIMARY_COLOR}] text-[${PRIMARY_COLOR}]`
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            style={{ borderColor: activeTab === 'scoring' ? PRIMARY_COLOR : 'transparent', color: activeTab === 'scoring' ? PRIMARY_COLOR : '' }}
                        >
                            {t.tabScoring[language]}
                        </button>
                        <button
                            onClick={() => setActiveTab('tds')}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'tds'
                                ? `border-[${PRIMARY_COLOR}] text-[${PRIMARY_COLOR}]`
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            style={{ borderColor: activeTab === 'tds' ? PRIMARY_COLOR : 'transparent', color: activeTab === 'tds' ? PRIMARY_COLOR : '' }}
                        >
                            {t.tabTds[language]}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-12 scroll-smooth">
                    {activeTab === 'scoring' && (
                        <>

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
                        </>
                    )}

                    {activeTab === 'tds' && <TDSGuide language={language} />}

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


const TDSGuide = ({ language }: { language: 'en' | 'es' }) => {
    const isEs = language === 'es';
    const PRIMARY_COLOR = '#6f4e37';

    // Helper to render section title
    const SectionTitle = ({ title }: { title: string }) => (
        <h4 className="font-bold text-lg mb-4 text-gray-800 border-b border-gray-100 pb-2">
            {title}
        </h4>
    );

    // Helper for bold text
    const Strong = ({ children }: { children: React.ReactNode }) => <span className="font-bold text-gray-900">{children}</span>;

    return (
        <div className="space-y-12">
            {/* Intro */}
            <section>
                <h3 className="text-xl font-serif font-bold mb-4 pb-2 border-b-2" style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
                    {isEs ? "Guía de Evaluación Sensorial" : "Sensory Evaluation Guide"}
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                    {isEs
                        ? "Esta guía detalla cómo el perfilado de Dominancia Temporal de Sensaciones (TDS) informa su puntuación final."
                        : "This guide details how Temporal Dominance of Sensations (TDS) profiling informs your final scoring."}
                </p>
            </section>

            {/* 1. The Evaluation Workflow */}
            <section>
                <SectionTitle title={isEs ? "1. El Flujo de Evaluación" : "1. The Evaluation Workflow"} />

                <div className="space-y-6">
                    {/* Phase 1 */}
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                        <h5 className="font-bold text-base mb-3 flex items-center gap-2" style={{ color: PRIMARY_COLOR }}>
                            <span className="bg-white w-6 h-6 rounded-full flex items-center justify-center border text-xs shadow-sm">1</span>
                            {isEs ? "Fase 1: Perfilado TDS (El \"Cronómetro\")" : "Phase 1: TDS Profiling (The \"Stopwatch\")"}
                        </h5>
                        <p className="text-sm text-gray-600 mb-4 italic">
                            {isEs
                                ? "En lugar de determinar una puntuación única inmediatamente, registre la evolución del sabor."
                                : "Instead of determining a single score immediately, record the evolution of flavor."}
                        </p>
                        <ul className="space-y-3 text-sm text-gray-700">
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-200 mt-1.5 shrink-0"></div><span><Strong>{isEs ? "INICIO" : "START"}:</Strong> {isEs ? "Haga clic al iniciar la cata/masticar." : "Click immediately when tasting starts."}</span></li>
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div><span><Strong>{isEs ? "DOMINANCIA" : "DOMINANCE"}:</Strong> {isEs ? "Registre qué atributo capta su atención. Solo uno activo a la vez." : "Record which attribute grabs your attention. Only one active at a time."}</span></li>
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0"></div><span><Strong>{isEs ? "TRAGAR" : "SWALLOW"}:</Strong> {isEs ? "Haga clic al tragar. Marca el inicio del Post-gusto." : "Click when you swallow. Marks the start of Aftertaste."}</span></li>
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-800 mt-1.5 shrink-0"></div><span><Strong>{isEs ? "DETENER" : "STOP"}:</Strong> {isEs ? "Cuando no quede sabor significativo (30-60s después)." : "When no significant flavor remains (30-60s after)."}</span></li>
                        </ul>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Phase 2 */}
                        <div className="bg-white p-5 rounded-lg border border-gray-100">
                            <h5 className="font-bold text-base mb-3 flex items-center gap-2" style={{ color: PRIMARY_COLOR }}>
                                <span className="bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center border text-xs">2</span>
                                {isEs ? "Fase 2: Puntuación" : "Phase 2: Attribute Scoring"}
                            </h5>
                            <ul className="space-y-2 text-sm text-gray-700 list-disc pl-4">
                                <li>{isEs ? "El sistema sugiere puntuaciones basadas en datos TDS." : "System suggests scores based on TDS data."}</li>
                                <li>{isEs ? "Ajuste si su impresión difiere." : "Adjust if your impression differs."}</li>
                                <li>{isEs ? "Expanda para agregar Sub-atributos (ej. Cítricos)." : "Expand to add Sub-attributes (e.g. Citrus)."}</li>
                            </ul>
                        </div>

                        {/* Phase 3 */}
                        <div className="bg-white p-5 rounded-lg border border-gray-100">
                            <h5 className="font-bold text-base mb-3 flex items-center gap-2" style={{ color: PRIMARY_COLOR }}>
                                <span className="bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center border text-xs">3</span>
                                {isEs ? "Fase 3: Calidad Global" : "Phase 3: Global Quality"}
                            </h5>
                            <ul className="space-y-2 text-sm text-gray-700 list-disc pl-4">
                                <li>{isEs ? "Asigne una puntuación de armonía general." : "Assign an overall harmony score."}</li>
                                <li>{isEs ? "Agregue notas para el productor." : "Add specific notes for the producer."}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. How TDS Helps */}
            <section>
                <SectionTitle title={isEs ? "2. Cómo el TDS Ayuda a Puntuar" : "2. How TDS Helps You Score"} />
                <p className="text-sm text-gray-600 mb-6 w-full max-w-2xl bg-blue-50 p-3 rounded text-blue-800">
                    {isEs
                        ? "La aplicación usa duración y orden para calcular recomendaciones objetivas, eliminando sesgos."
                        : "The app uses duration and order to calculate objective recommendations, removing bias."}
                </p>

                <div className="space-y-8">
                    {/* A. Intensity */}
                    <div className="flex gap-4 items-start">
                        <div className="font-bold text-2xl text-gray-200 mt-[-4px]">A</div>
                        <div className="flex-1">
                            <h5 className="font-bold text-gray-900 mb-2">{isEs ? "Intensidad = Duración" : "Intensity = Duration"}</h5>
                            <h6 className="text-m text-gray-500 mb-3 font-normal italic">
                                {isEs
                                    ? "Esto muestra cómo la puntuación TDS sugiere la puntuación CoEx. En la práctica, el mapeo es más complejo y se ha ido ajustando con el tiempo para adaptarse al uso real."
                                    : "This shows how the TDS score suggests the CoEx score. In reality, the mapping is more complicated and has been tweaked over time to fit actual use."}
                            </h6>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                <div className="p-3 bg-gray-50 border rounded text-center">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{isEs ? "Traza" : "Trace"}</div>
                                    <div className="font-bold text-lg mb-1">&lt; 5%</div>
                                    <div className="text-gray-600">{isEs ? "Puntuación 1-2" : "Score 1-2"}</div>
                                </div>
                                <div className="p-3 bg-gray-50 border rounded text-center">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{isEs ? "Distintivo" : "Distinct"}</div>
                                    <div className="font-bold text-lg mb-1">10-15%</div>
                                    <div className="text-gray-600">{isEs ? "Puntuación 3-5" : "Score 3-5"}</div>
                                </div>
                                <div className="p-3 bg-gray-50 border rounded text-center">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{isEs ? "Dominante" : "Dominant"}</div>
                                    <div className="font-bold text-lg mb-1">&gt; 30%</div>
                                    <div className="text-gray-600">{isEs ? "Puntuación 7+" : "Score 7+"}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* B. Attack */}
                    <div className="flex gap-4 items-start">
                        <div className="font-bold text-2xl text-gray-200 mt-[-4px]">B</div>
                        <div className="flex-1">
                            <h5 className="font-bold text-gray-900 mb-1">{isEs ? "El \"Impacto Inicial\" (Ataque)" : "The \"Kick\" (Attack Phase)"}</h5>
                            <p className="text-sm text-gray-600 mb-2">
                                {isEs
                                    ? "Los primeros segundos definen el perfil aromático y sugieren notas complementarias."
                                    : "First seconds define the aroma profile and suggest complementary notes."}
                            </p>
                            <div className="bg-amber-50 p-3 rounded text-sm text-amber-900 border border-amber-100 inline-block">
                                💡 {isEs ? "Ej: Alta Acidez inicial → Sugiere Fruta." : "Ex: High Acidity at start → Suggests Fruit."}
                            </div>
                        </div>
                    </div>

                    {/* C. Aftertaste */}
                    <div className="flex gap-4 items-start">
                        <div className="font-bold text-2xl text-gray-200 mt-[-4px]">C</div>
                        <div className="flex-1">
                            <h5 className="font-bold text-gray-900 mb-1">{isEs ? "El Post-gusto (Refuerzos)" : "The Aftertaste (Finish Phase)"}</h5>
                            <p className="text-sm text-gray-600 mb-3">
                                {isEs
                                    ? "Lo que determina la calidad del final y posibles refuerzos al puntaje."
                                    : "Determines finish quality and potential score boosts."}
                            </p>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <span>
                                        <Strong>{isEs ? "Presencia Persistente" : "Lingering Presence"}</Strong>:
                                        {isEs ? " > 5s en post-gusto sugiere +1 al puntaje." : " > 5s in aftertaste suggests +1 score boost."}
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">✓</span>
                                    <span>
                                        <Strong>{isEs ? "Final Limpio" : "Clean Finish"}</Strong>:
                                        {isEs ? "Sin amargor persistente mejora la Calidad Global." : "No lingering bitterness improves Global Quality."}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* D. Expert Mode Recommendations */}
                    <div className="flex gap-4 items-start pt-2 border-t border-dashed">
                        <div className="font-bold text-2xl text-gray-200 mt-[-4px]">D</div>
                        <div className="flex-1">
                            <h5 className="font-bold text-gray-900 mb-1">{isEs ? "Recomendaciones en Modo Experto" : "Expert Mode Recommendations"}</h5>
                            <p className="text-sm text-gray-600">
                                {isEs
                                    ? "Las notas específicas actúan como referencia para ajustar categorías más amplias (ej. Nuez sugiere revisar Cacao)."
                                    : "Specific notes act as a reference to adjust broader categories (e.g. Nutty suggests reviewing Cocoa)."}
                            </p>
                        </div>
                    </div>


                </div>
            </section>

            {/* 3. Export */}
            <section>
                <SectionTitle title={isEs ? "3. Resumen y Exportación" : "3. Summary & Export"} />
                <p className="text-sm text-gray-700">
                    {isEs
                        ? "Use 'Descargar PDF' para generar un informe oficial."
                        : "Use 'Download PDF' to generate an official report."}
                </p>
            </section>
        </div>
    );
};

export default GuidelinesModal;
