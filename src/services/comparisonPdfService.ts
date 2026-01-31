/**
 * Comparison PDF Export Service
 * Generates comparison reports with radar charts and cluster analysis
 */

import jsPDF from 'jspdf';
import { Chart, registerables } from 'chart.js';
import { FlavorAttribute } from '../types';
import { formatDateForDisplay, getDateStringForFilename } from '../utils/dateUtils';

// Register Chart.js components
Chart.register(...registerables);

// Colors for comparison radar (match ComparisonRadar.tsx COLORS array)
const COMPARISON_COLORS = [
    { border: '#E74A89', background: 'rgba(231, 74, 137, 0.2)' }, // Pink
    { border: '#3B82F6', background: 'rgba(59, 130, 246, 0.2)' }, // Blue
    { border: '#F5A524', background: 'rgba(245, 165, 36, 0.2)' },  // Orange
    { border: '#10B981', background: 'rgba(16, 185, 129, 0.2)' }, // Green
    { border: '#8B5CF6', background: 'rgba(139, 92, 246, 0.2)' }, // Purple
    { border: '#EF4444', background: 'rgba(239, 68, 68, 0.2)' },  // Red
    { border: '#06B6D4', background: 'rgba(6, 182, 212, 0.2)' },  // Cyan
    { border: '#F97316', background: 'rgba(249, 115, 22, 0.2)' }, // Amber
    { border: '#84CC16', background: 'rgba(132, 204, 22, 0.2)' }, // Lime
    { border: '#EC4899', background: 'rgba(236, 72, 153, 0.2)' }, // Fuchsia
];

export interface ComparisonSample {
    id: string;
    sampleCode: string;
    evaluator: string;
    globalQuality: number;
    attributes: FlavorAttribute[];
}

export interface ComparisonCluster {
    id: number;
    name: string;
    sampleCodes: string[];
    avgQuality: number;
    dominantTraits: string[];
}

// Generate comparison radar chart image with multiple datasets
const generateComparisonChartImage = (samples: ComparisonSample[], language: 'en' | 'es'): Promise<string> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            resolve('');
            return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const order = [
            'cacao', 'acidity', 'bitterness', 'astringency', 'fresh_fruit', 'browned_fruit',
            'vegetal', 'floral', 'woody', 'spice', 'nutty', 'caramel', 'sweetness', 'defects', 'roast'
        ];

        const getLabel = (id: string) => {
            if (language === 'es') {
                switch (id) {
                    case 'roast': return 'TOSTADO';
                    case 'acidity': return 'ACIDEZ';
                    case 'fresh_fruit': return 'FRUTA FRESCA';
                    case 'browned_fruit': return 'FRUTA MARRÓN';
                    case 'vegetal': return 'VEGETAL';
                    case 'floral': return 'FLORAL';
                    case 'woody': return 'MADERA';
                    case 'spice': return 'ESPECIA';
                    case 'nutty': return 'NUEZ';
                    case 'caramel': return 'CARAMELO';
                    case 'sweetness': return 'DULZOR';
                    case 'defects': return 'DEFECTOS';
                    case 'cacao': return 'CACAO';
                    case 'bitterness': return 'AMARGOR';
                    case 'astringency': return 'ASTRINGENCIA';
                    default: return id;
                }
            } else {
                switch (id) {
                    case 'roast': return 'ROAST';
                    case 'acidity': return 'ACIDITY';
                    case 'fresh_fruit': return 'FRESH FRUIT';
                    case 'browned_fruit': return 'BROWNED FRUIT';
                    case 'vegetal': return 'VEGETAL';
                    case 'floral': return 'FLORAL';
                    case 'woody': return 'WOODY';
                    case 'spice': return 'SPICE';
                    case 'nutty': return 'NUTTY';
                    case 'caramel': return 'CARAMEL';
                    case 'sweetness': return 'SWEETNESS';
                    case 'defects': return 'DEFECTS';
                    case 'cacao': return 'CACAO';
                    case 'bitterness': return 'BITTERNESS';
                    case 'astringency': return 'ASTRINGENCY';
                    default: return id;
                }
            }
        };

        const chartLabels = order.map(getLabel);

        // Build datasets for each sample
        const datasets = samples.map((sample, idx) => {
            const color = COMPARISON_COLORS[idx % COMPARISON_COLORS.length];
            const data = order.map(id => {
                const attr = sample.attributes.find(a => a.id === id);
                return attr ? attr.score : 0;
            });

            return {
                label: sample.sampleCode,
                data,
                backgroundColor: color.background,
                borderColor: color.border,
                borderWidth: 2,
                pointBackgroundColor: color.border,
                pointRadius: 3,
                fill: true
            };
        });

        const whiteBackgroundPlugin = {
            id: 'custom_white_bg',
            beforeDraw: (chart: any) => {
                const { ctx, width, height } = chart;
                ctx.save();
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }
        };

        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: chartLabels,
                datasets
            },
            options: {
                responsive: false,
                animation: false,
                layout: { padding: 20 },
                scales: {
                    r: {
                        min: 0, max: 10,
                        ticks: {
                            stepSize: 2,
                            backdropColor: 'white',
                            color: '#8c5e4a',
                            font: { size: 16 }
                        },
                        grid: { color: '#eaddd7' },
                        angleLines: { color: '#eaddd7' },
                        pointLabels: {
                            font: { size: 14, weight: 'bold' },
                            color: '#4a2e24'
                        }
                    }
                },
                plugins: { legend: { display: false } }
            },
            plugins: [whiteBackgroundPlugin]
        });

        setTimeout(() => {
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvas.width;
            finalCanvas.height = canvas.height;
            const finalCtx = finalCanvas.getContext('2d');

            if (finalCtx) {
                finalCtx.fillStyle = '#FFFFFF';
                finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
                finalCtx.drawImage(canvas, 0, 0);
                const image = finalCanvas.toDataURL('image/jpeg', 0.9);
                chart.destroy();
                resolve(image);
            } else {
                const image = canvas.toDataURL('image/jpeg', 0.9);
                chart.destroy();
                resolve(image);
            }
        }, 100);
    });
};

export const generateComparisonPdf = async (
    samples: ComparisonSample[],
    clusters: ComparisonCluster[],
    language: 'en' | 'es'
) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const t = (en: string, es: string) => language === 'es' ? es : en;
    let currentY = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 14;
    const marginRight = 14;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 46, 36); // cacao-900
    doc.text(t('Comparison Report', 'Informe de Comparación'), marginLeft, currentY);
    currentY += 8;

    // Date and sample count
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${formatDateForDisplay(new Date().toISOString(), language)} | ${samples.length} ${t('samples', 'muestras')}`, marginLeft, currentY);
    currentY += 10;

    // Generate and add the radar chart
    const chartImage = await generateComparisonChartImage(samples, language);
    if (chartImage) {
        const chartSize = 100; // 100mm square for the chart
        const chartX = (pageWidth - chartSize) / 2;
        doc.addImage(chartImage, 'JPEG', chartX, currentY, chartSize, chartSize);
        currentY += chartSize + 5;
    }

    // Legend for samples
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(t('Samples Legend', 'Leyenda de Muestras'), marginLeft, currentY);
    currentY += 5;

    // Draw sample legend (compact grid)
    const legendCols = 5;
    const colWidth = contentWidth / legendCols;
    samples.forEach((sample, idx) => {
        const color = COMPARISON_COLORS[idx % COMPARISON_COLORS.length];
        const col = idx % legendCols;
        const row = Math.floor(idx / legendCols);
        const x = marginLeft + col * colWidth;
        const y = currentY + row * 8;

        // Color circle
        doc.setFillColor(parseInt(color.border.slice(1, 3), 16),
            parseInt(color.border.slice(3, 5), 16),
            parseInt(color.border.slice(5, 7), 16));
        doc.circle(x + 2, y + 2, 2, 'F');

        // Sample code, Q score, and evaluator
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        // Truncate evaluator if needed
        const evaluatorShort = sample.evaluator.length > 8 ? sample.evaluator.slice(0, 8) + '...' : sample.evaluator;
        doc.text(`${sample.sampleCode} (Q:${sample.globalQuality})`, x + 6, y + 2);
        doc.setFontSize(6);
        doc.setTextColor(120, 120, 120);
        doc.text(evaluatorShort, x + 6, y + 5.5);
    });

    const legendRows = Math.ceil(samples.length / legendCols);
    currentY += legendRows * 10 + 5;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
    currentY += 8;

    // Clusters Section
    if (clusters.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(74, 46, 36);
        doc.text(t('Identified Groups', 'Grupos Identificados'), marginLeft, currentY);
        currentY += 8;

        clusters.forEach((cluster) => {
            // Check if we need a new page
            if (currentY > 260) {
                doc.addPage();
                currentY = 15;
            }

            // Cluster header
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(74, 46, 36);
            doc.text(`#${cluster.id} ${cluster.name}`, marginLeft, currentY);

            // Avg Quality badge
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Q: ${cluster.avgQuality}`, pageWidth - marginRight - 15, currentY);
            currentY += 5;

            // Dominant traits
            if (cluster.dominantTraits.length > 0) {
                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.text(`${t('Characterized by', 'Caracterizado por')}: ${cluster.dominantTraits.join(', ')}`, marginLeft, currentY);
                currentY += 6;
            }

            // Sample codes with color circles
            const samplesPerRow = 6;
            const sampleColWidth = contentWidth / samplesPerRow;
            cluster.sampleCodes.forEach((code, sampleIdx) => {
                // Find the sample index in the main samples array to get the correct color
                const fullSampleIndex = samples.findIndex(s => s.sampleCode === code);
                const color = COMPARISON_COLORS[(fullSampleIndex >= 0 ? fullSampleIndex : sampleIdx) % COMPARISON_COLORS.length];

                const col = sampleIdx % samplesPerRow;
                const row = Math.floor(sampleIdx / samplesPerRow);
                const x = marginLeft + col * sampleColWidth;
                const y = currentY + row * 6;

                // Color circle
                doc.setFillColor(
                    parseInt(color.border.slice(1, 3), 16),
                    parseInt(color.border.slice(3, 5), 16),
                    parseInt(color.border.slice(5, 7), 16)
                );
                doc.circle(x + 1.5, y + 1, 1.5, 'F');

                // Sample code
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);
                doc.text(code, x + 5, y + 2);
            });

            const clusterRows = Math.ceil(cluster.sampleCodes.length / samplesPerRow);
            currentY += clusterRows * 6 + 6;
        });
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(t('Generated by COEX Cacao Evaluation App', 'Generado por COEX Evaluación de Cacao'), marginLeft, footerY);

    // Save
    const filename = `Comparison_Report_${getDateStringForFilename()}.pdf`;
    doc.save(filename);
};
