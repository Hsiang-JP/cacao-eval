import React, { useState } from 'react';
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

export const ComparisonRadar: React.FC<ComparisonRadarProps> = ({ sessions }) => {
    const { language } = useLanguage();
    const [hoveredSession, setHoveredSession] = useState<StoredSample | null>(null);

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
            const isHovered = hoveredSession?.id === session.id;
            const isDimmed = hoveredSession && !isHovered;

            // Base opacity
            const bgAlpha = isDimmed ? 0.05 : (isHovered ? 0.4 : 0.2);
            const borderAlpha = isDimmed ? 0.2 : (isHovered ? 1 : 1);
            const borderWidth = isHovered ? 3 : (isDimmed ? 1 : 2);

            return {
                label: session.sampleCode,
                data: ATTRIBUTE_ORDER.map(attrId => {
                    const found = session.attributes.find(a => a.id === attrId);
                    return found ? found.score : 0;
                }),
                backgroundColor: color.bg.replace(/[\d.]+\)$/, `${bgAlpha})`),
                borderColor: color.border.replace(/[\d.]+\)$/, `${borderAlpha})`),
                borderWidth: borderWidth,
                pointBackgroundColor: color.border,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: color.border,
                tension: 0.1,
                order: isHovered ? 0 : 1
            };
        }),
    };

    const options = {
        scales: {
            r: {
                angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                pointLabels: {
                    font: { size: 10, family: "'Inter', sans-serif" }, // Smaller font for consistency with labels
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
            <div className="h-[400px] md:h-[450px] relative p-4">
                <Radar data={data} options={options} />
            </div>

            {/* Interactive Legend - Always show all info, no layout shifts */}
            <div className="bg-white border-t border-gray-100 p-4">
                <div className="flex flex-wrap gap-3 justify-center">
                    {sessions.map((session, index) => {
                        const color = COLORS[index % COLORS.length];
                        const isHovered = hoveredSession?.id === session.id;

                        return (
                            <div
                                key={session.id}
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all min-w-[120px] max-w-[150px] ${isHovered ? 'bg-gray-100 ring-2 ring-gray-300 shadow-sm' : 'hover:bg-gray-50'
                                    }`}
                                onMouseEnter={() => setHoveredSession(session)}
                                onMouseLeave={() => setHoveredSession(null)}
                                onClick={() => setHoveredSession(session === hoveredSession ? null : session)}
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
