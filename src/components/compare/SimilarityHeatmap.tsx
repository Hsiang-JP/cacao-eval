import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { useLanguage } from '../../context/LanguageContext';

interface SimilarityHeatmapProps {
    similarityMatrix: number[][];
    sampleCodes: string[];
}

export const SimilarityHeatmap: React.FC<SimilarityHeatmapProps> = ({ similarityMatrix, sampleCodes }) => {
    const { language } = useLanguage();

    // Format data for ApexCharts Heatmap - Upper triangle only
    // For upper triangle: only show values where colIndex > rowIndex
    // Diagonal and below diagonal are set to null (blank cells)

    const series = sampleCodes.map((rowCode, rowIndex) => {
        return {
            name: rowCode,
            data: sampleCodes.map((colCode, colIndex) => ({
                x: colCode,
                // Upper triangle: show value only if column > row
                // Null values will render as empty cells
                y: colIndex > rowIndex ? similarityMatrix[rowIndex][colIndex] : null
            }))
        };
    });

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'heatmap',
            toolbar: { show: false },
            fontFamily: "'Inter', sans-serif"
        },
        dataLabels: {
            enabled: true, // Show values for touch accessibility
            style: {
                fontSize: '11px',
                fontWeight: 600,
                colors: ['#374151']
            },
            formatter: (val) => {
                if (val === null || val === undefined) return '';
                return `${val}%`;
            }
        },
        colors: ['#A0522D'], // Cacao Brown base
        xaxis: {
            type: 'category',
            tooltip: { enabled: false },
            labels: {
                style: {
                    fontSize: '11px',
                    fontWeight: 600
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    fontSize: '11px',
                    fontWeight: 600
                }
            }
        },
        title: {
            text: language === 'es' ? 'Similitud de Muestras (%)' : 'Sample Similarity (%)',
            align: 'center',
            style: { color: '#4B5563', fontSize: '14px', fontWeight: 600 }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '11px',
            markers: { size: 10 }
        },
        tooltip: {
            enabled: true,
            y: {
                formatter: (val: number | null) => {
                    if (val === null || val === undefined) return '';
                    return `${val}% ${language === 'es' ? 'Coincidencia' : 'Match'}`;
                }
            }
        },
        plotOptions: {
            heatmap: {
                shadeIntensity: 0.5,
                radius: 4,
                useFillColorAsStroke: false,
                enableShades: true,
                colorScale: {
                    ranges: [
                        { from: -1, to: -1, color: '#FFFFFF', name: '' }, // Empty cells (null becomes -1 internally)
                        { from: 0, to: 50, color: '#FEE2E2', name: language === 'es' ? 'Bajo' : 'Low' },
                        { from: 51, to: 80, color: '#FFEDD5', name: language === 'es' ? 'Medio' : 'Medium' },
                        { from: 81, to: 99, color: '#BBF7D0', name: language === 'es' ? 'Alto' : 'High' },
                        { from: 100, to: 100, color: '#166534', name: language === 'es' ? 'Idéntico' : 'Identical' }
                    ]
                }
            }
        }
    };

    // Calculate dynamic height based on number of samples
    const calculatedHeight = Math.max(250, sampleCodes.length * 45 + 80);

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div id="chart">
                <ReactApexChart
                    options={options}
                    series={series}
                    type="heatmap"
                    height={calculatedHeight}
                />
            </div>
        </div>
    );
};
