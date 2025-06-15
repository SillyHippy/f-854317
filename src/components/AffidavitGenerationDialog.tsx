
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PDFService, AffidavitData } from "@/utils/pdfService";
import { ServeAttemptData } from "@/components/ServeAttempt";
import { ClientData } from "@/components/ClientForm";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Loader2 } from "lucide-react";

interface AffidavitGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serveData: ServeAttemptData;
  clientData: ClientData;
}

export default function AffidavitGenerationDialog({
  open,
  onOpenChange,
  serveData,
  clientData
}: AffidavitGenerationDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Pre-populate with serve data
  const [additionalData, setAdditionalData] = useState<Partial<AffidavitData>>({
    courtName: "Superior Court of California",
    documentsToServe: "Summons and Complaint",
    serverName: "Process Server",
    serverAddress: "123 Server St, City, CA 90210",
    relationshipToDefendant: "Defendant",
    age: "",
    sex: "",
    race: "",
    height: "",
    weight: "",
    beard: "None",
    hairColor: "",
    glasses: "None",
    militaryServiceInquired: true,
    militaryInquiryDate: new Date().toLocaleDateString(),
    militaryInquiryAddress: "Military Records Office",
    substituteServiceLocation: "",
    substituteServicePerson: ""
  });
  
  const { toast } = useToast();

  const handleInputChange = (field: keyof AffidavitData, value: string | boolean) => {
    setAdditionalData(prev => ({ ...prev, [field]: value }));
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      console.log('Generating PDF with serve data:', serveData);
      console.log('Client data:', clientData);
      console.log('Additional data:', additionalData);
      
      const pdfBytes = await PDFService.generateAffidavitFromServe(
        serveData,
        clientData,
        additionalData
      );
      
      const clientNameForFile = clientData.name ? clientData.name.replace(/\s+/g, '-') : 'unknown-client';
      const caseNumberForFile = serveData.caseNumber ? serveData.caseNumber.replace(/\s+/g, '-') : 'unknown-case';
      const filename = `affidavit-${clientNameForFile}-${caseNumberForFile}-${Date.now()}.pdf`;
      
      PDFService.downloadPDF(pdfBytes, filename);
      
      toast({
        title: "PDF Generated",
        description: "Affidavit PDF has been generated and downloaded successfully.",
        variant: "default",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Affidavit for Serve Attempt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-accent/50 rounded-md">
            <h4 className="font-medium mb-2">Serve Information (Auto-filled)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <p><strong>Client:</strong> {clientData.name}</p>
              <p><strong>Case:</strong> {serveData.caseName || serveData.caseNumber}</p>
              <p><strong>Case Number:</strong> {serveData.caseNumber}</p>
              <p><strong>Status:</strong> {serveData.status}</p>
              <p><strong>Date:</strong> {new Date(serveData.timestamp).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {new Date(serveData.timestamp).toLocaleTimeString()}</p>
              <p><strong>Address:</strong> {serveData.address || clientData.address}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="courtName">Court Name</Label>
              <Input
                id="courtName"
                value={additionalData.courtName || ''}
                onChange={(e) => handleInputChange('courtName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="serverName">Server Name</Label>
              <Input
                id="serverName"
                value={additionalData.serverName || ''}
                onChange={(e) => handleInputChange('serverName', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="documentsToServe">Documents to Serve</Label>
            <Input
              id="documentsToServe"
              value={additionalData.documentsToServe || ''}
              onChange={(e) => handleInputChange('documentsToServe', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="serverAddress">Server Address</Label>
            <Textarea
              id="serverAddress"
              value={additionalData.serverAddress || ''}
              onChange={(e) => handleInputChange('serverAddress', e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="relationshipToDefendant">Relationship to Defendant</Label>
              <Input
                id="relationshipToDefendant"
                value={additionalData.relationshipToDefendant || ''}
                onChange={(e) => handleInputChange('relationshipToDefendant', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={additionalData.age || ''}
                onChange={(e) => handleInputChange('age', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sex">Sex</Label>
              <Input
                id="sex"
                value={additionalData.sex || ''}
                onChange={(e) => handleInputChange('sex', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="race">Race</Label>
              <Input
                id="race"
                value={additionalData.race || ''}
                onChange={(e) => handleInputChange('race', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={additionalData.height || ''}
                onChange={(e) => handleInputChange('height', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={additionalData.weight || ''}
                onChange={(e) => handleInputChange('weight', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hairColor">Hair Color</Label>
              <Input
                id="hairColor"
                value={additionalData.hairColor || ''}
                onChange={(e) => handleInputChange('hairColor', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="militaryServiceInquired"
              checked={additionalData.militaryServiceInquired || false}
              onCheckedChange={(checked) => handleInputChange('militaryServiceInquired', !!checked)}
            />
            <Label htmlFor="militaryServiceInquired">Military Service Inquired</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={handleGeneratePDF} 
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download PDF
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
