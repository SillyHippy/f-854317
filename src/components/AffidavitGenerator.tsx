
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download } from 'lucide-react';
import { generateAffidavitPDF, AffidavitData } from '@/utils/pdfGenerator';
import { ServeAttemptData } from '@/components/ServeAttempt';
import { ClientData } from '@/components/ClientForm';
import { useToast } from '@/hooks/use-toast';
import { appwrite } from '@/lib/appwrite';

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
  const [caseData, setCaseData] = useState<any>(null);
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const { toast } = useToast();

  // Extract data from serves
  const firstServe = serves[0];
  const actualCaseNumber = caseNumber || firstServe?.caseNumber || 'Case number not available';

  // Fetch case data when dialog opens
  useEffect(() => {
    if (isOpen && actualCaseNumber && actualCaseNumber !== 'Case number not available') {
      fetchCaseData();
    }
  }, [isOpen, actualCaseNumber]);

  const fetchCaseData = async () => {
    setIsLoadingCase(true);
    try {
      console.log('Fetching case data for case number:', actualCaseNumber);
      const cases = await appwrite.getClientCases(client.id || '');
      const matchingCase = cases.find(c => c.case_number === actualCaseNumber);
      
      if (matchingCase) {
        console.log('Found matching case:', matchingCase);
        setCaseData(matchingCase);
      } else {
        console.log('No matching case found for case number:', actualCaseNumber);
        setCaseData(null);
      }
    } catch (error) {
      console.error('Error fetching case data:', error);
      setCaseData(null);
    } finally {
      setIsLoadingCase(false);
    }
  };

  // Use case data if available, otherwise fall back to props or defaults
  const displayCourtName = caseData?.court_name || courtName || 'Court information not available';
  const displayPlaintiff = caseData?.plaintiff_petitioner || plaintiffPetitioner || 'Plaintiff information not available';
  const displayDefendant = caseData?.defendant_respondent || defendantRespondent || 'Defendant information not available';
  const displayPersonBeingServed = caseName || firstServe?.caseName || 'Person being served not specified';
  const displayServiceAddress = firstServe?.serviceAddress || firstServe?.address || 'Service address not available';

  console.log('AffidavitGenerator data:', {
    courtName: displayCourtName,
    plaintiffPetitioner: displayPlaintiff,
    defendantRespondent: displayDefendant,
    personBeingServed: displayPersonBeingServed,
    serviceAddress: displayServiceAddress,
    caseNumber: actualCaseNumber,
    caseData,
    firstServe
  });

  const handleGenerateAffidavit = async () => {
    setIsGenerating(true);
    
    try {
      const affidavitData: AffidavitData = {
        clientName: client.name,
        clientAddress: client.address,
        caseNumber: actualCaseNumber,
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
          {isLoadingCase ? (
            <div className="text-sm text-muted-foreground">Loading case data...</div>
          ) : (
            <div className="text-sm space-y-2 border rounded-md p-4 bg-accent/20">
              <p><strong>Court:</strong> {displayCourtName}</p>
              <p><strong>Plaintiff/Petitioner:</strong> {displayPlaintiff}</p>
              <p><strong>Defendant/Respondent:</strong> {displayDefendant}</p>
              <p><strong>Person/Entity Being Served:</strong> {displayPersonBeingServed}</p>
              <p><strong>Service Address:</strong> {displayServiceAddress}</p>
              <p><strong>Case Number:</strong> {actualCaseNumber}</p>
              <p><strong>Attempts:</strong> {serves.length}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            All available information will be automatically filled in the affidavit form.
          </p>

          <Button 
            onClick={handleGenerateAffidavit} 
            disabled={isGenerating || isLoadingCase}
            className="w-full"
          >
            {isGenerating ? (
              "Generating..."
            ) : isLoadingCase ? (
              "Loading..."
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
