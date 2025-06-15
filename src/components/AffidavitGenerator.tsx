
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  courtName?: string;
  plaintiffPetitioner?: string;
  defendantRespondent?: string;
}

const AffidavitGenerator: React.FC<AffidavitGeneratorProps> = ({
  client,
  serves,
  caseNumber,
  caseName,
  courtName,
  plaintiffPetitioner,
  defendantRespondent
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Extract data from serves
  const firstServe = serves[0];
  
  // Use provided props first, then fall back to serve data
  const displayCourtName = courtName || 'Not specified';
  const displayPlaintiff = plaintiffPetitioner || 'Not specified';
  const displayDefendant = defendantRespondent || 'Not specified';
  const displayPersonBeingServed = firstServe?.caseName || caseName || 'Unknown';
  const displayServiceAddress = firstServe?.serviceAddress || firstServe?.address || 'Not specified';
  const displayCaseNumber = caseNumber || firstServe?.caseNumber || 'N/A';

  console.log('AffidavitGenerator data:', {
    courtName: displayCourtName,
    plaintiffPetitioner: displayPlaintiff,
    defendantRespondent: displayDefendant,
    personBeingServed: displayPersonBeingServed,
    serviceAddress: displayServiceAddress,
    caseNumber: displayCaseNumber,
    firstServe
  });

  const handleGenerateAffidavit = async () => {
    setIsGenerating(true);
    
    try {
      const affidavitData: AffidavitData = {
        clientName: client.name,
        clientAddress: client.address,
        caseNumber: displayCaseNumber,
        caseName: displayPersonBeingServed,
        personEntityBeingServed: displayPersonBeingServed,
        courtName: displayCourtName,
        plaintiffPetitioner: displayPlaintiff,
        defendantRespondent: displayDefendant,
        serviceAddress: displayServiceAddress,
        serveAttempts: serves
      };

      console.log('Generating affidavit with data:', affidavitData);

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
          <div className="text-sm space-y-2 border rounded-md p-4 bg-accent/20">
            <p><strong>Court:</strong> {displayCourtName}</p>
            <p><strong>Plaintiff/Petitioner:</strong> {displayPlaintiff}</p>
            <p><strong>Defendant/Respondent:</strong> {displayDefendant}</p>
            <p><strong>Person/Entity Being Served:</strong> {displayPersonBeingServed}</p>
            <p><strong>Service Address:</strong> {displayServiceAddress}</p>
            <p><strong>Case Number:</strong> {displayCaseNumber}</p>
            <p><strong>Attempts:</strong> {serves.length}</p>
          </div>

          <p className="text-xs text-muted-foreground">
            All available information will be automatically filled in the affidavit form.
          </p>

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
