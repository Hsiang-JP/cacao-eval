import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GradingSession, FlavorAttribute } from '../types';
import { ATTRIBUTE_LABELS } from '../data/attributes';
import { currentConfig } from '../constants';
import { Chart, registerables } from 'chart.js';
import { getAttributeColor } from '../utils/colors';
import { analyzeTDS } from '../utils/tdsCalculator';
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
    const order = currentConfig.meta.radarAttributeIds || currentConfig.attributes.map(a => a.id);

    const getLabel = (id: string, attr: FlavorAttribute | undefined) => {
      // 1. Try generic attribute labels (covers core, specific attributes)
      if (ATTRIBUTE_LABELS[id]) {
        return language === 'es' ? ATTRIBUTE_LABELS[id].es.toUpperCase() : ATTRIBUTE_LABELS[id].en.toUpperCase();
      }

      // 2. Fallback to attribute instance name (custom attributes)
      if (attr) {
        return language === 'es' ? attr.nameEs.toUpperCase() : attr.nameEn.toUpperCase();
      }

      // 3. Fallback to ID
      return id.toUpperCase();
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
      beforeDraw: (chart: Chart) => {
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
        layout: { padding: 5 },
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
      const qualityAttr = currentConfig.qualityAttributes.find(q => q.id === session.selectedQualityId);
      if (qualityAttr) {
        qualityText = isEs ? qualityAttr.nameEs : qualityAttr.nameEn;
      }
    }

    doc.text(`${t("Additional Positive Qualities", "Cualidades positivas adicionales")}: ${qualityText}`, 14, currentY);

    currentY += 10;

    // Flavor Graph (Chart)
    if (chartImage) {
      const pdfWidth = doc.internal.pageSize.getWidth();
      const imgWidth = 140; // mm
      const imgHeight = 140; // Aspect ratio is 1:1 for our config
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

    // TDS Analysis Section
    if (session.tdsProfile && session.tdsProfile.events?.length > 0) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      currentY += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(74, 46, 36);
      doc.text(t("TDS Analysis", "Análisis TDS"), 14, currentY);
      currentY += 8;

      const tds = session.tdsProfile;

      // Calculate Analysis or use persisted
      let analysis = session.tdsProfile.analysis;
      if (!analysis) {
        try {
          analysis = analyzeTDS(tds);
        } catch (e) {
          console.error("TDS Analysis failed for PDF", e);
        }
      }

      // 1. Stats Row 1: Duration, Swallow (actual), Mode
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      const durationLabel = t("Total Duration", "Duración Total");
      const swallowLabel = t("Swallow", "Tragado");
      const modeLabel = t("Mode", "Modo");

      const modeText = tds.mode === 'expert' ? (isEs ? 'Experto' : 'Expert') : (isEs ? 'Normal' : 'Normal');
      // Use actual swallow time (not adjusted)
      const actualSwallow = tds.swallowTime;

      doc.text(`${durationLabel}: ${tds.totalDuration.toFixed(1)}s`, 14, currentY);
      doc.text(`${swallowLabel}: ${actualSwallow.toFixed(1)}s`, 80, currentY);
      doc.text(`${modeLabel}: ${modeText}`, 150, currentY);

      currentY += 6;

      // Stats Row 2: First Flavor Onset, Aftertaste Duration
      if (analysis) {
        const firstOnset = analysis.firstOnset || 0;
        const aftertasteDuration = tds.totalDuration - actualSwallow;

        const onsetLabel = t("First Flavor Onset", "Primer Sabor");
        const aftertasteLabel = t("Aftertaste Duration", "Duración Post-gusto");

        doc.text(`${onsetLabel}: ${firstOnset.toFixed(1)}s`, 14, currentY);
        doc.text(`${aftertasteLabel}: ${aftertasteDuration.toFixed(1)}s`, 80, currentY);
      }

      currentY += 12;

      // 2. Timeline Visualization
      const timelineX = 14;
      const timelineW = 180;
      const timelineH = 20;
      const scale = timelineW / (tds.totalDuration || 1);

      // Calculate key positions
      const firstOnset = analysis?.firstOnset || 0;
      const attackEnd = firstOnset + (analysis?.attackPhaseDuration || 0);
      const swallow = actualSwallow;
      const total = tds.totalDuration;

      const firstOnsetX = timelineX + (firstOnset * scale);
      const attackEndX = timelineX + (attackEnd * scale);
      const swallowX = timelineX + (swallow * scale);

      // TOP ROW: Percentages (above timeline)
      doc.setFontSize(7);
      doc.setTextColor(80);
      doc.text('0%', firstOnsetX, currentY - 6, { align: 'center' });
      doc.text('20%', attackEndX, currentY - 6, { align: 'center' });
      doc.setFont("helvetica", "bold");
      doc.text('100%', swallowX, currentY - 6, { align: 'center' });
      doc.setFont("helvetica", "normal");

      // Timeline Background
      doc.setDrawColor(200);
      doc.setFillColor(245, 245, 245);
      doc.rect(timelineX, currentY, timelineW, timelineH, 'FD');

      // Timeline Segments
      tds.events.forEach(e => {
        const x = timelineX + (e.start * scale);
        const w = (e.end - e.start) * scale;
        if (w < 0.2) return;
        const colorHex = getAttributeColor(e.attrId);
        doc.setFillColor(colorHex);
        doc.rect(x, currentY, w, timelineH, 'F');
      });

      // Attack End Marker (dashed line)
      if (analysis && analysis.attackPhaseDuration > 0) {
        doc.setDrawColor(100);
        doc.setLineWidth(0.5);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(attackEndX, currentY - 2, attackEndX, currentY + timelineH + 2);
        doc.setLineDashPattern([], 0);
      }

      // Swallow Marker (solid line)
      if (swallow > 0) {
        doc.setDrawColor(0);
        doc.setLineWidth(0.8);
        doc.line(swallowX, currentY - 2, swallowX, currentY + timelineH + 2);
      }

      // BOTTOM ROW: Times (below timeline)
      currentY += timelineH;
      doc.setFontSize(7);
      doc.setTextColor(80);
      doc.text(`${firstOnset.toFixed(1)}s`, firstOnsetX, currentY + 5, { align: 'center' });
      doc.text(`${attackEnd.toFixed(1)}s`, attackEndX, currentY + 5, { align: 'center' });
      doc.setFont("helvetica", "bold");
      doc.text(`${swallow.toFixed(1)}s`, swallowX, currentY + 5, { align: 'center' });
      doc.setFont("helvetica", "normal");
      doc.text(`${total.toFixed(1)}s`, timelineX + timelineW, currentY + 5, { align: 'right' });

      currentY += 15;

      // 3. Detailed TDS Data Table
      if (analysis && analysis.scores) {
        currentY += 5;

        // Hydrate map if it's an object
        const tableRows = currentConfig.attributes.map((attr) => {
          const attrId = attr.id;
          let result: any; // TDSScoreResult

          if (analysis && analysis.scores) {
            if (analysis.scores instanceof Map) {
              result = analysis.scores.get(attrId);
            } else {
              result = (analysis.scores as any)[attrId];
            }
          }

          // Use found result or default to zero
          const score = result ? result.score : 0;
          const durationPercent = result ? result.durationPercent : 0;

          const name = isEs ? attr.nameEs : attr.nameEn;

          // Check for boost
          const isBoosted = result && result.originalScore !== undefined && result.originalScore < result.score;
          const scoreDisplay = isBoosted ? `${score} (*)` : score.toString();

          return [
            "",
            name,
            `${durationPercent.toFixed(1)}%`,
            scoreDisplay
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [[
            "",
            t("TDS Attribute", "Atributo TDS"),
            { content: t("Dominance %", "Dominancia %"), styles: { halign: 'center' } },
            { content: t("CoEx Score", "Puntaje CoEx"), styles: { halign: 'center' } }
          ]],
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [150, 150, 150], textColor: 255 },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 8 }, // Color box width
            1: { cellWidth: 80 },
            2: { halign: 'center' },
            3: { halign: 'center', fontStyle: 'bold' }
          },
          margin: { left: 14, right: 14 },
          didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 0) {
              const rowIndex = data.row.index;
              if (rowIndex < currentConfig.attributes.length) {
                const attrId = currentConfig.attributes[rowIndex].id;
                const colorHex = getAttributeColor(attrId);

                // Calculate center
                const boxSize = 4;
                const x = data.cell.x + (data.cell.width - boxSize) / 2;
                const y = data.cell.y + (data.cell.height - boxSize) / 2;

                doc.setFillColor(colorHex);
                doc.rect(x, y, boxSize, boxSize, 'F');
              }
            }
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
        // RECALCULATION STAGE:
        // Backward Compatibility for legacy sessions (missing fields OR legacy string suggestions)
        if (session.tdsProfile) {
          const needsRecalc = !analysis ||
            analysis.aromaPercent === undefined ||
            analysis.aftertastePercent === undefined ||
            (analysis.kickSuggestions && analysis.kickSuggestions.some(s => typeof s === 'string')) ||
            (analysis.qualitySuggestions && analysis.qualitySuggestions.some(s => typeof s === 'string'));

          if (needsRecalc) {
            console.log(`[PDF] Recalculating analysis for sample ${i + 1} due to missing fields or legacy format.`);
            analysis = analyzeTDS({
              mode: session.tdsProfile.mode,
              id: 'temp-recalc',
              events: session.tdsProfile.events,
              swallowTime: session.tdsProfile.swallowTime,
              totalDuration: session.tdsProfile.totalDuration
            });
          }
        }
        // 4. Aroma Insights (if available)
        if (analysis && analysis.aromaNotes.length > 0) {
          // Resolve names
          const aromaNames = analysis.aromaNotes.map(id => {
            // Find attribute
            const attr = session.attributes.find(a => a.id === id) ||
              session.attributes.flatMap(a => a.subAttributes || []).find(s => s.id === id);

            if (!attr) return id;
            // Need to handle if it's a subAttribute vs attribute
            // The 'attr' found might be a subAttribute which has nameEn/nameEs
            return isEs ? (attr as any).nameEs : (attr as any).nameEn;
          });

          const aromaText = aromaNames.join(", ");
          if (aromaText) {
            const title = t(`Dominant Aromas (${analysis.aromaPercent}%)`, `Aromas Dominantes (${analysis.aromaPercent}%)`);
            addTextSection(title, aromaText);
          }
        }

        // 5. Dominant Aftertaste + Aftertaste Boosts
        if (analysis) {
          const getAttrLabel = (id: string, lang: 'en' | 'es') => {
            const attr = currentConfig.attributes.find(a => a.id === id);
            if (attr) return lang === 'es' ? attr.nameEs : attr.nameEn;
            return id;
          };

          // Dominant Aftertaste
          if (analysis.dominantAftertaste) {
            const domLabel = getAttrLabel(analysis.dominantAftertaste, isEs ? 'es' : 'en');
            const title = t(`Dominant Aftertaste (${analysis.aftertastePercent}%)`, `Post-gusto Dominante (${analysis.aftertastePercent}%)`);
            addTextSection(title, domLabel);
          }

          // Aftertaste Boosts (e.g., "Cacao +3, Nutty +2")
          if (analysis.aftertasteBoosts && analysis.aftertasteBoosts.length > 0) {
            const boostText = analysis.aftertasteBoosts
              .map(b => {
                const label = getAttrLabel(b.attrId, isEs ? 'es' : 'en');
                return `${label} +${b.amount}`;
              })
              .join(', ');
            addTextSection(t("Aftertaste Boosts", "Refuerzos de Post-gusto"), boostText);
          }

          // 6. Quality Adjustment (moved to bottom)
          if (analysis.qualityModifier !== 0) {
            const modSign = analysis.qualityModifier > 0 ? '+' : '';
            addTextSection(
              t("Suggested Global Quality Adjustment", "Ajuste de Calidad Global Sugerido"),
              `${modSign}${analysis.qualityModifier}`
            );
          }

          // 7. Kick Suggestions
          if (analysis.kickSuggestions && analysis.kickSuggestions.length > 0) {
            const kickText = analysis.kickSuggestions
              .map(s => (typeof s === 'string' ? s : s[isEs ? 'es' : 'en']))
              .join('\n');
            addTextSection(t("Initial Kick Insights", "Observaciones del Impacto Inicial"), kickText);
          }

          // 8. Quality Suggestions
          if (analysis.qualitySuggestions && analysis.qualitySuggestions.length > 0) {
            const qualityText = analysis.qualitySuggestions
              .map(s => (typeof s === 'string' ? s : s[isEs ? 'es' : 'en']))
              .join('\n');
            addTextSection(t("Aftertaste Quality Insights", "Observaciones de Calidad del Post-gusto"), qualityText);
          }
        }
      }
    }

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



