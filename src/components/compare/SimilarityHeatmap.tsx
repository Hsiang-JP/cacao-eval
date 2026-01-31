import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useLanguage } from '../../context/LanguageContext';

interface SimilarityHeatmapProps {
    similarityMatrix: number[][];
    sampleCodes: string[];
    sampleIds: string[];
    onCellClick?: (id1: string, id2: string) => void;
}

export const SimilarityHeatmap: React.FC<SimilarityHeatmapProps> = ({ similarityMatrix, sampleCodes, sampleIds, onCellClick }) => {
    const { language } = useLanguage();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Truncate sample codes for mobile
    const truncateCode = (code: string, maxLen: number) =>
        code.length > maxLen ? code.slice(0, maxLen) + '…' : code;

    const displayCodes = isMobile
        ? sampleCodes.map(c => truncateCode(c, 6))
        : sampleCodes;

    // Format data for ApexCharts Heatmap - Full symmetric matrix
    const series = displayCodes.map((rowCode, rowIndex) => {
        return {
            name: rowCode,
            data: displayCodes.map((colCode, colIndex) => ({
                x: colCode,
                y: similarityMatrix[rowIndex][colIndex]
            }))
        };
    });

    // Responsive settings
    const fontSize = isMobile ? '9px' : '11px';
    const labelFontSize = isMobile ? '8px' : '11px';
    const cellRadius = isMobile ? 2 : 4;

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'heatmap',
            toolbar: { show: false },
            fontFamily: "'Inter', sans-serif",
            events: {
                click: function (event, chartContext, config) {
                    if (config.dataPointIndex !== undefined && config.seriesIndex !== undefined && onCellClick) {
                        const rowIndex = config.seriesIndex;
                        const colIndex = config.dataPointIndex;
                        if (rowIndex >= 0 && colIndex >= 0) {
                            const id1 = sampleIds[rowIndex];
                            const id2 = sampleIds[colIndex];
                            onCellClick(id1, id2);
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: false // Hide data labels - use tooltips instead
        },
        colors: ['#A0522D'],
        xaxis: {
            type: 'category',
            tooltip: { enabled: false },
            labels: {
                style: {
                    fontSize: labelFontSize,
                    fontWeight: 600
                },
                rotate: isMobile ? -45 : 0,
                rotateAlways: isMobile
            }
        },
        yaxis: {
            // Note: type 'category' is not valid for yaxis in ApexCharts typings
            // tickAmount forces all labels to show if they are being skipped
            tickAmount: displayCodes.length,
            labels: {
                style: {
                    fontSize: labelFontSize,
                    fontWeight: 600
                },
                maxWidth: isMobile ? 50 : 120
            }
        },
        title: {
            text: language === 'es' ? 'Similitud de Muestras (%)' : 'Sample Similarity (%)',
            align: 'center',
            style: { color: '#4B5563', fontSize: isMobile ? '12px' : '14px', fontWeight: 600 }
        },
        legend: {
            show: false, // Hide ApexCharts legend - we use custom legend
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '11px',
            markers: { size: 10 }
        },
        tooltip: {
            enabled: true,
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                const val = series[seriesIndex][dataPointIndex];
                if (val === null || val === undefined) return '';
                const rowCode = sampleCodes[seriesIndex];
                const colCode = sampleCodes[dataPointIndex];
                return `<div class="px-2 py-1 text-sm bg-white border rounded shadow">
                    <strong>${rowCode}</strong> vs <strong>${colCode}</strong><br/>
                    ${val}% ${language === 'es' ? 'Coincidencia' : 'Match'}
                </div>`;
            }
        },
        plotOptions: {
            heatmap: {
                shadeIntensity: 0.5,
                radius: cellRadius,
                useFillColorAsStroke: false,
                enableShades: true,
                colorScale: {
                    ranges: [
                        { from: 0, to: 49, color: '#EEEEEE', name: language === 'es' ? 'Diferente' : 'Different' },
                        { from: 50, to: 84, color: '#66A3FF', name: language === 'es' ? 'Similar' : 'Similar' },
                        { from: 85, to: 100, color: '#0055FF', name: language === 'es' ? 'Idéntico' : 'Identical' }
                    ]
                }
            }
        }
    };

    // Dynamic sizing
    const cellSize = isMobile ? 30 : 45;
    const calculatedHeight = Math.max(200, sampleCodes.length * cellSize + 80);
    const minWidth = sampleCodes.length * cellSize + 80;

    return (
        <div className="bg-white p-2 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
            {/* Mobile hint */}
            {isMobile && (
                <p className="text-xs text-gray-400 text-center mb-2">
                    {language === 'es' ? 'Toca una celda para ver detalles' : 'Tap a cell to see details'}
                </p>
            )}
            {/* Horizontal scroll wrapper for mobile */}
            <div className="overflow-x-auto">
                <div style={{ minWidth: isMobile ? `${minWidth}px` : 'auto' }}>
                    <ReactApexChart
                        options={options}
                        series={series}
                        type="heatmap"
                        height={calculatedHeight}
                    />
                </div>
            </div>
            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#EEEEEE', border: '1px solid #ddd' }}></span> {language === 'es' ? 'Diferente (<50%)' : 'Different (<50%)'}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#66A3FF' }}></span> {language === 'es' ? 'Similar (50-84%)' : 'Similar (50-84%)'}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#0055FF' }}></span> {language === 'es' ? 'Idéntico (85-100%)' : 'Identical (85-100%)'}</span>
            </div>
        </div>
    );
};
