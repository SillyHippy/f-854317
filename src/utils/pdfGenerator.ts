import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { ServeAttemptData } from '@/components/ServeAttempt';

export interface AffidavitData {
  clientName: string;
  clientAddress: string;
  caseNumber: string;
  caseName?: string;
  personEntityBeingServed?: string;
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
        `Person Being Served: ${data.personEntityBeingServed || data.clientName}`,
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
        
        // Helper function to fill text fields only if value exists
        const tryFillField = (fieldNames: string[], value: string | undefined) => {
          if (!value || value.trim() === '') return false;
          
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
        
        // Get case information from the first serve attempt (they should all be the same case)
        const firstServe = data.serveAttempts[0];
        let courtName = '';
        let plaintiffPetitioner = '';
        let defendantRespondent = '';
        
        if (firstServe && firstServe.caseNumber) {
          // Try to get case details from the serve attempt
          // Note: This would need to be enhanced to fetch actual case details from the database
          // For now, we'll use the case name as a fallback for plaintiff/petitioner
          courtName = ''; // This should come from case data
          plaintiffPetitioner = data.caseName || ''; // This should come from case data
          defendantRespondent = ''; // This should come from case data
        }
        
        // Fill court name only if available
        if (courtName) {
          tryFillField([
            'Court', 
            'court_name', 
            'NAME OF COURT',
            '(NAME OF COURT)'
          ], courtName);
        }
        
        // Fill plaintiff/petitioner only if available
        if (plaintiffPetitioner) {
          tryFillField([
            'Plaintiff/Petitioner', 
            'plaintiff', 
            'petitioner',
            'PLAINTIFF/PETITIONER'
          ], plaintiffPetitioner);
        }
        
        // Fill defendant/respondent only if available
        if (defendantRespondent) {
          tryFillField([
            'Defendant/Respondent', 
            'defendant', 
            'respondent',
            'DEFENDANT/RESPONDENT'
          ], defendantRespondent);
        }
        
        // Fill case number if available
        if (data.caseNumber) {
          tryFillField([
            'Case Number', 
            'case_number', 
            'caseNumber',
            'CASE NUMBER'
          ], data.caseNumber);
        }
        
        // Fill NAME OF PERSON/ENTITY BEING SERVED - this is the person being served
        if (data.personEntityBeingServed) {
          tryFillField([
            'NAME OF PERSON / ENTITY BEING SERVED',
            'NAME OF PERSON/ENTITY BEING SERVED',
            'person_being_served',
            'entity_being_served',
            'name_of_person_entity_being_served'
          ], data.personEntityBeingServed);
        }
        
        // Parse and fill address information for the service location
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

        // Only check residence checkbox if we have an address
        if (data.clientAddress) {
          tryCheckField([
            'Residence Checkbox', 
            'residence_checkbox', 
            'residence_check',
            'Residence'
          ]);
        }
        
        // Fill service attempt information
        if (data.serveAttempts && data.serveAttempts.length > 0) {
          // Sort attempts by timestamp to get chronological order
          const sortedAttempts = [...data.serveAttempts].sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return dateA - dateB;
          });

          // Fill up to 5 service attempts in the Service Attempts section
          sortedAttempts.slice(0, 5).forEach((attempt, index) => {
            if (attempt.timestamp) {
              const date = new Date(attempt.timestamp);
              const dateStr = date.toLocaleDateString();
              const timeStr = date.toLocaleTimeString();
              
              const attemptNum = index + 1;
              
              // Fill Service Attempts section
              tryFillField([
                `Service attempt ${attemptNum} Date`, 
                `attempt_${attemptNum}_date`,
                `Service Attempts: Service was attempted on: (${attemptNum})`,
                `(${attemptNum})_DATE`
              ], dateStr);
              
              tryFillField([
                `Service attempt ${attemptNum} time`, 
                `attempt_${attemptNum}_time`,
                `(${attemptNum})_TIME`
              ], timeStr);
            }
          });

          // Find the most recent successful attempt for main service details
          const successfulAttempt = sortedAttempts.find(attempt => attempt.status === 'completed');
          const mainAttempt = successfulAttempt || sortedAttempts[sortedAttempts.length - 1];
          
          // Fill the main service date and time (On___ AT___ fields)
          if (successfulAttempt && successfulAttempt.timestamp) {
            const date = new Date(successfulAttempt.timestamp);
            tryFillField([
              'DATE', 
              'service_date', 
              'On',
              'On_'
            ], date.toLocaleDateString());
            
            tryFillField([
              'TIME', 
              'service_time', 
              'AT',
              'AT_'
            ], date.toLocaleTimeString());
          }

          // Service method logic - only check if we have clear indication
          if (successfulAttempt) {
            // Check Personal service for successful attempts - but leave as question to be answered
            // tryCheckField([
            //   'Personal check box', 
            //   'Personal', 
            //   'personal_service',
            //   'personal_checkbox',
            //   'By personally delivering copies to the person being served'
            // ]);
          }

          // Fill description field with notes from attempts, including physical description
          const allNotes = sortedAttempts
            .filter(attempt => attempt.notes && attempt.notes.trim())
            .map((attempt, index) => {
              const attemptLabel = sortedAttempts.length > 1 ? `Attempt ${index + 1}: ` : '';
              return `${attemptLabel}${attempt.notes}`;
            })
            .join('\n\n');

          if (allNotes) {
            tryFillField([
              'Description',
              'service_description',
              'description',
              'Description::'
            ], allNotes);
          }
        }
        
        // Fill affidavit date
        tryFillField([
          'affidavit_date', 
          'affidavitDate', 
          'date_of_affidavit', 
          'sworn_date'
        ], new Date().toLocaleDateString());
        
        // DO NOT flatten the form - keep it fillable for manual completion
        // form.flatten(); // Commented out to keep form fillable
        
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
