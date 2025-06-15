
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
    // Try different paths for the template
    const templatePaths = [
      '/Templates/NAPPS-Affidavit form filled.pdf',
      './Templates/NAPPS-Affidavit form filled.pdf',
      '/public/Templates/NAPPS-Affidavit form filled.pdf'
    ];
    
    let pdfDoc: PDFDocument | null = null;
    let templateLoaded = false;
    
    for (const templateUrl of templatePaths) {
      try {
        console.log(`Trying to load template from: ${templateUrl}`);
        const response = await fetch(templateUrl);
        
        if (response.ok) {
          const existingPdfBytes = await response.arrayBuffer();
          pdfDoc = await PDFDocument.load(existingPdfBytes);
          templateLoaded = true;
          console.log(`Successfully loaded template from: ${templateUrl}`);
          break;
        } else {
          console.log(`Failed to load from ${templateUrl}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`Error loading from ${templateUrl}:`, error);
      }
    }
    
    if (!templateLoaded || !pdfDoc) {
      console.warn('Could not load PDF template, creating a basic PDF instead');
      // Create a basic PDF if template loading fails
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Standard letter size
      const { height } = page.getSize();
      
      page.drawText('AFFIDAVIT OF SERVICE', {
        x: 50,
        y: height - 50,
        size: 20,
      });
      
      let yPosition = height - 100;
      const lineHeight = 20;
      
      // Add basic content
      const content = [
        `Case Number: ${data.caseNumber || 'N/A'}`,
        `Case Name: ${data.caseName || 'N/A'}`,
        `Defendant: ${data.clientName}`,
        `Address: ${data.clientAddress}`,
        '',
        'SERVICE DETAILS:',
      ];
      
      if (data.serveAttempts && data.serveAttempts.length > 0) {
        const successfulAttempt = data.serveAttempts.find(attempt => attempt.status === 'completed');
        const attemptToUse = successfulAttempt || data.serveAttempts[data.serveAttempts.length - 1];
        
        if (attemptToUse.timestamp) {
          const date = new Date(attemptToUse.timestamp);
          content.push(`Service Date: ${date.toLocaleDateString()}`);
          content.push(`Service Time: ${date.toLocaleTimeString()}`);
        }
        
        content.push(`Status: ${attemptToUse.status === 'completed' ? 'Successfully Served' : 'Attempted Service'}`);
        
        if (attemptToUse.notes) {
          content.push(`Notes: ${attemptToUse.notes}`);
        }
      }
      
      content.push('');
      content.push(`Affidavit Date: ${new Date().toLocaleDateString()}`);
      
      content.forEach((line) => {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 12,
        });
        yPosition -= lineHeight;
      });
    } else {
      // Try to fill the template form
      try {
        const form = pdfDoc.getForm();
        
        // Get all form fields to see what's available
        const fields = form.getFields();
        console.log('Available form fields:', fields.map(field => field.getName()));
        
        // Try common field names for case information
        const tryFillField = (fieldNames: string[], value: string) => {
          for (const fieldName of fieldNames) {
            try {
              const field = form.getTextField(fieldName);
              if (field) {
                field.setText(value);
                console.log(`Filled field ${fieldName} with: ${value}`);
                return true;
              }
            } catch (e) {
              // Field doesn't exist or isn't a text field, continue
            }
          }
          return false;
        };
        
        // Fill case number
        tryFillField(['case_number', 'caseNumber', 'Case Number', 'case', 'number'], data.caseNumber || '');
        
        // Fill case name
        tryFillField(['case_name', 'caseName', 'Case Name', 'title'], data.caseName || '');
        
        // Fill defendant name
        tryFillField(['defendant_name', 'defendantName', 'Defendant', 'name', 'party_name'], data.clientName || '');
        
        // Fill defendant address
        tryFillField(['defendant_address', 'defendantAddress', 'address', 'location'], data.clientAddress || '');
        
        // Fill service information
        if (data.serveAttempts && data.serveAttempts.length > 0) {
          const successfulAttempt = data.serveAttempts.find(attempt => attempt.status === 'completed');
          const attemptToUse = successfulAttempt || data.serveAttempts[data.serveAttempts.length - 1];
          
          if (attemptToUse.timestamp) {
            const date = new Date(attemptToUse.timestamp);
            tryFillField(['service_date', 'serviceDate', 'date_served', 'date'], date.toLocaleDateString());
            tryFillField(['service_time', 'serviceTime', 'time_served', 'time'], date.toLocaleTimeString());
          }
          
          const method = attemptToUse.status === 'completed' ? 'Personal Service' : 'Attempted Service';
          tryFillField(['service_method', 'serviceMethod', 'method', 'how_served'], method);
          
          if (attemptToUse.notes) {
            tryFillField(['service_notes', 'serviceNotes', 'notes', 'description', 'details'], attemptToUse.notes);
          }
        }
        
        // Fill affidavit date
        tryFillField(['affidavit_date', 'affidavitDate', 'date_of_affidavit', 'sworn_date'], new Date().toLocaleDateString());
        
        // Flatten the form to make it non-editable
        form.flatten();
        
      } catch (formError) {
        console.error('Error filling form fields:', formError);
        // Continue with the loaded PDF even if form filling fails
      }
    }
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `Affidavit_${data.caseNumber || 'Service'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
