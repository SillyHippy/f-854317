
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { ServeAttemptData } from '@/components/ServeAttempt';
import { ClientData } from '@/components/ClientForm';

export interface AffidavitData {
  // Basic case info
  caseName?: string;
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

      // Fill in the form fields with available data
      this.fillFormField(form, 'caseName', data.caseName);
      this.fillFormField(form, 'courtName', data.courtName);
      this.fillFormField(form, 'documentsToServe', data.documentsToServe);
      this.fillFormField(form, 'serverName', data.serverName);
      this.fillFormField(form, 'serverAddress', data.serverAddress);
      this.fillFormField(form, 'personServedName', data.personServedName);
      this.fillFormField(form, 'relationshipToDefendant', data.relationshipToDefendant);
      this.fillFormField(form, 'serviceMethod', data.serviceMethod);
      this.fillFormField(form, 'age', data.age);
      this.fillFormField(form, 'sex', data.sex);
      this.fillFormField(form, 'race', data.race);
      this.fillFormField(form, 'height', data.height);
      this.fillFormField(form, 'weight', data.weight);
      this.fillFormField(form, 'beard', data.beard);
      this.fillFormField(form, 'hairColor', data.hairColor);
      this.fillFormField(form, 'glasses', data.glasses);
      this.fillFormField(form, 'serviceDate', data.serviceDate);
      this.fillFormField(form, 'serviceTime', data.serviceTime);
      this.fillFormField(form, 'serviceAddress', data.serviceAddress);
      this.fillFormField(form, 'militaryInquiryDate', data.militaryInquiryDate);
      this.fillFormField(form, 'militaryInquiryAddress', data.militaryInquiryAddress);
      this.fillFormField(form, 'substituteServiceLocation', data.substituteServiceLocation);
      this.fillFormField(form, 'substituteServicePerson', data.substituteServicePerson);

      // Handle checkboxes
      if (data.militaryServiceInquired !== undefined) {
        this.fillCheckboxField(form, 'militaryServiceInquired', data.militaryServiceInquired);
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
    additionalData?: Partial<AffidavitData>
  ): Promise<Uint8Array> {
    const timestamp = new Date(serveData.timestamp);
    const affidavitData: AffidavitData = {
      caseName: serveData.caseName || serveData.caseNumber,
      courtName: additionalData?.courtName || "Superior Court",
      documentsToServe: additionalData?.documentsToServe || "Legal Documents",
      serverName: additionalData?.serverName || "Process Server",
      serverAddress: additionalData?.serverAddress || "",
      personServedName: clientData.name,
      relationshipToDefendant: additionalData?.relationshipToDefendant || "Defendant",
      serviceMethod: serveData.status === 'completed' ? 'Personal Service' : 'Attempted Service',
      serviceDate: timestamp.toLocaleDateString(),
      serviceTime: timestamp.toLocaleTimeString(),
      serviceAddress: serveData.address || clientData.address,
      militaryServiceInquired: additionalData?.militaryServiceInquired || false,
      militaryInquiryDate: additionalData?.militaryInquiryDate || timestamp.toLocaleDateString(),
      militaryInquiryAddress: additionalData?.militaryInquiryAddress || "",
      substituteServiceLocation: additionalData?.substituteServiceLocation || "",
      substituteServicePerson: additionalData?.substituteServicePerson || "",
      ...additionalData
    };

    return this.generateAffidavit(affidavitData);
  }

  private static fillFormField(form: PDFForm, fieldName: string, value?: string) {
    if (!value) return;
    
    try {
      const field = form.getTextField(fieldName);
      field.setText(value);
    } catch (error) {
      console.warn(`Could not fill field "${fieldName}":`, error);
    }
  }

  private static fillCheckboxField(form: PDFForm, fieldName: string, checked: boolean) {
    try {
      const field = form.getCheckBox(fieldName);
      if (checked) {
        field.check();
      } else {
        field.uncheck();
      }
    } catch (error) {
      console.warn(`Could not fill checkbox "${fieldName}":`, error);
    }
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
