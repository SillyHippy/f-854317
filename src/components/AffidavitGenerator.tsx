
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
}

const AffidavitGenerator: React.FC<AffidavitGeneratorProps> = ({
  client,
  serves,
  caseNumber,
  caseName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateAffidavit = async () => {
    setIsGenerating(true);
    
    try {
      // Get person/entity being served from the first serve attempt
      const personEntityBeingServed = serves[0]?.personEntityBeingServed || caseName || 'Unknown';

      const affidavitData: AffidavitData = {
        clientName: client.name,
        clientAddress: client.address,
        caseNumber: caseNumber || '',
        caseName: caseName || undefined,
        personEntityBeingServed: personEntityBeingServed,
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
          <div className="text-sm space-y-2 border rounded-md p-4 bg-accent/20">
            <p><strong>Person/Entity Being Served:</strong> {serves[0]?.personEntityBeingServed || caseName || 'Unknown'}</p>
            <p><strong>Service Address:</strong> {serves[0]?.serviceAddress || client.address}</p>
            <p><strong>Case Number:</strong> {caseNumber || 'N/A'}</p>
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
