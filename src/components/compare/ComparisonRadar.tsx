import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { StoredSample } from '../../services/dbService';
import { useLanguage } from '../../context/LanguageContext';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface ComparisonRadarProps {
    sessions: StoredSample[];
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
}

const ATTRIBUTE_ORDER = [
    'cacao',
    'acidity',
    'bitterness',
    'astringency',
    'fresh_fruit',
    'browned_fruit',
    'vegetal',
    'floral',
    'woody',
    'spice',
    'nutty',
    'caramel',
    'sweetness',
    'defects',
    'roast'
];

const COLORS = [
    { border: 'rgba(255, 99, 132, 1)', bg: 'rgba(255, 99, 132, 0.2)' },
    { border: 'rgba(54, 162, 235, 1)', bg: 'rgba(54, 162, 235, 0.2)' },
    { border: 'rgba(255, 206, 86, 1)', bg: 'rgba(255, 206, 86, 0.2)' },
    { border: 'rgba(75, 192, 192, 1)', bg: 'rgba(75, 192, 192, 0.2)' },
    { border: 'rgba(153, 102, 255, 1)', bg: 'rgba(153, 102, 255, 0.2)' },
    { border: 'rgba(255, 159, 64, 1)', bg: 'rgba(255, 159, 64, 0.2)' },
    { border: 'rgba(199, 199, 199, 1)', bg: 'rgba(199, 199, 199, 0.2)' },
    { border: 'rgba(83, 102, 255, 1)', bg: 'rgba(83, 102, 255, 0.2)' },
    { border: 'rgba(40, 159, 64, 1)', bg: 'rgba(40, 159, 64, 0.2)' },
    { border: 'rgba(210, 99, 132, 1)', bg: 'rgba(210, 99, 132, 0.2)' }
];

export const ComparisonRadar: React.FC<ComparisonRadarProps> = ({ sessions, selectedIds = [], onSelectionChange }) => {
    const { language } = useLanguage();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleSession = (id: string) => {
        if (!onSelectionChange) return;
        const newSelection = selectedIds.includes(id)
            ? selectedIds.filter(sId => sId !== id)
            : [...selectedIds, id];
        onSelectionChange(newSelection);
    };

    const clearSelection = () => {
        if (onSelectionChange) onSelectionChange([]);
    };

    const getLabel = (id: string) => {
        let text = '';
        if (language === 'es') {
            switch (id) {
                case 'roast': text = 'TOSTADO'; break;
                case 'acidity': text = 'ACIDEZ'; break;
                case 'fresh_fruit': text = 'FRUTA\nFRESCA'; break;
                case 'browned_fruit': text = 'FRUTA\nMARRÓN'; break;
                case 'vegetal': text = 'VEGETAL'; break;
                case 'floral': text = 'FLORAL'; break;
                case 'woody': text = 'MADERA'; break;
                case 'spice': text = 'ESPECIA'; break;
                case 'nutty': text = 'NUEZ'; break;
                case 'caramel': text = 'CARAMELO'; break;
                case 'sweetness': text = 'DULZOR'; break;
                case 'defects': text = 'DEFECTOS'; break;
                case 'cacao': text = 'CACAO'; break;
                case 'bitterness': text = 'AMARGOR'; break;
                case 'astringency': text = 'ASTRINGENCIA'; break;
                default: text = id;
            }
        } else {
            switch (id) {
                case 'roast': text = 'ROAST'; break;
                case 'acidity': text = 'ACIDITY'; break;
                case 'fresh_fruit': text = 'FRESH\nFRUIT'; break;
                case 'browned_fruit': text = 'BROWNED\nFRUIT'; break;
                case 'vegetal': text = 'VEGETAL'; break;
                case 'floral': text = 'FLORAL'; break;
                case 'woody': text = 'WOODY'; break;
                case 'spice': text = 'SPICE'; break;
                case 'nutty': text = 'NUTTY'; break;
                case 'caramel': text = 'CARAMEL'; break;
                case 'sweetness': text = 'SWEETNESS'; break;
                case 'defects': text = 'DEFECTS'; break;
                case 'cacao': text = 'CACAO'; break;
                case 'bitterness': text = 'BITTERNESS'; break;
                case 'astringency': text = 'ASTRINGENCY'; break;
                default: text = id;
            }
        }
        return text.split('\n');
    };

    const data = {
        labels: ATTRIBUTE_ORDER.map(id => getLabel(id)),
        datasets: sessions.map((session, index) => {
            const color = COLORS[index % COLORS.length];
            const isSelected = selectedIds.includes(session.id);
            const hasSelection = selectedIds.length > 0;
            const isDimmed = hasSelection && !isSelected;

            // Base opacity
            const bgAlpha = isDimmed ? 0.05 : (isSelected ? 0.4 : 0.2);
            const borderAlpha = isDimmed ? 0.1 : (isSelected ? 0.7 : 0.6);
            const borderWidth = isSelected ? 3 : (isDimmed ? 1 : 2);

            return {
                label: session.sampleCode,
                data: ATTRIBUTE_ORDER.map(attrId => {
                    const found = session.attributes.find(a => a.id === attrId);
                    return found ? found.score : 0;
                }),
                backgroundColor: color.bg.replace(/[\d.]+\)$/, `${bgAlpha})`),
                borderColor: color.border.replace(/[\d.]+\)$/, `${borderAlpha})`),
                borderWidth: isMobile ? (borderWidth * 0.7) : borderWidth,
                pointRadius: 0,  // Hide data points
                pointHoverRadius: 4,  // Show on hover only
                pointBackgroundColor: color.border,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: color.border,
                tension: 0.1,
                order: isSelected ? 0 : 1
            };
        }),
    };

    const options = {
        scales: {
            r: {
                angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                pointLabels: {
                    font: {
                        size: isMobile ? 8 : 10,
                        family: "'Inter', sans-serif"
                    },
                    color: '#4B5563',
                    // Allow multi-line labels
                    callback: (label: string | string[]) => label
                },
                ticks: {
                    display: true, // Show the numbers
                    stepSize: 2,
                    max: 10,
                    min: 0,
                    z: 1,
                    color: '#9CA3AF', // Gray-400
                    backdropColor: 'transparent',
                    font: {
                        size: 9
                    }
                },
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1F2937',
                bodyColor: '#4B5563',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 10,
                boxPadding: 4,
                usePointStyle: true,
                callbacks: {
                    label: function (context: any) {
                        return `${context.dataset.label}: ${context.raw}`;
                    },
                    title: function (context: any) {
                        const label = context[0].label;
                        return Array.isArray(label) ? label.join(' ') : label;
                    }
                }
            }
        },
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'r' as const,
            intersect: false
        }
    };

    return (
        <div className="flex flex-col">
            {/* Chart Area - Fixed height */}
            <div className={`relative ${isMobile ? 'h-[250px] p-0' : 'h-[400px] md:h-[450px] p-4'}`}>
                <Radar data={data} options={options} />
                <button
                    onClick={clearSelection}
                    disabled={selectedIds.length === 0}
                    className={`absolute bottom-1 right-0 z-10 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${selectedIds.length > 0
                        ? 'bg-white text-blue-600 border-blue-200 shadow-sm hover:bg-blue-50 cursor-pointer'
                        : 'bg-transparent text-gray-300 border-transparent cursor-default'
                        }`}
                >
                    {language === 'es'
                        ? (isMobile ? 'Limpiar' : 'Limpiar Selección')
                        : (isMobile ? 'Clear' : 'Clear Selection')}
                </button>
            </div>

            {/* Interactive Legend - Always show all info, no layout shifts */}
            <div className="bg-white border-t border-gray-100 p-4">

                <div className="flex flex-wrap gap-3 justify-center">
                    {sessions.map((session, index) => {
                        const color = COLORS[index % COLORS.length];
                        const isSelected = selectedIds.includes(session.id);

                        return (
                            <div
                                key={session.id}
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all min-w-[120px] max-w-[150px] ${isSelected ? 'bg-gray-100 ring-2 ring-gray-300 shadow-sm' : 'hover:bg-gray-50'
                                    }`}
                                onClick={() => toggleSession(session.id)}
                            >
                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color.border }}></span>
                                <div className="flex flex-col overflow-hidden min-w-0">
                                    <span className="text-xs font-bold text-gray-700 truncate">{session.sampleCode}</span>
                                    <span className="text-[10px] text-gray-500">Q: {session.globalQuality}</span>
                                    <span className="text-[10px] text-gray-400 truncate">{session.evaluator}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
