import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import { ArrowLeft, Upload, RefreshCw, AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { parseSamplesFromCSV } from '../services/csvService';
import { analyzeTDS, CORE_ATTRIBUTES } from '../utils/tdsCalculator';
import { TDSAnalysisResult, TDSScoreResult } from '../types';

interface ComparisonData {
    attribute: string;
    normalScore: number;
    expertScore: number;
    normalBoost: number;
    expertBoost: number;
}

const TDSComparisonPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
    const [comparisonMeta, setComparisonMeta] = useState<{
        normalCode: string; normalMode: string;
        expertCode: string; expertMode: string;
    }>({ normalCode: '', normalMode: '', expertCode: '', expertMode: '' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [rawNormal, setRawNormal] = useState<TDSAnalysisResult | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [rawExpert, setRawExpert] = useState<TDSAnalysisResult | null>(null);

    const runComparison = async (csvText: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            if (result.errors.length > 0) {
                console.warn("CSV Parse errors", result.errors);
            }

            // Using 'en' to match standard headers
            const samples = parseSamplesFromCSV(result.data, 'en');

            // Find samples by code or mode
            const normalSample = samples.find(s => s.sampleCode === 'TDS_basic' || s.tdsProfile?.mode === 'normal');
            const expertSample = samples.find(s => s.sampleCode === 'TDS_expert' || s.tdsProfile?.mode === 'expert');

            if (!normalSample || !expertSample) {
                throw new Error("Could not find both 'TDS_basic' (Normal) and 'TDS_expert' (Expert) samples in the CSV.");
            }

            if (!normalSample.tdsProfile || !expertSample.tdsProfile) {
                throw new Error("Missing TDS Profile data in one or both samples.");
            }

            setComparisonMeta({
                normalCode: normalSample.sampleCode,
                normalMode: normalSample.tdsProfile.mode,
                expertCode: expertSample.sampleCode,
                expertMode: expertSample.tdsProfile.mode
            });

            const normalAnalysis = analyzeTDS(normalSample.tdsProfile);
            const expertAnalysis = analyzeTDS(expertSample.tdsProfile);

            setRawNormal(normalAnalysis);
            setRawExpert(expertAnalysis);

            const data: ComparisonData[] = CORE_ATTRIBUTES.map(attrId => {
                // In Normal mode, scores are simple. In Expert, they might be aggregated in coreScores or raw scores.
                // analyzeTDS ensures both maps are populated.
                // In Expert mode, we MUST use coreScores to get the aggregated value (e.g., Cacao + Nutty).
                // scores.get('cacao') returns only the specific 'cacao' event score, which is incorrect for the Core Report.
                const normalRes = normalAnalysis.coreScores.get(attrId) || normalAnalysis.scores.get(attrId);
                const expertRes = expertAnalysis.coreScores.get(attrId) || expertAnalysis.scores.get(attrId);

                return {
                    attribute: attrId,
                    normalScore: normalRes?.score || 0,
                    expertScore: expertRes?.score || 0,
                    normalBoost: normalRes?.boostDetails?.amount || 0,
                    expertBoost: expertRes?.boostDetails?.amount || 0
                };
            });

            setComparisonData(data);
        } catch (err: any) {
            setError(err.message || "An error occurred during comparison.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch('/mode_comparison.csv')
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch default CSV");
                return res.text();
            })
            .then(text => runComparison(text))
            .catch(err => setError("Failed to load default CSV: " + err.message));
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            if (evt.target?.result) {
                runComparison(evt.target.result as string);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen bg-stone-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 rounded-full hover:bg-stone-200 transition-colors">
                            <ArrowLeft className="w-6 h-6 text-stone-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-800">TDS Mode Comparison</h1>
                            <p className="text-stone-500">Normal vs Expert Mode Algorithm Analysis</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg cursor-pointer transition-colors text-stone-700 font-medium text-sm">
                            <Upload size={18} />
                            Upload CSV
                            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </label>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2 bg-stone-200 hover:bg-stone-300 rounded-lg text-stone-700 transition-colors"
                            title="Reload"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-stone-300 border-t-stone-600"></div>
                        <p className="mt-2 text-stone-500">Analyzing TDS Profiles...</p>
                    </div>
                )}

                {!loading && comparisonData.length > 0 && (
                    <>
                        {/* Comparison Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden mb-8">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-stone-100 text-stone-600 font-semibold uppercase tracking-wider">
                                        <tr className="border-b border-stone-200">
                                            <th className="px-6 py-4">Core Attribute</th>
                                            <th className="px-6 py-4 text-center bg-blue-50">
                                                Normal Mode Score
                                                <div className="text-xs text-blue-400 font-normal mt-1">
                                                    {comparisonMeta.normalCode} ({comparisonMeta.normalMode})
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center bg-purple-50">
                                                Expert Mode Score
                                                <div className="text-xs text-purple-400 font-normal mt-1">
                                                    {comparisonMeta.expertCode} ({comparisonMeta.expertMode})
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center">Difference</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {comparisonData.map((row) => {
                                            const diff = row.normalScore - row.expertScore;
                                            const isSignificant = Math.abs(diff) >= 2;
                                            return (
                                                <tr key={row.attribute} className="hover:bg-stone-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-stone-800 capitalize">{row.attribute}</td>
                                                    <td className="px-6 py-4 text-center bg-blue-50/30">
                                                        <span className="font-bold text-lg">{row.normalScore}</span>
                                                        {row.normalBoost > 0 && <span className="ml-2 text-xs text-indigo-600 font-bold">(+{row.normalBoost} rec)</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center bg-purple-50/30">
                                                        <span className="font-bold text-lg">{row.expertScore}</span>
                                                        {row.expertBoost > 0 && <span className="ml-2 text-xs text-indigo-600 font-bold">(+{row.expertBoost} rec)</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded font-bold ${diff > 0 ? 'bg-green-100 text-green-700' : diff < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {diff > 0 ? '+' : ''}{diff}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {isSignificant ? (
                                                            <span className="flex items-center justify-center gap-1 text-amber-600 font-medium">
                                                                <AlertTriangle size={16} /> Deviation
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center justify-center gap-1 text-green-600 font-medium">
                                                                <CheckCircle size={16} /> Aligned
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>



                        {/* Insights & Recommendations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <Info className="w-5 h-5" />
                                    Insights
                                </h3>
                                <ul className="space-y-3 text-blue-800 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold">•</span>
                                        <span>
                                            <strong>No Normalization Summation:</strong> Expert mode now calculates Core Scores based <em>only</em> on the Core attribute's own duration (matching Normal mode).
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold">•</span>
                                        <span>
                                            <strong>Recommendation Boosts:</strong> Instead of hiding child attributes in the score, significant child attribute presence (e.g., Berry, Citrus) triggers a <strong>Recommendation Boost (+1 or +2)</strong> visible as separate guidance.
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5" />
                                    Tweaking Recommendations
                                </h3>
                                <div className="space-y-4 text-indigo-900 text-sm">
                                    <p>
                                        If <strong>Normal Mode Scores</strong> are consistently lower:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Consider <strong>lowering the dominance threshold</strong> for Normal Mode score mapping.</li>
                                        <li>Apply a <strong>multiplier (e.g., 1.2x)</strong> to durations in Normal Mode to account for slower reaction/decision times when selecting broad categories.</li>
                                    </ul>
                                    <div className="mt-4 p-3 bg-white rounded border border-indigo-200 text-xs">
                                        <strong>Proposed Experiment:</strong> If deviations {'>'} 2 points persist, modify <code>tdsCalculator.ts</code> to reduce the sensitivity curve strictness specifically for <code>mode === 'normal'</code>.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div >
        </div >
    );
};

export default TDSComparisonPage;
