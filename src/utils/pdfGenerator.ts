import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { ServeAttemptData } from '@/components/ServeAttempt';

export interface AffidavitData {
  clientName: string;
  clientAddress: string;
  caseNumber: string;
  caseName?: string;
  personEntityBeingServed?: string;
  serveAttempts: ServeAttemptData[];
  courtName?: string;
  plaintiffPetitioner?: string;
  defendantRespondent?: string;
  serviceAddress?: string;
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
          if (!value || value.trim() === '' || value === 'Not specified') return false;
          
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
        
        // Fill case number if available
        if (data.caseNumber && data.caseNumber !== 'N/A') {
          tryFillField([
            'Case Number', 
            'case_number', 
            'caseNumber',
            'CASE NUMBER'
          ], data.caseNumber);
        }

        // Fill Name of Court
        if (data.courtName && data.courtName !== 'Not specified') {
          const courtFilled = tryFillField([
            'Name of Court',
            'NAME OF COURT',
            'court_name',
            'CourtName',
            'Court Name'
          ], data.courtName);
          console.log(`Court name filled: ${courtFilled} with value: ${data.courtName}`);
        }

        // Fill Plaintiff/Petitioner
        if (data.plaintiffPetitioner && data.plaintiffPetitioner !== 'Not specified') {
          const plaintiffFilled = tryFillField([
            'Plaintiff/Petitioner',
            'PLAINTIFF/PETITIONER',
            'plaintiff_petitioner',
            'PlaintiffPetitioner',
            'Plaintiff Petitioner'
          ], data.plaintiffPetitioner);
          console.log(`Plaintiff filled: ${plaintiffFilled} with value: ${data.plaintiffPetitioner}`);
        }

        // Fill Defendant/Respondent
        if (data.defendantRespondent && data.defendantRespondent !== 'Not specified') {
          const defendantFilled = tryFillField([
            'Defendant/Respondent',
            'DEFENDANT/RESPONDENT',
            'defendant_respondent',
            'DefendantRespondent',
            'Defendant Respondent'
          ], data.defendantRespondent);
          console.log(`Defendant filled: ${defendantFilled} with value: ${data.defendantRespondent}`);
        }
        
        // Fill "NAME OF PERSON / ENTITY BEING SERVED" field
        if (data.personEntityBeingServed && data.personEntityBeingServed !== 'Unknown') {
          const filled = tryFillField([
            'Name of Person/Entity Being Served',
            'NAME OF PERSON / ENTITY BEING SERVED',
            'NAME OF PERSON/ENTITY BEING SERVED',
            'person_being_served',
            'entity_being_served',
            'name_of_person_entity_being_served',
            'Name of PersonEntity Being Served'
          ], data.personEntityBeingServed);
          
          if (!filled) {
            console.log('Could not find field for person being served. Available fields:', fields.map(f => f.getName()));
          }
        }
        
        // Use the serviceAddress from the data object first, then fall back to first serve
        const serviceAddress = data.serviceAddress || data.serveAttempts[0]?.serviceAddress;
        
        console.log('Service address for PDF:', serviceAddress);
        
        // Determine if service was at residence or business based on addresses
        let isResidenceService = false;
        let isBusinessService = false;
        
        if (serviceAddress && serviceAddress !== 'Not specified') {
          // Check if service address contains business indicators
          if (serviceAddress.toLowerCase().includes('work') || 
              serviceAddress.toLowerCase().includes('office') ||
              serviceAddress.toLowerCase().includes('business') ||
              serviceAddress.toLowerCase().includes('corp') ||
              serviceAddress.toLowerCase().includes('llc') ||
              serviceAddress.toLowerCase().includes('inc')) {
            isBusinessService = true;
          } else {
            // Default to residence for most addresses
            isResidenceService = true;
          }
        }
        
        // Check appropriate service location checkboxes
        if (isResidenceService) {
          const residenceChecked = tryCheckField([
            'Residence Checkbox',
            'Residence',
            'residence',
            'RESIDENCE',
            'At residence',
            'at_residence'
          ]);
          console.log(`Residence checkbox checked: ${residenceChecked}`);
        }
        
        if (isBusinessService) {
          const businessChecked = tryCheckField([
            'business checkbox',
            'Business',
            'business', 
            'BUSINESS',
            'At business',
            'at_business',
            'Place of business',
            'place_of_business'
          ]);
          console.log(`Business checkbox checked: ${businessChecked}`);
        }
        
        if (serviceAddress && serviceAddress !== 'Not specified') {
          // Fill the residence address field first
          const residenceAddressFilled = tryFillField([
            'Residence address', 
            'residence_address', 
            'ADDRESS',
            'Residence Address'
          ], serviceAddress);
          console.log(`Residence address filled: ${residenceAddressFilled} with: ${serviceAddress}`);

          // Also try business address if it seems like a business location
          if (isBusinessService) {
            const businessAddressFilled = tryFillField([
              'Business address',
              'business_address',
              'Business Address'
            ], serviceAddress);
            console.log(`Business address filled: ${businessAddressFilled} with: ${serviceAddress}`);
          }
          
          // Try to split address for city/state field
          const addressParts = serviceAddress.split(',');
          if (addressParts.length >= 2) {
            // Get the last part which should be state/zip
            const lastPart = addressParts[addressParts.length - 1].trim();
            // Get the second to last part which should be city
            const cityPart = addressParts[addressParts.length - 2].trim();
            const cityState = `${cityPart}, ${lastPart}`;
            
            const cityStateFilled = tryFillField([
              'Residence City and state', 
              'residence_city_state', 
              'CITY / STATE',
              'city_state',
              'Business city and state',
              'business_city_state'
            ], cityState);
            console.log(`City/State filled: ${cityStateFilled} with: ${cityState}`);
          }
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
              
              // Try multiple variations for date fields
              const dateFilled = tryFillField([
                `Service attempt ${attemptNum} Date`,
                `Service attempt${attemptNum} date`,
                `Service attempt ${attemptNum} date`,
                `attempt_${attemptNum}_date`,
                `Service Attempts: Service was attempted on: (${attemptNum})`,
                `${attemptNum} DATE`,
                `${attemptNum}_DATE`
              ], dateStr);
              
              // Try multiple variations for time fields
              const timeFilled = tryFillField([
                `Service attempt ${attemptNum} time`,
                `Service attempt${attemptNum} time`, 
                `attempt_${attemptNum}_time`,
                `${attemptNum} TIME`,
                `${attemptNum}_TIME`
              ], timeStr);
              
              console.log(`Attempt ${attemptNum}: Date filled: ${dateFilled}, Time filled: ${timeFilled}`);
            }
          });

          // Get the MOST RECENT attempt for main service details
          const mostRecentAttempt = sortedAttempts[sortedAttempts.length - 1];
          
          // Fill the main service date and time with MOST RECENT attempt only
          if (mostRecentAttempt && mostRecentAttempt.timestamp) {
            const date = new Date(mostRecentAttempt.timestamp);
            
            // Fill service DATE
            const serviceDateFilled = tryFillField([
              'Service Date',
              'DATE', 
              'service_date', 
              'On',
              'On_',
              'Date',
              'Service Date'
            ], date.toLocaleDateString());
            console.log(`Service Date filled: ${serviceDateFilled} with: ${date.toLocaleDateString()}`);
            
            // Fill service TIME  
            const serviceTimeFilled = tryFillField([
              'Service Time',
              'TIME', 
              'service_time', 
              'AT',
              'AT_',
              'Time',
              'Service Time'
            ], date.toLocaleTimeString());
            console.log(`Service Time filled: ${serviceTimeFilled} with: ${date.toLocaleTimeString()}`);
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
