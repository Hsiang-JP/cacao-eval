import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { StoredSample } from '../../services/dbService';
import { getAttributeColor } from '../../utils/colors';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface IndividualBarChartProps {
    sample: StoredSample;
    language: 'en' | 'es';
    orientation?: 'horizontal' | 'vertical';
    height?: number;
}

const IndividualBarChart: React.FC<IndividualBarChartProps> = ({ sample, language, orientation = 'horizontal', height }) => {
    // Attributes to display (excluding calculated parents if desired, or showing all)
    // For bar chart, usually showing the main categories + specific defects is good.
    // The user requested showing ALL 15 attributes.

    // Colors now imported from utils/colors.ts

    const attributes = sample.attributes.filter(a => a.score > 0 || true); // Show all

    const data = {
        labels: attributes.map(a => language === 'es' ? a.nameEs : a.nameEn),
        datasets: [
            {
                label: 'Score',
                data: attributes.map(a => a.score),
                backgroundColor: attributes.map(a => getAttributeColor(a.id)),
                borderColor: attributes.map(a => getAttributeColor(a.id)),
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 12, // Slim bars
            },
        ],
    };

    const options = {
        indexAxis: orientation === 'horizontal' ? 'y' as const : 'x' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => `Score: ${context.raw}`
                }
            }
        },
        scales: orientation === 'horizontal' ? {
            x: {
                min: 0,
                max: 10,
                grid: {
                    display: true,
                    color: '#f0f0f0'
                }
            },
            y: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 11
                    },
                    autoSkip: false
                }
            }
        } : {
            y: { // Vertical mode: Y is value axis
                min: 0,
                max: 10,
                grid: {
                    display: true,
                    color: '#f0f0f0'
                }
            },
            x: { // Vertical mode: X is category axis
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 9 // Smaller for vertical fit
                    },
                    autoSkip: false,
                    maxRotation: 90,
                    minRotation: 45
                }
            }
        },
        layout: {
            padding: {
                top: 10,
                bottom: 0,
                left: 0,
                right: 0
            }
        }
    };

    // Calculate height based on number of attributes or prop
    const chartHeight = height || (orientation === 'horizontal' ? Math.max(300, attributes.length * 25) : 300);

    return (
        <div style={{ height: `${chartHeight}px`, width: '100%' }}>
            <Bar data={data} options={options} />
        </div>
    );
};

export default IndividualBarChart;
