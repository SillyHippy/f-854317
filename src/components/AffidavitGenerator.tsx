
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [formData, setFormData] = useState({
    processServerName: '',
    processServerAddress: '',
    notaryName: '',
    notaryCommissionExpires: ''
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateAffidavit = async () => {
    if (!formData.processServerName || !formData.processServerAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in the process server name and address.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const affidavitData: AffidavitData = {
        clientName: client.name,
        clientAddress: client.address,
        caseNumber: caseNumber || 'N/A',
        caseName: caseName,
        serveAttempts: serves,
        processServerName: formData.processServerName,
        processServerAddress: formData.processServerAddress,
        notaryName: formData.notaryName || undefined,
        notaryCommissionExpires: formData.notaryCommissionExpires || undefined
      };

      await generateAffidavitPDF(affidavitData);
      
      toast({
        title: "Affidavit Generated",
        description: "The affidavit PDF has been downloaded successfully.",
        variant: "success"
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
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Generate Affidavit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Affidavit of Service</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Case Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><strong>Client:</strong> {client.name}</p>
              <p><strong>Address:</strong> {client.address}</p>
              {caseNumber && <p><strong>Case:</strong> {caseNumber}</p>}
              {caseName && <p><strong>Case Name:</strong> {caseName}</p>}
              <p><strong>Attempts:</strong> {serves.length}</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div>
              <Label htmlFor="processServerName">Process Server Name *</Label>
              <Input
                id="processServerName"
                value={formData.processServerName}
                onChange={(e) => handleInputChange('processServerName', e.target.value)}
                placeholder="Enter process server name"
              />
            </div>

            <div>
              <Label htmlFor="processServerAddress">Process Server Address *</Label>
              <Textarea
                id="processServerAddress"
                value={formData.processServerAddress}
                onChange={(e) => handleInputChange('processServerAddress', e.target.value)}
                placeholder="Enter process server address"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notaryName">Notary Name (Optional)</Label>
              <Input
                id="notaryName"
                value={formData.notaryName}
                onChange={(e) => handleInputChange('notaryName', e.target.value)}
                placeholder="Enter notary name"
              />
            </div>

            <div>
              <Label htmlFor="notaryCommissionExpires">Notary Commission Expires (Optional)</Label>
              <Input
                id="notaryCommissionExpires"
                type="date"
                value={formData.notaryCommissionExpires}
                onChange={(e) => handleInputChange('notaryCommissionExpires', e.target.value)}
              />
            </div>
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
                Generate & Download Affidavit
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AffidavitGenerator;
