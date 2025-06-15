
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PDFService, AffidavitData } from "@/utils/pdfService";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Loader2 } from "lucide-react";

export default function PDFTestDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<AffidavitData>({
    caseName: "John Doe",
    courtName: "Superior Court of California",
    documentsToServe: "Summons and Complaint",
    serverName: "Process Server Name",
    serverAddress: "123 Server St, City, CA 90210",
    personServedName: "Jane Doe",
    relationshipToDefendant: "Defendant",
    serviceMethod: "Personal Service",
    age: "35",
    sex: "Female",
    race: "White",
    height: "5'6\"",
    weight: "130 lbs",
    beard: "None",
    hairColor: "Brown",
    glasses: "None",
    serviceDate: new Date().toLocaleDateString(),
    serviceTime: "2:30 PM",
    serviceAddress: "456 Service Ave, City, CA 90210",
    militaryServiceInquired: true,
    militaryInquiryDate: new Date().toLocaleDateString(),
    militaryInquiryAddress: "Military Records Office",
    substituteServiceLocation: "",
    substituteServicePerson: ""
  });
  
  const { toast } = useToast();

  const handleInputChange = (field: keyof AffidavitData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await PDFService.generateAffidavit(formData);
      const filename = `affidavit-${formData.caseName?.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      PDFService.downloadPDF(pdfBytes, filename);
      
      toast({
        title: "PDF Generated",
        description: "Affidavit PDF has been generated and downloaded successfully.",
        variant: "success",
      });
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Test PDF Generation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Affidavit PDF Generation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="caseName">Case Name</Label>
              <Input
                id="caseName"
                value={formData.caseName || ''}
                onChange={(e) => handleInputChange('caseName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="courtName">Court Name</Label>
              <Input
                id="courtName"
                value={formData.courtName || ''}
                onChange={(e) => handleInputChange('courtName', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="documentsToServe">Documents to Serve</Label>
            <Input
              id="documentsToServe"
              value={formData.documentsToServe || ''}
              onChange={(e) => handleInputChange('documentsToServe', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serverName">Server Name</Label>
              <Input
                id="serverName"
                value={formData.serverName || ''}
                onChange={(e) => handleInputChange('serverName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="personServedName">Person Served</Label>
              <Input
                id="personServedName"
                value={formData.personServedName || ''}
                onChange={(e) => handleInputChange('personServedName', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={formData.age || ''}
                onChange={(e) => handleInputChange('age', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sex">Sex</Label>
              <Input
                id="sex"
                value={formData.sex || ''}
                onChange={(e) => handleInputChange('sex', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="race">Race</Label>
              <Input
                id="race"
                value={formData.race || ''}
                onChange={(e) => handleInputChange('race', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={formData.height || ''}
                onChange={(e) => handleInputChange('height', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={formData.weight || ''}
                onChange={(e) => handleInputChange('weight', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="serviceAddress">Service Address</Label>
            <Textarea
              id="serviceAddress"
              value={formData.serviceAddress || ''}
              onChange={(e) => handleInputChange('serviceAddress', e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="militaryServiceInquired"
              checked={formData.militaryServiceInquired || false}
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
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
