import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import type { Complaint } from '@/types';

/**
 * Export a DOM element as PDF
 */
export async function exportElementAsPDF(
    elementId: string,
    filename: string
): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element #${elementId} not found`);

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
}

/**
 * Export complaints list as PDF report
 */
export function exportComplaintsReport(complaints: Complaint[], title: string): void {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(59, 130, 246);
    pdf.text('SmartComplaints', 14, 20);

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, 14, 30);

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 38);
    pdf.text(`Total: ${complaints.length} complaints`, 14, 44);

    // Table header
    let y = 55;
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(59, 130, 246);
    pdf.rect(14, y - 5, pageWidth - 28, 8, 'F');
    pdf.text('ID', 16, y);
    pdf.text('Title', 35, y);
    pdf.text('Category', 100, y);
    pdf.text('Priority', 130, y);
    pdf.text('Status', 155, y);
    pdf.text('Date', 175, y);

    y += 8;
    pdf.setTextColor(0, 0, 0);

    for (const complaint of complaints) {
        if (y > 270) {
            pdf.addPage();
            y = 20;
        }

        const isEven = complaints.indexOf(complaint) % 2 === 0;
        if (isEven) {
            pdf.setFillColor(245, 247, 250);
            pdf.rect(14, y - 4, pageWidth - 28, 7, 'F');
        }

        pdf.setFontSize(8);
        pdf.text(complaint.id.slice(0, 8), 16, y);
        pdf.text(complaint.title.slice(0, 30), 35, y);
        pdf.text(complaint.category, 100, y);
        pdf.text(complaint.priority, 130, y);
        pdf.text(complaint.status.replace('_', ' '), 155, y);
        pdf.text(format(new Date(complaint.createdAt), 'MM/dd/yy'), 175, y);

        y += 7;
    }

    pdf.save(`complaints-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
