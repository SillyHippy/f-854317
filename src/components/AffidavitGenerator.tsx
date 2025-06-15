
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
    personEntityBeingServed: '', // Keep this field for user input
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
    if (!formData.personEntityBeingServed.trim()) {
      toast({
        title: "Required Field Missing",
        description: "Please enter the name of the person/entity being served.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const affidavitData: AffidavitData = {
        clientName: client.name,
        clientAddress: client.address,
        caseNumber: formData.caseNumber,
        caseName: formData.caseName || undefined,
        personEntityBeingServed: formData.personEntityBeingServed.trim(),
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
          <div className="space-y-2">
            <Label htmlFor="personEntityBeingServed">Person/Entity Being Served *</Label>
            <Input
              id="personEntityBeingServed"
              value={formData.personEntityBeingServed}
              onChange={(e) => handleInputChange('personEntityBeingServed', e.target.value)}
              placeholder="Enter person/entity being served"
              required
            />
          </div>

          <div className="text-sm space-y-2 border-t pt-4">
            <p><strong>Service Address:</strong> {client.address}</p>
            <p><strong>Attempts:</strong> {serves.length}</p>
            <p className="text-xs text-muted-foreground">
              Case details will be pulled from the selected case information.
            </p>
          </div>

          <Button 
            onClick={handleGenerateAffidavit} 
            disabled={isGenerating || !formData.personEntityBeingServed.trim()}
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
