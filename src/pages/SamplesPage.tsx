import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService, StoredSample } from '../services/dbService';
import { getDateStringForFilename } from '../utils/dateUtils';
import Header from '../components/Header';
import { TRANSLATIONS } from '../constants';
import { Search, Trash2, Calendar, User, FileText, CheckSquare, Square, BarChart2, Upload, Download, Plus } from 'lucide-react';
import SampleLibraryCard from '../components/samples/SampleLibraryCard';
import Papa from 'papaparse';
import { CSV_HEADERS_EN, CSV_HEADERS_ES } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import Footer from '../components/Footer';
import { matchesSearch } from '../utils/searchLogic';

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

    const filteredSamples = samples.filter(s => {
        return matchesSearch(s, searchTerm);
    });

    const hasTdsData = selectedIds.size > 0 && Array.from(selectedIds).every(id => {
        const sample = samples.find(s => s.id === id);
        // Check if sample exists and has a non-empty tdsProfile
        return sample?.tdsProfile && Object.keys(sample.tdsProfile).length > 0;
    });

    const handleTDSClick = () => {
        if (selectedIds.size === 0 || !hasTdsData) return;
        const ids = Array.from(selectedIds).join(',');
        navigate(`/tds-deep?ids=${ids}`);
    };

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
                accept=".csv, text/csv, application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileChange}
            />

            <main className="w-full px-4 md:px-8 space-y-6 mb-8 flex-grow">

                {/* Actions Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-cacao-100 flex flex-col gap-4">

                    {/* Responsive Layout: Search stacks on mobile, side-by-side on desktop */}
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="relative w-full lg:w-96 flex-shrink-0 z-20">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder={t.searchSamples || "Search samples..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cacao-500 focus:bg-white transition-all"
                            />
                            {/* Help Tooltip */}
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 group">
                                <span className="text-gray-400 cursor-help text-xs font-bold border border-gray-300 rounded-full w-5 h-5 flex items-center justify-center">?</span>
                                <div className="absolute right-0 top-8 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    <p className="font-bold mb-1">Advanced Filters:</p>
                                    <ul className="space-y-1 text-gray-300">
                                        <li><code>score {'>'} 8</code></li>
                                        <li><code>acidity {'>='} 5</code></li>
                                        <li><code>date : 2024</code></li>
                                        <li><code>cocoa OR score {'>'} 9</code></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Actions Container */}
                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">

                            {/* Group 1: File Actions (Import/Export) */}
                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                <button
                                    onClick={handleImportClick}
                                    className="p-2 text-cacao-700 hover:bg-white hover:text-cacao-900 hover:shadow-sm rounded-md transition-all"
                                    title={t.importSamples}
                                >
                                    <Upload size={20} />
                                </button>
                                <div className="w-px h-6 bg-gray-200"></div>
                                <button
                                    onClick={handleExport}
                                    className="p-2 text-cacao-700 hover:bg-white hover:text-cacao-900 hover:shadow-sm rounded-md transition-all"
                                    title={t.exportAllCSV}
                                >
                                    <Download size={20} />
                                </button>
                            </div>

                            {/* Group 2: Selection & Reports */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Selection / Clear Button */}
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    disabled={selectedIds.size === 0}
                                    className={`px-3 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all duration-200 ${selectedIds.size > 0
                                        ? 'bg-cacao-100 text-cacao-900 border-cacao-200 hover:bg-cacao-200 hover:border-cacao-300 cursor-pointer shadow-sm'
                                        : 'bg-gray-50 text-gray-400 border-gray-100 cursor-default opacity-60'
                                        }`}
                                    title="Clear Selection"
                                >
                                    {selectedIds.size > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                                    <span className="hidden sm:inline">{selectedIds.size} {language === 'es' ? 'Seleccionadas' : 'Selected'}</span>
                                    <span className="sm:hidden">{selectedIds.size}</span>
                                </button>

                                {/* TDS Button */}
                                <button
                                    onClick={handleTDSClick}
                                    disabled={selectedIds.size === 0 || !hasTdsData}
                                    className={`font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors ${selectedIds.size > 0 && hasTdsData
                                        ? 'bg-orange-500 hover:bg-orange-600 text-white border-transparent'
                                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                        }`}
                                    title={hasTdsData ? "TDS Analysis" : "No TDS Data"}
                                >
                                    TDS
                                </button>

                                {/* PDF Button */}
                                <button
                                    onClick={handleBulkPdf}
                                    disabled={selectedIds.size === 0}
                                    className={`font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors ${selectedIds.size === 0
                                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                        : 'bg-amber-600 hover:bg-amber-700 text-white border border-transparent'
                                        }`}
                                    title={language === 'es' ? "Descargar PDF" : "Download PDF"}
                                >
                                    PDF
                                </button>
                            </div>

                            {/* Group 3: Primary Actions */}
                            <div className="flex items-center gap-2 ml-auto lg:ml-0">
                                <button
                                    onClick={handleCompare}
                                    disabled={selectedIds.size < 2}
                                    className={`font-bold py-2.5 px-5 rounded-xl shadow-md transition-colors ${selectedIds.size < 2
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-cacao-800 border-2 border-cacao-800 hover:bg-cacao-50'
                                        }`}
                                >
                                    {t.compare || "Compare"}
                                </button>

                                {/* New Evaluation - Compact Button */}
                                <button
                                    onClick={() => navigate('/evaluate')}
                                    className="bg-cacao-600 hover:bg-cacao-700 text-white font-bold p-2.5 rounded-xl shadow-md transition-colors flex items-center justify-center aspect-square"
                                    title={t.newEvaluation}
                                >
                                    <Plus size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Samples List */}
                {
                    loading ? (
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
                    )
                }
            </main >
            <Footer />
        </div >
    );
};

export default SamplesPage;
