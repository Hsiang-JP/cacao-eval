import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import SampleLibraryCard from '../components/samples/SampleLibraryCard';
import TDSTimeline from '../components/tds/TDSTimeline';
import { StoredSample } from '../services/dbService';
import { aggregateReplications, TDSReplication, AggregatedTDSResult } from '../utils/tdsAnalytics';
import TDSAggregationChart from '../components/tds/TDSAggregationChart';
import TDSStreamGraph from '../components/tds/TDSStreamGraph';

const TDSDeepPage: React.FC = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const ids = searchParams.get('ids')?.split(',') || [];
    const [activeTab, setActiveTab] = React.useState<'single' | 'multiple'>('multiple'); // Default to multiple as per flow context usually implies comparison
    const [samples, setSamples] = React.useState<StoredSample[]>([]);

    // Fetch samples
    React.useEffect(() => {
        const loadSamples = async () => {
            if (ids.length === 0) return;
            try {
                // Dynamically import to resolve circular dependencies if any, or just standard pattern
                const dbModule = await import('../services/dbService');
                const allSamples = await dbModule.dbService.getAllSamples();
                const filtered = allSamples.filter(s => ids.includes(s.id));
                setSamples(filtered);
            } catch (error) {
                console.error("Failed to load samples", error);
            }
        };
        loadSamples();
    }, [ids.join(',')]);

    // 2. Compute Unique Attributes ONCE
    const uniqueAttributes = React.useMemo(() => {
        if (samples.length === 0) return [];
        const allAttrIds = new Set<string>();
        samples.forEach(s => {
            s.tdsProfile?.events.forEach(e => allAttrIds.add(e.attrId));
        });
        return Array.from(allAttrIds);
    }, [samples]);

    // Compute Aggregated Results
    const aggregationResult = React.useMemo<AggregatedTDSResult | null>(() => {
        if (samples.length === 0) return null;

        // 1. Extract valid replications
        const replications: TDSReplication[] = samples
            .filter(s => s.tdsProfile && s.tdsProfile.events.length > 0)
            .map(s => ({
                id: s.id,
                duration: s.tdsProfile!.totalDuration,
                events: s.tdsProfile!.events,
                swallowTime: s.tdsProfile!.swallowTime
            }));

        if (replications.length === 0) return null;

        // 3. Aggregate using pre-computed attributes
        return aggregateReplications(replications, uniqueAttributes);

    }, [samples, uniqueAttributes]);

    // Active attributes for charts is simply the unique set
    const activeAttributeIds = uniqueAttributes;

    return (
        <div className="flex flex-col min-h-screen bg-cacao-50 text-gray-800 font-sans">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 md:py-8">

                {/* Top Section: Nav, Title, Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-white/50 text-cacao-700 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-cacao-900 leading-tight">
                                {language === 'es' ? 'Análisis TDS Profundo' : 'TDS Deep Dive'}
                            </h1>
                            <p className="text-sm md:text-base text-cacao-600">
                                {language === 'es'
                                    ? 'Comparación temporal y agregación de muestras'
                                    : 'Temporal comparison and sample aggregation'}
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-cacao-100 rounded-xl overflow-hidden shadow-inner self-start md:self-center">
                        <button
                            onClick={() => setActiveTab('single')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'single'
                                ? 'bg-white text-cacao-800 shadow-sm'
                                : 'text-cacao-600 hover:text-cacao-800 hover:bg-cacao-200/50'
                                }`}
                        >
                            {language === 'es' ? 'Único' : 'Single'}
                        </button>
                        <button
                            onClick={() => setActiveTab('multiple')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'multiple'
                                ? 'bg-white text-cacao-800 shadow-sm'
                                : 'text-cacao-600 hover:text-cacao-800 hover:bg-cacao-200/50'
                                }`}
                        >
                            {language === 'es' ? 'Múltiple' : 'Multiple'}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    {activeTab === 'single' ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* SINGLE VIEW */}
                            {samples.length > 0 && (
                                <SingleViewHandler
                                    samples={samples}
                                    activeAttributeIds={activeAttributeIds}
                                />
                            )}
                            {samples.length === 0 && (
                                <div className="text-center py-20 text-gray-400">
                                    {language === 'es' ? 'No hay muestras seleccionadas.' : 'No samples selected.'}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* List of Samples (Card + Timeline) */}
                            <div className="space-y-6">
                                {samples.map(sample => (
                                    <div key={sample.id}>
                                        <TDSDeepSampleRow sample={sample} />
                                    </div>
                                ))}

                                {samples.length === 0 && (
                                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                                        <div className="animate-pulse text-gray-400">
                                            {language === 'es' ? 'Cargando muestras...' : 'Loading samples...'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Aggregation Engine Results */}
                            {aggregationResult ? (
                                <div className="space-y-4">
                                    <TDSAggregationChart
                                        data={aggregationResult}
                                        attributeIds={activeAttributeIds}
                                    />
                                </div>
                            ) : (
                                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center h-64 flex flex-col items-center justify-center">
                                    <p className="text-gray-500 font-medium">
                                        {language === 'es'
                                            ? 'No hay suficientes datos TDS para generar la agregación.'
                                            : 'Not enough TDS data to generate aggregation.'}
                                    </p>
                                </div>
                            )}

                        </div>
                    )}
                </div>

            </main>

            <Footer />
        </div>
    );
};

// Sub-component for Single View Logic to keep main clean
const SingleViewHandler: React.FC<{ samples: StoredSample[], activeAttributeIds: string[] }> = ({ samples, activeAttributeIds }) => {
    const { language, t } = useLanguage();
    // Maintain local state for the selector
    const [selectedId, setSelectedId] = React.useState<string>(samples[0]?.id);

    // Safety check: if selectedId is not in samples (e.g. samples changed), default to first
    React.useEffect(() => {
        if (!samples.find(s => s.id === selectedId)) {
            setSelectedId(samples[0]?.id);
        }
    }, [samples, selectedId]);

    const activeSample = samples.find(s => s.id === selectedId) || samples[0];

    if (!activeSample) return null;

    return (
        <div className="space-y-6">
            {/* 1. Selector Dropdown (Only if multiple samples exist) */}
            {samples.length > 1 && (
                <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <label className="text-sm font-bold text-gray-500">
                        {language === 'es' ? 'Seleccionar Muestra:' : 'Select Sample:'}
                    </label>
                    <div className="relative flex-1 max-w-md">
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-cacao-900 text-sm rounded-lg focus:ring-cacao-500 focus:border-cacao-500 block p-2.5 font-medium appearance-none pr-8"
                        >
                            {samples.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.sampleCode} ({s.evaluator})
                                </option>
                            ))}
                        </select>
                        {/* Custom arrow for better styling */}
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Top Row: Card + Timeline -> Reused Component */}
            <TDSDeepSampleRow sample={activeSample} />

            {/* 3. Bottom Row: Stream Graph */}
            <div className="animate-fade-in-up delay-100">
                {activeSample.tdsProfile ? (
                    <TDSStreamGraph
                        profile={activeSample.tdsProfile!}
                        allAttributeIds={activeAttributeIds}
                    />
                ) : (
                    <div className="p-8 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
                        No TDS Profile Data
                    </div>
                )}
            </div>
        </div>
    );
};

// Reusable Component for Sample Row (Card + Timeline) to ensure consistency
const TDSDeepSampleRow: React.FC<{ sample: StoredSample }> = ({ sample }) => {
    const { language } = useLanguage();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Sample Card Info */}
            <div className="lg:col-span-1">
                <SampleLibraryCard
                    sample={sample}
                    selectable={false}
                    compact
                />
            </div>

            {/* Right: Timeline */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
                    {language === 'es' ? 'Línea de Tiempo (Eventos)' : 'Timeline (Raw Events)'}
                </h3>
                <div className="flex-1 flex flex-col justify-center">
                    {sample.tdsProfile ? (
                        <TDSTimeline
                            profile={sample.tdsProfile}
                        />
                    ) : (
                        <div className="h-32 flex items-center justify-center text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            {language === 'es' ? 'Sin datos TDS registrados' : 'No TDS data recorded'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TDSDeepPage;
