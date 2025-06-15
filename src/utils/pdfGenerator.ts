
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
        data.serveAttempts.forEach((attempt, index) => {
          content.push(`Attempt ${index + 1}:`);
          if (attempt.timestamp) {
            const date = new Date(attempt.timestamp);
            content.push(`  Date: ${date.toLocaleDateString()}`);
            content.push(`  Time: ${date.toLocaleTimeString()}`);
          }
          content.push(`  Status: ${attempt.status === 'completed' ? 'Successfully Served' : 'Attempted Service'}`);
          if (attempt.notes) {
            content.push(`  Notes: ${attempt.notes}`);
          }
          content.push('');
        });
      }
      
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
        
        // Helper function to fill text fields
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

        // Helper function to check checkboxes
        const tryCheckField = (fieldNames: string[]) => {
          for (const fieldName of fieldNames) {
            try {
              const field = form.getCheckBox(fieldName);
              if (field) {
                field.check();
                console.log(`Checked field: ${fieldName}`);
                return true;
              }
            } catch (e) {
              // Field doesn't exist or isn't a checkbox, continue
            }
          }
          return false;
        };
        
        // Fill case information - case number should go in the case number field
        tryFillField(['Case Number', 'case_number', 'caseNumber'], data.caseNumber || '');
        
        // Fill plaintiff/petitioner with case name (NOT the person being served)
        tryFillField(['Plaintiff/Petitioner', 'plaintiff', 'petitioner'], data.caseName || '');
        
        // Fill defendant/person being served information - this is the CLIENT NAME
        tryFillField([
          'Name of Person/Entity Being Served', 
          'Defendant/Respondent', 
          'defendant', 
          'respondent',
          'person_being_served',
          'entity_being_served'
        ], data.clientName || '');
        
        // Parse address for residence fields
        if (data.clientAddress) {
          // Fill the full address in residence address field
          tryFillField([
            'Residence address', 
            'residence_address', 
            'ADDRESS'
          ], data.clientAddress);
          
          // Try to split address for city/state field
          const addressParts = data.clientAddress.split(',');
          if (addressParts.length >= 2) {
            // Get the last part which should be state/zip
            const lastPart = addressParts[addressParts.length - 1].trim();
            // Get the second to last part which should be city
            const cityPart = addressParts[addressParts.length - 2].trim();
            const cityState = `${cityPart}, ${lastPart}`;
            
            tryFillField([
              'Residence City and state', 
              'residence_city_state', 
              'CITY / STATE',
              'city_state'
            ], cityState);
          }
        }

        // Check residence checkbox since we're serving at residence
        tryCheckField([
          'Residence Checkbox', 
          'residence_checkbox', 
          'residence_check',
          'Residence'
        ]);
        
        // Fill service attempt information
        if (data.serveAttempts && data.serveAttempts.length > 0) {
          // Sort attempts by timestamp to get chronological order
          const sortedAttempts = [...data.serveAttempts].sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return dateA - dateB;
          });

          // Fill up to 5 service attempts based on the form structure
          sortedAttempts.slice(0, 5).forEach((attempt, index) => {
            if (attempt.timestamp) {
              const date = new Date(attempt.timestamp);
              const dateStr = date.toLocaleDateString();
              const timeStr = date.toLocaleTimeString();
              
              // Fill service attempt dates and times in the Service Attempts section
              const attemptNum = index + 1;
              tryFillField([`Service attempt ${attemptNum} Date`, `attempt_${attemptNum}_date`], dateStr);
              tryFillField([`Service attempt ${attemptNum} time`, `attempt_${attemptNum}_time`], timeStr);
            }
          });

          // Use the most recent successful attempt for main service details, or last attempt if none successful
          const successfulAttempt = sortedAttempts.find(attempt => attempt.status === 'completed');
          const mainAttempt = successfulAttempt || sortedAttempts[sortedAttempts.length - 1];
          
          // Fill the main service date and time (On DATE AT TIME section)
          if (mainAttempt.timestamp) {
            const date = new Date(mainAttempt.timestamp);
            tryFillField(['DATE', 'service_date', 'On'], date.toLocaleDateString());
            tryFillField(['TIME', 'service_time', 'AT'], date.toLocaleTimeString());
          }

          // Determine and check appropriate service method based on attempt status
          if (successfulAttempt) {
            // If we have a successful attempt, check Personal service
            tryCheckField([
              'Personal check box', 
              'Personal', 
              'personal_service',
              'personal_checkbox'
            ]);
          } else {
            // If no successful service, determine reason based on notes or default to unable to serve
            const lastAttempt = sortedAttempts[sortedAttempts.length - 1];
            if (lastAttempt.notes) {
              const notes = lastAttempt.notes.toLowerCase();
              if (notes.includes('not home') || notes.includes('no answer')) {
                tryCheckField(['Unknown at Address', 'unknown_at_address']);
              } else if (notes.includes('moved') || notes.includes('forwarding')) {
                tryCheckField(['Moved, Left no Forwarding', 'moved_no_forwarding']);
              } else if (notes.includes('cancel')) {
                tryCheckField(['Service Cancelled by Litigant', 'service_cancelled']);
              } else {
                tryCheckField(['Unable to Serve in Timely Fashion', 'unable_to_serve_timely']);
              }
            } else {
              tryCheckField(['Unable to Serve in Timely Fashion', 'unable_to_serve_timely']);
            }
          }

          // Check if we should inquire about military service
          tryCheckField([
            'Inquired if subject was a member of the U.S. Military and was informed they are not.',
            'military_inquiry',
            'us_military_check'
          ]);
        }
        
        // Fill affidavit date
        tryFillField([
          'affidavit_date', 
          'affidavitDate', 
          'date_of_affidavit', 
          'sworn_date'
        ], new Date().toLocaleDateString());
        
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
