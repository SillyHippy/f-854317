
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { ServeAttemptData } from '@/components/ServeAttempt';
import { ClientData } from '@/components/ClientForm';

export interface AffidavitData {
  // Basic case info
  caseName?: string;
  caseNumber?: string;
  courtName?: string;
  documentsToServe?: string;
  
  // Server info
  serverName?: string;
  serverAddress?: string;
  
  // Person served details
  personServedName?: string;
  relationshipToDefendant?: string;
  serviceMethod?: string;
  
  // Physical description
  age?: string;
  sex?: string;
  race?: string;
  height?: string;
  weight?: string;
  beard?: string;
  hairColor?: string;
  glasses?: string;
  
  // Service details
  serviceDate?: string;
  serviceTime?: string;
  serviceAddress?: string;
  
  // Previous attempts
  previousAttempts?: Array<{
    date?: string;
    time?: string;
  }>;
  
  // Military inquiry
  militaryServiceInquired?: boolean;
  militaryInquiryDate?: string;
  militaryInquiryAddress?: string;
  
  // Substitute service
  substituteServiceLocation?: string;
  substituteServicePerson?: string;
}

export class PDFService {
  private static async loadPDFTemplate(): Promise<PDFDocument> {
    try {
      const response = await fetch('/Templates/NAPPS-Affidavit form filled.pdf');
      if (!response.ok) {
        throw new Error(`Failed to load PDF template: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return await PDFDocument.load(arrayBuffer);
    } catch (error) {
      console.error('Error loading PDF template:', error);
      throw new Error('Could not load PDF template. Please check that the file exists.');
    }
  }

  static async generateAffidavit(data: AffidavitData): Promise<Uint8Array> {
    try {
      const pdfDoc = await this.loadPDFTemplate();
      const form = pdfDoc.getForm();
      
      // Get all form fields to see what's available
      const fields = form.getFields();
      console.log('Available PDF form fields:', fields.map(field => ({
        name: field.getName(),
        type: field.constructor.name
      })));

      // Create a mapping of common field variations to try
      const fieldMappings = {
        // Case information
        caseName: ['caseName', 'case_name', 'Case Name', 'Case_Name', 'CASE_NAME'],
        caseNumber: ['caseNumber', 'case_number', 'Case Number', 'Case_Number', 'CASE_NUMBER'],
        courtName: ['courtName', 'court_name', 'Court Name', 'Court_Name', 'COURT_NAME'],
        
        // Server information  
        serverName: ['serverName', 'server_name', 'Server Name', 'Server_Name', 'SERVER_NAME'],
        serverAddress: ['serverAddress', 'server_address', 'Server Address', 'Server_Address', 'SERVER_ADDRESS'],
        
        // Person served
        personServedName: ['personServedName', 'person_served_name', 'Person Served', 'Person_Served', 'PERSON_SERVED'],
        relationshipToDefendant: ['relationshipToDefendant', 'relationship', 'Relationship', 'RELATIONSHIP'],
        
        // Service details
        serviceDate: ['serviceDate', 'service_date', 'Service Date', 'Service_Date', 'SERVICE_DATE', 'date_served', 'Date Served'],
        serviceTime: ['serviceTime', 'service_time', 'Service Time', 'Service_Time', 'SERVICE_TIME', 'time_served', 'Time Served'],
        serviceAddress: ['serviceAddress', 'service_address', 'Service Address', 'Service_Address', 'SERVICE_ADDRESS'],
        serviceMethod: ['serviceMethod', 'service_method', 'Service Method', 'Service_Method', 'SERVICE_METHOD'],
        
        // Physical description
        age: ['age', 'Age', 'AGE'],
        sex: ['sex', 'Sex', 'SEX', 'gender', 'Gender'],
        race: ['race', 'Race', 'RACE', 'ethnicity', 'Ethnicity'],
        height: ['height', 'Height', 'HEIGHT'],
        weight: ['weight', 'Weight', 'WEIGHT'],
        hairColor: ['hairColor', 'hair_color', 'Hair Color', 'Hair_Color', 'HAIR_COLOR'],
        
        // Documents
        documentsToServe: ['documentsToServe', 'documents_to_serve', 'Documents', 'DOCUMENTS'],
        
        // Military
        militaryInquiryDate: ['militaryInquiryDate', 'military_inquiry_date', 'Military Date', 'MILITARY_DATE'],
        militaryInquiryAddress: ['militaryInquiryAddress', 'military_inquiry_address', 'Military Address', 'MILITARY_ADDRESS'],
        militaryServiceInquired: ['militaryServiceInquired', 'military_service_inquired', 'Military Inquiry', 'MILITARY_INQUIRY'],

        // Previous attempts - try different numbering patterns
        attempt1Date: ['attempt1_date', 'attempt_1_date', 'Attempt1Date', 'ATTEMPT1_DATE'],
        attempt1Time: ['attempt1_time', 'attempt_1_time', 'Attempt1Time', 'ATTEMPT1_TIME'],
        attempt2Date: ['attempt2_date', 'attempt_2_date', 'Attempt2Date', 'ATTEMPT2_DATE'],
        attempt2Time: ['attempt2_time', 'attempt_2_time', 'Attempt2Time', 'ATTEMPT2_TIME'],
        attempt3Date: ['attempt3_date', 'attempt_3_date', 'Attempt3Date', 'ATTEMPT3_DATE'],
        attempt3Time: ['attempt3_time', 'attempt_3_time', 'Attempt3Time', 'ATTEMPT3_TIME'],
        attempt4Date: ['attempt4_date', 'attempt_4_date', 'Attempt4Date', 'ATTEMPT4_DATE'],
        attempt4Time: ['attempt4_time', 'attempt_4_time', 'Attempt4Time', 'ATTEMPT4_TIME'],
        attempt5Date: ['attempt5_date', 'attempt_5_date', 'Attempt5Date', 'ATTEMPT5_DATE'],
        attempt5Time: ['attempt5_time', 'attempt_5_time', 'Attempt5Time', 'ATTEMPT5_TIME']
      };

      // Fill text fields using the mapping
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && fieldMappings[key as keyof typeof fieldMappings]) {
          const possibleFieldNames = fieldMappings[key as keyof typeof fieldMappings];
          this.fillFormFieldWithMapping(form, possibleFieldNames, String(value));
        }
      });

      // Handle previous attempts specifically
      if (data.previousAttempts && data.previousAttempts.length > 0) {
        data.previousAttempts.forEach((attempt, index) => {
          if (index < 5) { // Only handle up to 5 attempts as shown in the template
            const attemptNum = index + 1;
            if (attempt.date) {
              this.fillFormFieldWithMapping(form, fieldMappings[`attempt${attemptNum}Date` as keyof typeof fieldMappings], attempt.date);
            }
            if (attempt.time) {
              this.fillFormFieldWithMapping(form, fieldMappings[`attempt${attemptNum}Time` as keyof typeof fieldMappings], attempt.time);
            }
          }
        });
      }

      // Handle checkboxes specifically
      if (data.militaryServiceInquired !== undefined) {
        const militaryFieldNames = fieldMappings.militaryServiceInquired;
        this.fillCheckboxFieldWithMapping(form, militaryFieldNames, data.militaryServiceInquired);
      }

      // Keep form fillable for manual completion of remaining fields
      // form.flatten(); // Uncomment this line to make the form non-editable

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF affidavit');
    }
  }

  static async generateAffidavitFromServe(
    serveData: ServeAttemptData, 
    clientData: ClientData,
    additionalData?: Partial<AffidavitData>,
    previousAttempts?: ServeAttemptData[]
  ): Promise<Uint8Array> {
    console.log('Generating affidavit from serve data:', serveData);
    console.log('Client data:', clientData);
    console.log('Previous attempts:', previousAttempts);
    
    const timestamp = new Date(serveData.timestamp);
    
    // Format previous attempts for the PDF
    const formattedPreviousAttempts = previousAttempts?.map(attempt => ({
      date: new Date(attempt.timestamp).toLocaleDateString('en-US'),
      time: new Date(attempt.timestamp).toLocaleTimeString('en-US')
    })) || [];

    const affidavitData: AffidavitData = {
      // Use case name or case number for the case name field
      caseName: serveData.caseName || serveData.caseNumber || 'Unknown Case',
      caseNumber: serveData.caseNumber || 'Unknown',
      courtName: additionalData?.courtName || "Superior Court of California",
      documentsToServe: additionalData?.documentsToServe || "Summons and Complaint",
      serverName: additionalData?.serverName || "Process Server",
      serverAddress: additionalData?.serverAddress || "",
      personServedName: clientData.name || 'Unknown Person',
      relationshipToDefendant: additionalData?.relationshipToDefendant || "",
      serviceMethod: serveData.status === 'completed' ? 'Personal Service' : 'Attempted Service',
      serviceDate: timestamp.toLocaleDateString('en-US'),
      serviceTime: timestamp.toLocaleTimeString('en-US'),
      serviceAddress: serveData.address || clientData.address || 'Unknown Address',
      previousAttempts: formattedPreviousAttempts,
      militaryServiceInquired: additionalData?.militaryServiceInquired !== undefined ? additionalData.militaryServiceInquired : true,
      militaryInquiryDate: additionalData?.militaryInquiryDate || timestamp.toLocaleDateString('en-US'),
      militaryInquiryAddress: additionalData?.militaryInquiryAddress || "Military Records Office",
      substituteServiceLocation: additionalData?.substituteServiceLocation || "",
      substituteServicePerson: additionalData?.substituteServicePerson || "",
      // Include additional data
      ...additionalData
    };

    console.log('Final affidavit data:', affidavitData);
    return this.generateAffidavit(affidavitData);
  }

  private static fillFormFieldWithMapping(form: PDFForm, possibleFieldNames: string[], value: string) {
    if (!value) return;
    
    for (const fieldName of possibleFieldNames) {
      try {
        const field = form.getTextField(fieldName);
        field.setText(value);
        console.log(`Successfully filled field "${fieldName}" with value: ${value}`);
        return; // Success, exit early
      } catch (error) {
        // Field doesn't exist, try next name
        continue;
      }
    }
    
    console.warn(`Could not find any matching field for: ${possibleFieldNames.join(', ')}`);
  }

  private static fillCheckboxFieldWithMapping(form: PDFForm, possibleFieldNames: string[], checked: boolean) {
    for (const fieldName of possibleFieldNames) {
      try {
        const field = form.getCheckBox(fieldName);
        if (checked) {
          field.check();
        } else {
          field.uncheck();
        }
        console.log(`Successfully filled checkbox "${fieldName}" with value: ${checked}`);
        return; // Success, exit early
      } catch (error) {
        // Field doesn't exist, try next name
        continue;
      }
    }
    
    console.warn(`Could not find any matching checkbox for: ${possibleFieldNames.join(', ')}`);
  }

  static downloadPDF(pdfBytes: Uint8Array, filename: string = 'affidavit.pdf') {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
