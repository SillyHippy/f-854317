
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download } from 'lucide-react';
import { generateAffidavitPDF, AffidavitData } from '@/utils/pdfGenerator';
import { ServeAttemptData } from '@/components/ServeAttempt';
import { ClientData } from '@/components/ClientForm';
import { useToast } from '@/hooks/use-toast';

interface AffidavitGeneratorProps {
  client: ClientData;
  serves: ServeAttemptData[];
  caseNumber?: string;
  caseName?: string;
}

const AffidavitGenerator: React.FC<AffidavitGeneratorProps> = ({
  client,
  serves,
  caseNumber,
  caseName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    courtName: '',
    plaintiffPetitioner: '',
    defendantRespondent: '',
    personEntityBeingServed: client.name, // Default to client name
    caseNumber: caseNumber || '',
    caseName: caseName || ''
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateAffidavit = async () => {
    setIsGenerating(true);
    
    try {
      const affidavitData: AffidavitData = {
        clientName: client.name,
        clientAddress: client.address,
        caseNumber: formData.caseNumber,
        caseName: formData.caseName,
        courtName: formData.courtName.trim() || undefined,
        plaintiffPetitioner: formData.plaintiffPetitioner.trim() || undefined,
        defendantRespondent: formData.defendantRespondent.trim() || undefined,
        personEntityBeingServed: formData.personEntityBeingServed.trim() || undefined,
        serveAttempts: serves
      };

      await generateAffidavitPDF(affidavitData);
      
      toast({
        title: "Affidavit Generated",
        description: "The affidavit PDF has been downloaded successfully.",
        variant: "default"
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error generating affidavit:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate the affidavit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <FileText className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Affidavit of Service</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courtName">Court Name</Label>
              <Input
                id="courtName"
                value={formData.courtName}
                onChange={(e) => handleInputChange('courtName', e.target.value)}
                placeholder="Enter court name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="caseNumber">Case Number</Label>
              <Input
                id="caseNumber"
                value={formData.caseNumber}
                onChange={(e) => handleInputChange('caseNumber', e.target.value)}
                placeholder="Enter case number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plaintiffPetitioner">Plaintiff/Petitioner</Label>
            <Input
              id="plaintiffPetitioner"
              value={formData.plaintiffPetitioner}
              onChange={(e) => handleInputChange('plaintiffPetitioner', e.target.value)}
              placeholder="Enter plaintiff/petitioner name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defendantRespondent">Defendant/Respondent</Label>
            <Input
              id="defendantRespondent"
              value={formData.defendantRespondent}
              onChange={(e) => handleInputChange('defendantRespondent', e.target.value)}
              placeholder="Enter defendant/respondent name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personEntityBeingServed">Person/Entity Being Served</Label>
            <Input
              id="personEntityBeingServed"
              value={formData.personEntityBeingServed}
              onChange={(e) => handleInputChange('personEntityBeingServed', e.target.value)}
              placeholder="Enter person/entity being served"
            />
          </div>

          <div className="text-sm space-y-2 border-t pt-4">
            <p><strong>Service Address:</strong> {client.address}</p>
            <p><strong>Attempts:</strong> {serves.length}</p>
          </div>

          <Button 
            onClick={handleGenerateAffidavit} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              "Generating..."
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Affidavit
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AffidavitGenerator;
