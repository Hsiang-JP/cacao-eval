import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService, StoredSample } from '../services/dbService';
import Header from '../components/Header';
import { TRANSLATIONS } from '../constants';
import { Plus, Search, Trash2, Calendar, User, FileText, CheckSquare, Square, BarChart2, Download, Upload } from 'lucide-react';
import SampleLibraryCard from '../components/samples/SampleLibraryCard';
import Papa from 'papaparse';
import { CSV_HEADERS_EN, CSV_HEADERS_ES } from '../constants';

interface SamplesPageProps {
    language: 'en' | 'es';
    onLanguageChange: (lang: 'en' | 'es') => void;
}

const SamplesPage: React.FC<SamplesPageProps> = ({ language, onLanguageChange }) => {
    const navigate = useNavigate();
    const t = TRANSLATIONS[language];
    const [samples, setSamples] = useState<StoredSample[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadSamples();
    }, []);

    const loadSamples = async () => {
        try {
            setLoading(true);
            const data = await dbService.getAllSamples();
            setSamples(data);
        } catch (error) {
            console.error('Failed to load samples:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (window.confirm(language === 'es' ? `¿Eliminar muestra ${code}?` : `Delete sample ${code}?`)) {
            try {
                await dbService.deleteSample(id);
                setSamples(prev => prev.filter(s => s.id !== id));
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            } catch (error) {
                console.error('Failed to delete sample:', error);
            }
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const filteredSamples = samples.filter(s =>
        s.sampleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.evaluator.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCompare = () => {
        if (selectedIds.size < 2) {
            alert(language === 'es' ? 'Seleccione al menos 2 muestras para comparar' : 'Select at least 2 samples to compare');
            return;
        }
        const ids = Array.from(selectedIds).join(',');
        navigate(`/compare?ids=${ids}`);
    };

    const handleExport = async () => {
        const samplesToExport = selectedIds.size > 0
            ? samples.filter(s => selectedIds.has(s.id))
            : samples; // Export all if none selected

        if (samplesToExport.length === 0) return;

        const { generateCSVRow } = await import('../services/csvService');
        const headers = language === 'es' ? CSV_HEADERS_ES : CSV_HEADERS_EN;

        const rows = samplesToExport.map(s => generateCSVRow(s, language));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `coex_bulk_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        document.getElementById('csv-import-input')?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const { parseSamplesFromCSV } = await import('../services/csvService');
                    const importedSamples = parseSamplesFromCSV(results.data, language);

                    if (importedSamples.length > 0) {
                        await dbService.importSamples(importedSamples);
                        await loadSamples(); // Refresh list
                        alert(language === 'es' ? `Se importaron ${importedSamples.length} muestras exitosamente.` : `Successfully imported ${importedSamples.length} samples.`);
                    } else {
                        alert(language === 'es' ? 'No se encontraron muestras válidas en el archivo CSV.' : 'No valid samples found in CSV.');
                    }
                } catch (error) {
                    console.error('Import failed', error);
                    alert(language === 'es' ? 'Error al importar muestras.' : 'Failed to import samples.');
                }
            }
        });
        // Reset input
        event.target.value = '';
    };

    return (
        <div className="min-h-screen bg-cacao-50 text-gray-800 font-sans pb-20">
            <Header language={language} onLanguageChange={onLanguageChange} />

            <main className="w-full px-4 md:px-8 space-y-6">

                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-cacao-100">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t.searchSamples || "Search samples..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cacao-500"
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <input
                            type="file"
                            id="csv-import-input"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={handleImportClick}
                            className="bg-white border border-cacao-200 text-cacao-700 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-cacao-50 transition-colors flex items-center justify-center gap-2"
                            title={t.importSamples}
                        >
                            <Upload size={20} />
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-white border border-cacao-200 text-cacao-700 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-cacao-50 transition-colors flex items-center justify-center gap-2"
                            title={t.exportAllCSV}
                        >
                            <Download size={20} />
                        </button>

                        {selectedIds.size > 0 && (
                            <button
                                onClick={handleCompare}
                                className="bg-cacao-800 hover:bg-cacao-900 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                            >
                                <BarChart2 size={20} />
                                {t.compare || "Compare"} ({selectedIds.size})
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/evaluate')}
                            className="flex-1 md:flex-none bg-cacao-600 hover:bg-cacao-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            {t.newEvaluation}
                        </button>
                    </div>
                </div>

                {/* Samples List */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading samples...</div>
                ) : filteredSamples.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">{t.noSamples || "No samples found"}</p>
                        <button
                            onClick={() => navigate('/evaluate')}
                            className="text-cacao-600 font-bold hover:underline"
                        >
                            Start your first evaluation
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filteredSamples.map(sample => (
                            <SampleLibraryCard
                                key={sample.id}
                                sample={sample}
                                language={language}
                                isSelected={selectedIds.has(sample.id)}
                                onToggleSelect={toggleSelection}
                                onDelete={handleDelete}
                                t={t}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default SamplesPage;
