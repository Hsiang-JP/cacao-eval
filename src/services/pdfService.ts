import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GradingSession, FlavorAttribute } from '../types';
import { Chart, registerables } from 'chart.js';
import { INITIAL_QUALITY_ATTRIBUTES } from '../constants';
import { getAttributeColor } from '../utils/colors';
import { formatDateForDisplay, getDateStringForFilename } from '../utils/dateUtils';

// Register Chart.js components for dynamic generation
Chart.register(...registerables);

// Helper to generate chart image programmatically
const generateChartImage = (attributes: FlavorAttribute[], language: 'en' | 'es'): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    // Fill white background for JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Order logic from FlavorRadar.tsx
    const order = [
      'cacao', 'acidity', 'bitterness', 'astringency', 'fresh_fruit', 'browned_fruit',
      'vegetal', 'floral', 'woody', 'spice', 'nutty', 'caramel', 'sweetness', 'defects', 'roast'
    ];

    const getLabel = (id: string, attr: FlavorAttribute | undefined) => {
      let text = '';
      if (language === 'es') {
        switch (id) {
          case 'roast': text = 'TOSTADO'; break;
          case 'acidity': text = 'ACIDEZ'; break;
          case 'fresh_fruit': text = 'FRUTA FRESCA'; break; // Simplified for single line
          case 'browned_fruit': text = 'FRUTA MARRÓN'; break;
          case 'vegetal': text = 'VEGETAL'; break;
          case 'floral': text = 'FLORAL'; break;
          case 'woody': text = 'MADERA'; break;
          case 'spice': text = 'ESPECIA'; break;
          case 'nutty': text = 'NUEZ'; break;
          case 'caramel': text = 'CARAMELO / PANELA'; break;
          case 'sweetness': text = 'DULZOR'; break;
          case 'defects': text = 'SABORES ATÍPICOS'; break;
          case 'cacao': text = 'CACAO'; break;
          case 'bitterness': text = 'AMARGOR'; break;
          case 'astringency': text = 'ASTRINGENCIA'; break;
          default: text = attr ? attr.nameEs : id;
        }
      } else {
        switch (id) {
          case 'roast': text = 'ROAST'; break;
          case 'acidity': text = 'ACIDITY'; break;
          case 'fresh_fruit': text = 'FRESH FRUIT'; break;
          case 'browned_fruit': text = 'BROWNED FRUIT'; break;
          case 'vegetal': text = 'VEGETAL'; break;
          case 'floral': text = 'FLORAL'; break;
          case 'woody': text = 'WOODY'; break;
          case 'spice': text = 'SPICE'; break;
          case 'nutty': text = 'NUTTY'; break;
          case 'caramel': text = 'CARAMEL / PANELA'; break;
          case 'sweetness': text = 'SWEETNESS'; break;
          case 'defects': text = 'OFF-FLAVOURS'; break;
          case 'cacao': text = 'CACAO'; break;
          case 'bitterness': text = 'BITTERNESS'; break;
          case 'astringency': text = 'ASTRINGENCIA'; break;
          default: text = attr ? attr.nameEn : id;
        }
      }
      return text;
    };

    const chartLabels = order.map(id => {
      const attr = attributes.find(a => a.id === id);
      return getLabel(id, attr);
    });

    const chartDataScores = order.map(id => {
      const attr = attributes.find(a => a.id === id);
      return attr ? attr.score : 0;
    });

    const chartColors = order.map(id => getAttributeColor(id));

    // Custom plugin to draw white background
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
      type: 'polarArea',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartDataScores,
          backgroundColor: chartColors,
          borderWidth: 2,
          borderColor: '#ffffff',
        }]
      },
      options: {
        responsive: false,
        animation: false,
        layout: { padding: 20 },
        scales: {
          r: {
            min: 0, max: 10,
            ticks: {
              stepSize: 2, z: 1, backdropColor: 'white', // Ensure tick background is white too
              color: '#8c5e4a', font: { size: 24 }
            },
            grid: { color: '#eaddd7', circular: true },
            angleLines: { display: true, color: '#eaddd7' },
            pointLabels: {
              display: true, centerPointLabels: true,
              font: { size: 20, family: 'sans-serif', weight: 'bold' },
              color: '#4a2e24', padding: 10
            }
          }
        },
        plugins: { legend: { display: false } }
      },
      plugins: [whiteBackgroundPlugin]
    });

    // Wait for chart to render then export
    setTimeout(() => {
      // Create a new canvas to composite the white background explicitly (double-check safety)
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
        // Fallback to original if context fails
        const image = canvas.toDataURL('image/jpeg', 0.9);
        chart.destroy();
        resolve(image);
      }
    }, 100);
  });
};

export const generatePdf = async (sessionsInput: GradingSession | GradingSession[], providedChartImage?: string, customFilename?: string) => {
  const sessions = Array.isArray(sessionsInput) ? sessionsInput : [sessionsInput];
  if (sessions.length === 0) return;

  const doc = new jsPDF();

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];

    if (i > 0) doc.addPage();

    const isEs = session.language === 'es';
    const t = (en: string, es: string) => (isEs ? es : en);

    // On-the-fly chart generation if not provided (or for bulk export where providedChartImage doesn't apply to all)
    // For single session export, providedChartImage works. For bulk, we regenerate.
    let chartImage = providedChartImage;
    if (!chartImage || sessions.length > 1) {
      chartImage = await generateChartImage(session.attributes, session.language as 'en' | 'es');
    }

    // Title
    doc.setFontSize(18);
    doc.setTextColor(74, 46, 36);
    doc.text(t("Cacao of Excellence - Sensory Evaluation", "Cacao de Excelencia - Evaluación Sensorial"), 14, 20);

    // Metadata Table
    const metaData = [
      [t("Evaluator", "Evaluador"), session.metadata.evaluator || '-'],
      [t("Sample Code", "Código de Muestra"), session.metadata.sampleCode || '-'],
      [t("Date", "Fecha"), formatDateForDisplay(session.metadata.date, session.language as 'en' | 'es') || '-'],
      [t("Time", "Hora"), session.metadata.time || '-'],
      [t("Type", "Tipo"), session.metadata.evaluationType === 'cacao_mass' ? t("Cacao Mass", "Masa de Cacao") : t("Chocolate", "Chocolate")],
      [t("Sample Info", "Info Muestra"), session.metadata.sampleInfo || '-']
    ];

    autoTable(doc, {
      startY: 30,
      // head: [[t("Field", "Campo"), t("Value", "Valor")]], 
      body: metaData,
      theme: 'striped',
      headStyles: { fillColor: [117, 74, 41] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
    });

    // Global Quality
    let currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(74, 46, 36);
    doc.setFont("helvetica", "bold");
    doc.text(`${t("Global Quality Score", "Calidad Global")}: ${session.globalQuality}/10`, 14, currentY);

    // Add Additional Positive Quality beneath Global Score
    currentY += 7;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    let qualityText = '-';
    if (session.selectedQualityId) {
      const qualityAttr = INITIAL_QUALITY_ATTRIBUTES.find(q => q.id === session.selectedQualityId);
      if (qualityAttr) {
        qualityText = isEs ? qualityAttr.nameEs : qualityAttr.nameEn;
      }
    }

    doc.text(`${t("Additional Positive Qualities", "Cualidades positivas adicionales")}: ${qualityText}`, 14, currentY);

    currentY += 10;

    // Flavor Graph (Chart)
    if (chartImage) {
      const pdfWidth = doc.internal.pageSize.getWidth();
      const imgWidth = 90; // mm
      const imgHeight = 90; // Aspect ratio is 1:1 for our config
      const x = (pdfWidth - imgWidth) / 2;

      if (currentY + imgHeight > 270) {
        doc.addPage();
        currentY = 20;
      }

      doc.addImage(chartImage, 'JPEG', x, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 10;
    }

    // Attributes Table
    const rows = session.attributes.map(attr => {
      const name = isEs ? attr.nameEs : attr.nameEn;
      const activeSubs = attr.subAttributes
        ?.filter(s => s.score > 0)
        .map(s => `${isEs ? s.nameEs : s.nameEn}: ${s.score}`)
        .join(', ');

      return [name, attr.score.toString(), activeSubs || ''];
    });

    autoTable(doc, {
      startY: currentY,
      head: [[
        t("Attribute", "Atributo"),
        { content: t("Score", "Puntaje"), styles: { halign: 'center' } },
        t("Descriptors", "Descriptores")
      ]],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [117, 74, 41] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { halign: 'center', cellWidth: 25 }
      },
      styles: { fontSize: 9 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Notes
    const addTextSection = (title: string, content: string) => {
      if (!content) return;
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(title, 14, currentY);
      currentY += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(content, 180);
      doc.text(splitText, 14, currentY);
      currentY += (splitText.length * 5) + 8;
    };

    addTextSection(t("Judge's Notes", "Notas del Juez"), session.metadata.notes);
    addTextSection(t("Producer Recommendations", "Recomendaciones al Productor"), session.metadata.producerRecommendations);

    // Sample counter footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`${t("Sample", "Muestra")} ${i + 1} / ${sessions.length}`, 14, 290, { align: 'left' });
  }

  // console.log('DEBUG generatePdf customFilename:', customFilename);
  let filename = customFilename;
  if (!filename) {
    const dateStr = getDateStringForFilename();
    filename = sessions.length === 1
      ? `CoEx_${sessions[0].metadata.sampleCode || 'Report'}.pdf`
      : `CoEx_Bulk_Report_${dateStr}.pdf`;
  }

  if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }

  doc.save(filename);
};
