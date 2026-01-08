import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GradingSession } from '../types';

export const generatePdf = (session: GradingSession, chartImage?: string) => {
  const doc = new jsPDF();
  const isEs = session.language === 'es';
  const t = (en: string, es: string) => (isEs ? es : en);

  // Title
  doc.setFontSize(18);
  doc.setTextColor(74, 46, 36); // Cacao Brand Color
  doc.text(t("Cacao of Excellence - Sensory Evaluation", "Cacao de Excelencia - Evaluación Sensorial"), 14, 20);

  const formatDate = (date: string) => {
    if (isEs && date) {
      const parts = date.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return date;
  };

  // Metadata Table
  const metaData = [
    [t("Evaluator", "Evaluador"), session.metadata.evaluator || '-'],
    [t("Sample Code", "Código de Muestra"), session.metadata.sampleCode || '-'],
    [t("Date", "Fecha"), formatDate(session.metadata.date) || '-'],
    [t("Time", "Hora"), session.metadata.time || '-'],
    [t("Type", "Tipo"), session.metadata.evaluationType === 'cacao_mass' ? t("Cacao Mass", "Masa de Cacao") : t("Chocolate", "Chocolate")],
    [t("Sample Info", "Info Muestra"), session.metadata.sampleInfo || '-']
  ];

  autoTable(doc, {
    startY: 30,
    head: [[t("Field", "Campo"), t("Value", "Valor")]],
    body: metaData,
    theme: 'striped',
    headStyles: { fillColor: [117, 74, 41] }, // Cacao-700
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
  });

  // Global Quality
  let currentY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setTextColor(74, 46, 36);
  doc.text(`${t("Global Quality Score", "Calidad Global")}: ${session.globalQuality}/10`, 14, currentY);
  currentY += 10;

  // Flavor Graph (Chart)
  if (chartImage) {
    const imgProps = doc.getImageProperties(chartImage);
    const pdfWidth = doc.internal.pageSize.getWidth();
    // Calculate dimensions to fit nicely, centered.
    const imgWidth = 90; // mm
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    const x = (pdfWidth - imgWidth) / 2;

    // Check for space, although likely fine at top of page
    if (currentY + imgHeight > 270) {
      doc.addPage();
      currentY = 20;
    }

    doc.addImage(chartImage, 'PNG', x, currentY, imgWidth, imgHeight);
    currentY += imgHeight + 10;
  }

  // Attributes Table
  const rows = session.attributes.map(attr => {
    const name = isEs ? attr.nameEs : attr.nameEn;
    const activeSubs = attr.subAttributes
      ?.filter(s => s.score > 0)
      .map(s => `${isEs ? s.nameEs : s.nameEn}: ${s.score}`)
      .join(', ');

    return [
      name,
      attr.score.toString(),
      activeSubs || ''
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [[t("Attribute", "Atributo"), t("Score", "Puntaje"), t("Descriptors", "Descriptores")]],
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

  // Notes Section
  const addTextSection = (title: string, content: string) => {
    if (!content) return;

    // Check for page break
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

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`${t("Page", "Página")} ${i} / ${pageCount}`, 190, 290, { align: 'right' });
  }

  doc.save(`CoEx_Report_${session.metadata.sampleCode || 'Sample'}.pdf`);
};