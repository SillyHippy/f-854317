
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { ServeAttemptData } from '@/components/ServeAttempt';

export interface AffidavitData {
  clientName: string;
  clientAddress: string;
  caseNumber: string;
  caseName?: string;
  serveAttempts: ServeAttemptData[];
}

export const generateAffidavitPDF = async (data: AffidavitData): Promise<void> => {
  try {
    // Load the existing PDF template
    const templateUrl = '/Templates/NAPPS-Affidavit form filled.pdf';
    const response = await fetch(templateUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`);
    }
    
    const existingPdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();
    
    // Get all form fields to see what's available
    const fields = form.getFields();
    console.log('Available form fields:', fields.map(field => field.getName()));
    
    // Fill common case information
    try {
      // Case number field
      const caseNumberField = form.getTextField('case_number');
      if (caseNumberField) {
        caseNumberField.setText(data.caseNumber || '');
      }
    } catch (e) {
      console.log('Case number field not found or not fillable');
    }
    
    try {
      // Case name field
      const caseNameField = form.getTextField('case_name');
      if (caseNameField) {
        caseNameField.setText(data.caseName || '');
      }
    } catch (e) {
      console.log('Case name field not found or not fillable');
    }
    
    try {
      // Defendant name
      const defendantField = form.getTextField('defendant_name');
      if (defendantField) {
        defendantField.setText(data.clientName || '');
      }
    } catch (e) {
      console.log('Defendant field not found or not fillable');
    }
    
    try {
      // Defendant address
      const addressField = form.getTextField('defendant_address');
      if (addressField) {
        addressField.setText(data.clientAddress || '');
      }
    } catch (e) {
      console.log('Address field not found or not fillable');
    }
    
    // Fill service attempt information
    if (data.serveAttempts && data.serveAttempts.length > 0) {
      // Use the most recent successful attempt or the last attempt
      const successfulAttempt = data.serveAttempts.find(attempt => attempt.status === 'completed');
      const attemptToUse = successfulAttempt || data.serveAttempts[data.serveAttempts.length - 1];
      
      try {
        // Service date
        const serviceDateField = form.getTextField('service_date');
        if (serviceDateField && attemptToUse.timestamp) {
          const date = new Date(attemptToUse.timestamp);
          serviceDateField.setText(date.toLocaleDateString());
        }
      } catch (e) {
        console.log('Service date field not found or not fillable');
      }
      
      try {
        // Service time
        const serviceTimeField = form.getTextField('service_time');
        if (serviceTimeField && attemptToUse.timestamp) {
          const date = new Date(attemptToUse.timestamp);
          serviceTimeField.setText(date.toLocaleTimeString());
        }
      } catch (e) {
        console.log('Service time field not found or not fillable');
      }
      
      try {
        // Service method/notes
        const serviceMethodField = form.getTextField('service_method');
        if (serviceMethodField) {
          const method = attemptToUse.status === 'completed' ? 'Personal Service' : 'Attempted Service';
          serviceMethodField.setText(method);
        }
      } catch (e) {
        console.log('Service method field not found or not fillable');
      }
      
      try {
        // Service notes
        const notesField = form.getTextField('service_notes');
        if (notesField && attemptToUse.notes) {
          notesField.setText(attemptToUse.notes);
        }
      } catch (e) {
        console.log('Notes field not found or not fillable');
      }
    }
    
    try {
      // Today's date for affidavit date
      const affidavitDateField = form.getTextField('affidavit_date');
      if (affidavitDateField) {
        affidavitDateField.setText(new Date().toLocaleDateString());
      }
    } catch (e) {
      console.log('Affidavit date field not found or not fillable');
    }
    
    // Flatten the form to make it non-editable
    form.flatten();
    
    // Save the filled PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `Affidavit_${data.caseNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
