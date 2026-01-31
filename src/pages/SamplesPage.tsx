import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService, StoredSample } from '../services/dbService';
import { getDateStringForFilename } from '../utils/dateUtils';
import Header from '../components/Header';
import { TRANSLATIONS } from '../constants';
import { Plus, Search, Trash2, Calendar, User, FileText, CheckSquare, Square, BarChart2, Download, Upload } from 'lucide-react';
import SampleLibraryCard from '../components/samples/SampleLibraryCard';
import Papa from 'papaparse';
import { CSV_HEADERS_EN, CSV_HEADERS_ES } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import Footer from '../components/Footer';

const SamplesPage: React.FC = () => {
    const { language, t } = useLanguage();
    const navigate = useNavigate();
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

        // Prompt for filename
        const defaultName = `cacao_eval_${getDateStringForFilename()}`;
        const userInput = window.prompt(language === 'es' ? 'Nombre del archivo CSV:' : 'Enter filename for CSV:', defaultName);

        if (userInput === null) return; // Cancelled
        const filename = (userInput || defaultName).endsWith('.csv') ? (userInput || defaultName) : `${userInput || defaultName}.csv`;

        const { generateCSVRow } = await import('../services/csvService');
        const headers = language === 'es' ? CSV_HEADERS_ES : CSV_HEADERS_EN;

        const rows = samplesToExport.map(s => generateCSVRow(s, language));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkPdf = async () => {
        if (selectedIds.size === 0) return;

        const samplesToExport = samples.filter(s => selectedIds.has(s.id));

        // Prompt for filename
        const defaultName = `cacao_eval_${getDateStringForFilename()}`;
        const userInput = window.prompt(language === 'es' ? 'Nombre del archivo PDF:' : 'Enter filename for PDF:', defaultName);

        if (userInput === null) return; // Cancelled
        const filename = (userInput || defaultName); // Extension handled by pdfService if missing

        try {
            const { generatePdf } = await import('../services/pdfService');
            // Map StoredSample to GradingSession structure
            const sessions = samplesToExport.map(s => ({
                metadata: {
                    sampleCode: s.sampleCode,
                    date: s.date,
                    time: s.time,
                    evaluator: s.evaluator,
                    evaluationType: s.evaluationType,
                    sampleInfo: s.sampleInfo,
                    notes: s.notes,
                    producerRecommendations: s.producerRecommendations
                },
                attributes: s.attributes,
                globalQuality: s.globalQuality,
                selectedQualityId: s.selectedQualityId,
                language: language,
                tdsProfile: s.tdsProfile // Include TDS Profile in export
            }));

            await generatePdf(sessions, undefined, filename);
        } catch (error) {
            console.error("PDF Export failed", error);
            alert(language === 'es' ? 'Error al generar PDF' : 'Failed to generate PDF');
        }
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
                    // Initial parse (these have NO IDs yet)
                    const importedSamples = parseSamplesFromCSV(results.data, language);

                    // 1. FILTERING: We do NOT filter out 0 values as per user request. 
                    // We only ensure the sample has the minimum identification data to be valid.
                    const validImportedSamples = importedSamples.filter(s => s.sampleCode && s.date && s.evaluator);

                    const skippedCount = importedSamples.length - validImportedSamples.length;

                    if (skippedCount > 0) {
                        alert(language === 'es'
                            ? `Se omitieron ${skippedCount} entradas por faltar datos de identificación (Código, Fecha o Evaluador).`
                            : `Skipped ${skippedCount} entries due to missing identification data (Code, Date, or Evaluator).`
                        );
                    }

                    if (validImportedSamples.length > 0) {
                        // 2. DUPLICATE CHECK: Code + Evaluator + Date
                        const duplicates: { importIdx: number; existingId: string; code: string; createdAt: number }[] = [];

                        validImportedSamples.forEach((imp, idx) => {
                            const match = samples.find(s =>
                                s.sampleCode.toLowerCase() === imp.sampleCode.toLowerCase() &&
                                s.evaluator.toLowerCase() === imp.evaluator.toLowerCase() &&
                                s.date === imp.date
                            );
                            if (match) {
                                duplicates.push({
                                    importIdx: idx,
                                    existingId: match.id,
                                    code: imp.sampleCode,
                                    createdAt: match.createdAt
                                });
                            }
                        });


                        const samplesToImport: any[] = [...validImportedSamples];

                        if (duplicates.length > 0) {
                            const confirmMsg = language === 'es'
                                ? `Se encontraron ${duplicates.length} muestras duplicadas (mismo Código, Evaluador y Fecha). \n\nSi continúa, estas muestras serán REEMPLAZADAS con los datos del CSV.\n\n¿Desea continuar?`
                                : `Found ${duplicates.length} duplicate samples (same Code, Evaluator, and Date). \n\nProceeding will REPLACE these samples with the data from the CSV.\n\nDo you want to proceed?`;

                            if (!window.confirm(confirmMsg)) {
                                return; // Abort whole import
                            }

                            // Assign existing IDs to the imported objects to trigger UPDATE (Upsert)
                            duplicates.forEach(dup => {
                                samplesToImport[dup.importIdx] = {
                                    ...samplesToImport[dup.importIdx],
                                    id: dup.existingId,
                                    createdAt: dup.createdAt // Preserve original creation time
                                };
                            });
                        }

                        // Upsert
                        await dbService.importSamples(samplesToImport);

                        await loadSamples(); // Refresh list
                        alert(language === 'es'
                            ? `Proceso finalizado: ${duplicates.length} reemplazadas, ${validImportedSamples.length - duplicates.length} nuevas.`
                            : `Process complete: ${duplicates.length} replaced, ${validImportedSamples.length - duplicates.length} new samples imported.`);
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
        <div className="flex flex-col min-h-screen bg-cacao-50 text-gray-800 font-sans">
            <Header />

            {/* Hidden File Input for CSV Import */}
            <input
                type="file"
                id="csv-import-input"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
            />

            <main className="w-full px-4 md:px-8 space-y-6 mb-8 flex-grow">

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

                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">

                        {/* Selection Count Indicator - Always visible to prevent layout shift */}
                        <div className={`px-3 py-2 rounded-lg border text-sm font-bold flex items-center shadow-sm transition-all duration-300 ${selectedIds.size > 0
                            ? 'bg-cacao-100 text-cacao-800 border-cacao-200'
                            : 'bg-gray-50 text-gray-400 border-gray-100'
                            }`}>
                            {selectedIds.size} {language === 'es' ? 'Seleccionadas' : 'Selected'}
                        </div>

                        <button
                            onClick={handleImportClick}
                            className="bg-white border border-cacao-200 text-cacao-700 font-bold py-2 px-3 rounded-lg shadow-sm hover:bg-cacao-50 transition-colors flex items-center justify-center gap-2"
                            title={t.importSamples}
                        >
                            <Upload size={20} />
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-white border border-cacao-200 text-cacao-700 font-bold py-2 px-3 rounded-lg shadow-sm hover:bg-cacao-50 transition-colors flex items-center justify-center gap-2"
                            title={t.exportAllCSV}
                        >
                            <Download size={20} />
                        </button>

                        <button
                            onClick={handleBulkPdf}
                            disabled={selectedIds.size === 0}
                            className={`font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center justify-center ${selectedIds.size === 0
                                ? 'bg-amber-200 text-white cursor-not-allowed opacity-50'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                                }`}
                            title={language === 'es' ? "Descargar PDF" : "Download PDF"}
                        >
                            PDF
                        </button>

                        <button
                            onClick={handleCompare}
                            disabled={selectedIds.size < 2}
                            className={`font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center justify-center ${selectedIds.size < 2
                                ? 'bg-cacao-300 text-white cursor-not-allowed opacity-50'
                                : 'bg-cacao-800 hover:bg-cacao-900 text-white'
                                }`}
                            title={t.compare || "Compare"}
                        >
                            {t.compare || "Compare"}
                        </button>

                        <button
                            onClick={() => navigate('/evaluate')}
                            className="bg-cacao-600 hover:bg-cacao-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline">{t.newEvaluation}</span>
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
                                isSelected={selectedIds.has(sample.id)}
                                onToggleSelect={toggleSelection}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default SamplesPage;
