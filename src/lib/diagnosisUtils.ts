import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadDiagnosisReport = (report: any) => {
  if (!report) return;
  
  // Handle both raw AI report and Supabase record with report_data
  const data = report.report_data || report;
  const cropType = report.crop_type || data.cropType || 'Unknown';
  const diseaseName = data.diseaseName || report.result_label || 'Unknown';
  const scientificName = data.scientificName || 'N/A';
  const confidence = data.confidence || report.confidence || 0;
  const status = data.status || report.status || 'Unknown';
  const description = data.description || 'N/A';
  const symptoms = Array.isArray(data.symptoms) ? data.symptoms : [data.symptoms || 'N/A'];
  const recommendations = data.recommendations || report.recommendation || 'N/A';
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(34, 197, 94); // Primary color (green)
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CROP DIAGNOSIS REPORT', 20, 25);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 32);

  // Summary Table
  autoTable(doc, {
    startY: 50,
    head: [['Field', 'Information']],
    body: [
      ['Crop Type', cropType],
      ['Disease Name', diseaseName],
      ['Scientific Name', scientificName],
      ['Confidence', `${(confidence * 100).toFixed(1)}%`],
      ['Status', status.toUpperCase()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 15;

  // Description
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, finalY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const splitDesc = doc.splitTextToSize(description, pageWidth - 40);
  doc.text(splitDesc, 20, finalY + 7);
  finalY += splitDesc.length * 5 + 15;

  // Symptoms
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Symptoms Observed', 20, finalY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  symptoms.forEach((symptom: string, index: number) => {
    doc.text(`• ${symptom}`, 25, finalY + 7 + (index * 5));
  });
  finalY += symptoms.length * 5 + 15;

  // Recommendations
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Recommendations', 20, finalY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const splitRec = doc.splitTextToSize(recommendations, pageWidth - 40);
  doc.text(splitRec, 20, finalY + 7);
  finalY += splitRec.length * 5 + 15;

  // Treatment Steps
  if (Array.isArray(data.treatmentSteps)) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Treatment Advisory Guide', 20, finalY);
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Step', 'Action', 'Description']],
      body: data.treatmentSteps.map((s: any, i: number) => [i + 1, s.title, s.desc]),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
    });
    finalY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Environmental Context
  if (Array.isArray(data.environmentalContext)) {
    if (finalY > 240) { doc.addPage(); finalY = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Environmental Context', 20, finalY);
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Factor', 'Value', 'Status']],
      body: data.environmentalContext.map((e: any) => [e.label, e.value, e.status]),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
    });
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`AgriTech Pro - AI Diagnosis System | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`diagnosis_${cropType.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};
