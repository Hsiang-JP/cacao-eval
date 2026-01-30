import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { TRANSLATIONS } from '../constants';
import { dbService, StoredSample } from '../services/dbService';
import { ArrowLeft } from 'lucide-react';
import ComparisonMatrix from '../components/comparison/ComparisonMatrix';

interface ComparePageProps {
    language: 'en' | 'es';
    onLanguageChange: (lang: 'en' | 'es') => void;
}

const ComparePage: React.FC<ComparePageProps> = ({ language, onLanguageChange }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const t = TRANSLATIONS[language];

    const [samples, setSamples] = useState<StoredSample[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ids = searchParams.get('ids')?.split(',') || [];
        if (ids.length === 0) {
            setLoading(false);
            return;
        }
        loadSamples(ids);
    }, [searchParams]);

    const loadSamples = async (ids: string[]) => {
        try {
            setLoading(true);
            const loadedSamples: StoredSample[] = [];
            for (const id of ids) {
                const sample = await dbService.getSample(id);
                if (sample) loadedSamples.push(sample);
            }
            setSamples(loadedSamples);
        } catch (error) {
            console.error('Failed to load comparison samples:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading comparison...</div>;
    }

    if (samples.length === 0) {
        return (
            <div className="min-h-screen bg-cacao-50 flex flex-col items-center justify-center p-4">
                <p className="text-xl text-gray-500 mb-4">{t.noSamples || "No samples selected"}</p>
                <button
                    onClick={() => navigate('/samples')}
                    className="bg-cacao-600 text-white px-6 py-2 rounded-lg"
                >
                    {t.savedSamples || "Go to Library"}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cacao-50 text-gray-800 font-sans pb-20">
            <Header language={language} onLanguageChange={onLanguageChange} />

            <main className="w-full px-4 md:px-8 space-y-6">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => navigate('/samples')}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-cacao-900">{t.compare || "Compare Samples"}</h1>
                </div>


                {/* Comparison Matrix */}
                <div className="bg-white rounded-xl shadow-sm border border-cacao-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">
                            {language === 'es' ? 'Matriz de Comparación' : 'Sensory Matrix'}
                        </div>
                        <div className="text-xs text-gray-400">
                            {language === 'es' ? 'Pasa el cursor sobre el ID para ver detalles' : 'Hover over ID for details'}
                        </div>
                    </div>
                    <ComparisonMatrix
                        samples={samples}
                        language={language}
                    />
                </div>
            </main>
        </div>
    );
};

export default ComparePage;
