import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { ArrowLeft, FileDown, Layers, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Footer from '../components/Footer';
import { dbService, StoredSample } from '../services/dbService';

import { ComparisonRadar } from '../components/compare/ComparisonRadar';
import { ClusterResults } from '../components/compare/ClusterResults';
import { SimilarityHeatmap } from '../components/compare/SimilarityHeatmap';
import { calculateDistanceMatrix, performClustering, DistanceResult, ClusterResult } from '../services/analysisService';

const ComparePage: React.FC = () => {
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // State
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<StoredSample[]>([]);
    const [mode, setMode] = useState<'simple' | 'advanced'>('simple');

    // Analysis State
    const [distanceData, setDistanceData] = useState<DistanceResult | null>(null);
    const [clusters, setClusters] = useState<ClusterResult[]>([]);
    const [analyzing, setAnalyzing] = useState(false);

    // 1. Load Data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const ids = searchParams.get('ids')?.split(',') || [];
                if (ids.length === 0) {
                    setSessions([]);
                    return;
                }

                const allSamples = await dbService.getAllSamples();
                const selected = allSamples.filter(s => ids.includes(s.id));
                setSessions(selected);

                // Auto-set mode based on count
                if (selected.length > 10) {
                    setMode('advanced');
                }
            } catch (error) {
                console.error("Failed to load samples", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [searchParams]);

    // 2. Perform Analysis (Async for Clustering)
    useEffect(() => {
        const runAnalysis = async () => {
            if (sessions.length < 2) {
                setDistanceData(null);
                setClusters([]);
                return;
            }

            setAnalyzing(true);
            try {
                // A. Distance Matrix (Sync)
                // analysisService now accepts StoredSample[]
                const distResult = calculateDistanceMatrix(sessions);
                setDistanceData(distResult);

                // B. Clustering (Async)
                if (sessions.length > 2) {
                    const clusterResult = await performClustering(sessions, distResult);
                    setClusters(clusterResult);
                }
            } catch (err) {
                console.error("Analysis failed", err);
            } finally {
                setAnalyzing(false);
            }
        };

        runAnalysis();
    }, [sessions]);

    // Handlers
    const handleExportPDF = async () => {
        if (sessions.length === 0) return;

        try {
            // Map sessions to the format expected by generateComparisonPdf
            const comparisonSamples = sessions.map(s => ({
                id: s.id,
                sampleCode: s.sampleCode,
                evaluator: s.evaluator,
                globalQuality: s.globalQuality,
                attributes: s.attributes
            }));

            // Map clusters to the format expected by generateComparisonPdf
            const comparisonClusters = clusters.map(c => ({
                id: c.id,
                name: c.name,
                sampleCodes: c.sampleCodes,
                avgQuality: c.avgQuality,
                dominantTraits: c.dominantTraits
            }));

            // Dynamically import to keep main bundle small
            const { generateComparisonPdf } = await import('../services/comparisonPdfService');
            await generateComparisonPdf(comparisonSamples, comparisonClusters, language);
        } catch (e) {
            console.error("PDF Export failed", e);
            alert(language === 'es' ? "Error al generar el PDF." : "Failed to generate PDF.");
        }
    };

    const handleBack = () => navigate('/samples');

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-cacao-50">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cacao-600"></div>
                </div>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="flex flex-col min-h-screen bg-cacao-50">
                <Header />
                <main className="p-8 text-center flex-grow">
                    <h2 className="text-xl text-gray-600">No samples selected.</h2>
                    <button onClick={handleBack} className="mt-4 text-cacao-600 hover:underline">
                        Go back to Library
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-cacao-50 text-gray-800 font-sans">
            <Header />

            <main className="w-full px-4 md:px-8 space-y-6 flex-grow py-6">
                {/* Top Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full transition-colors shadow-sm"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-cacao-900">
                                {mode === 'simple' ? (language === 'es' ? 'Comparación' : 'Comparison') : (language === 'es' ? 'Análisis de Grupos' : 'Cluster Analysis')}
                            </h1>
                            <p className="text-xs text-gray-500">
                                {sessions.length} {language === 'es' ? 'muestras seleccionadas' : 'samples selected'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mode Toggle */}
                        <div className="bg-gray-200 p-1 rounded-lg flex items-center">
                            <button
                                onClick={() => setMode('simple')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'simple' ? 'bg-white text-cacao-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Activity size={16} className="inline mr-1" />
                                {language === 'es' ? 'Radar' : 'Radar'}
                            </button>
                            <button
                                onClick={() => setMode('advanced')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'advanced' ? 'bg-white text-cacao-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Layers size={16} className="inline mr-1" />
                                {language === 'es' ? 'Grupos' : 'Clusters'}
                            </button>
                        </div>

                        {/* Export */}
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-cacao-600 text-white rounded-lg hover:bg-cacao-700 shadow-sm transition-colors text-sm font-medium"
                        >
                            <FileDown size={18} />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN: Visualization */}
                    <div className="lg:col-span-2 space-y-6">
                        {mode === 'simple' ? (
                            <div className="bg-white rounded-xl shadow-sm border border-cacao-100 flex flex-col">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="font-bold text-gray-700">Flavor Profile Overlay</h3>
                                </div>
                                <div className="p-4 min-h-[500px]">
                                    {/* Note: ComparisonRadar needs to accept StoredSample or use mapping. 
                                        I will update ComparisonRadar next. */}
                                    <ComparisonRadar sessions={sessions as any} />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Advanced Mode: Cluster Results */}
                                <h3 className="font-bold text-gray-700">
                                    {language === 'es' ? 'Grupos Identificados' : 'Identified Groups'}
                                </h3>
                                {analyzing ? (
                                    <div className="text-center py-10 text-gray-500">
                                        Running clustering analysis...
                                    </div>
                                ) : (
                                    <ClusterResults clusters={clusters} sessions={sessions} />
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Similarity / Stats */}
                    <div className="space-y-6">
                        {/* Similarity Heatmap */}
                        {distanceData && (
                            <div className="bg-white rounded-xl shadow-sm border border-cacao-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="font-bold text-gray-700">
                                        {language === 'es' ? 'Matriz de Similitud' : 'Similarity Matrix'}
                                    </h3>
                                </div>
                                <div className="p-2">
                                    <SimilarityHeatmap
                                        similarityMatrix={distanceData.similarityMatrix}
                                        sampleCodes={distanceData.sampleIds.map(id => {
                                            const s = sessions.find(sess => sess.id === id);
                                            return s ? s.sampleCode : id.substring(0, 4);
                                        })}
                                    />
                                </div>
                            </div>
                        )}


                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
};

export default ComparePage;
