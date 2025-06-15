
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ServeAttemptData } from '@/components/ServeAttempt';
import { ClientData } from '@/components/ClientForm';

export interface AffidavitData {
  clientName: string;
  clientAddress: string;
  caseNumber: string;
  caseName?: string;
  serveAttempts: ServeAttemptData[];
  processServerName: string;
  processServerAddress: string;
  notaryName?: string;
  notaryCommissionExpires?: string;
}

export const generateAffidavitPDF = async (data: AffidavitData): Promise<void> => {
  try {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AFFIDAVIT OF SERVICE', 105, 20, { align: 'center' });
    
    // Case information
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Case: ${data.caseNumber}`, 20, 40);
    if (data.caseName) {
      pdf.text(`Case Name: ${data.caseName}`, 20, 50);
    }
    
    // Client information
    pdf.text(`Defendant: ${data.clientName}`, 20, 65);
    pdf.text(`Address: ${data.clientAddress}`, 20, 75);
    
    // Service attempts
    let yPosition = 95;
    pdf.setFont('helvetica', 'bold');
    pdf.text('SERVICE ATTEMPTS:', 20, yPosition);
    yPosition += 10;
    
    pdf.setFont('helvetica', 'normal');
    data.serveAttempts.forEach((attempt, index) => {
      const attemptDate = new Date(attempt.timestamp).toLocaleDateString();
      const attemptTime = new Date(attempt.timestamp).toLocaleTimeString();
      
      pdf.text(`Attempt #${index + 1}:`, 20, yPosition);
      pdf.text(`Date: ${attemptDate} at ${attemptTime}`, 30, yPosition + 8);
      pdf.text(`Status: ${attempt.status === 'completed' ? 'Successful' : 'Failed'}`, 30, yPosition + 16);
      
      if (attempt.notes) {
        const notes = pdf.splitTextToSize(`Notes: ${attempt.notes}`, 160);
        pdf.text(notes, 30, yPosition + 24);
        yPosition += notes.length * 8;
      }
      
      yPosition += 35;
      
      // Add new page if needed
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
    });
    
    // Process server information
    yPosition += 20;
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROCESS SERVER INFORMATION:', 20, yPosition);
    yPosition += 10;
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${data.processServerName}`, 20, yPosition);
    pdf.text(`Address: ${data.processServerAddress}`, 20, yPosition + 10);
    
    // Signature area
    yPosition += 40;
    pdf.text('_________________________________', 20, yPosition);
    pdf.text('Process Server Signature', 20, yPosition + 8);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition + 20);
    
    // Notary section
    if (data.notaryName) {
      yPosition += 40;
      pdf.setFont('helvetica', 'bold');
      pdf.text('NOTARY ACKNOWLEDGMENT:', 20, yPosition);
      yPosition += 10;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Notary: ${data.notaryName}`, 20, yPosition);
      if (data.notaryCommissionExpires) {
        pdf.text(`Commission Expires: ${data.notaryCommissionExpires}`, 20, yPosition + 10);
      }
      
      yPosition += 30;
      pdf.text('_________________________________', 20, yPosition);
      pdf.text('Notary Signature', 20, yPosition + 8);
    }
    
    // Save the PDF
    const fileName = `Affidavit_${data.caseNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generateServeReportPDF = async (
  client: ClientData,
  serves: ServeAttemptData[]
): Promise<void> => {
  try {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SERVICE REPORT', 105, 20, { align: 'center' });
    
    // Client information
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Client: ${client.name}`, 20, 40);
    pdf.text(`Address: ${client.address}`, 20, 50);
    pdf.text(`Email: ${client.email || 'N/A'}`, 20, 60);
    pdf.text(`Phone: ${client.phone || 'N/A'}`, 20, 70);
    
    // Service attempts
    let yPosition = 90;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`TOTAL ATTEMPTS: ${serves.length}`, 20, yPosition);
    yPosition += 20;
    
    serves.forEach((serve, index) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Attempt #${index + 1}`, 20, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      const date = new Date(serve.timestamp).toLocaleDateString();
      const time = new Date(serve.timestamp).toLocaleTimeString();
      
      pdf.text(`Date: ${date} at ${time}`, 25, yPosition);
      pdf.text(`Case: ${serve.caseNumber || 'N/A'}`, 25, yPosition + 8);
      pdf.text(`Status: ${serve.status === 'completed' ? 'Successful' : 'Failed'}`, 25, yPosition + 16);
      
      if (serve.notes) {
        const notes = pdf.splitTextToSize(`Notes: ${serve.notes}`, 160);
        pdf.text(notes, 25, yPosition + 24);
        yPosition += notes.length * 8;
      }
      
      yPosition += 35;
      
      // Add new page if needed
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
    });
    
    // Save the PDF
    const fileName = `Service_Report_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating service report PDF:', error);
    throw error;
  }
};
