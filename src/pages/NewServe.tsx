
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ServeAttempt, { ServeAttemptData } from "@/components/ServeAttempt";
import AffidavitGenerationDialog from "@/components/AffidavitGenerationDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { appwrite } from "@/lib/appwrite";
import { toast } from "@/hooks/use-toast";
import { isGeolocationCoordinates } from "@/utils/gps";
import { ClientData } from '@/components/ClientForm';

interface NewServeProps {
  clients: any[];
  addServe: (serve: ServeAttemptData) => void;
}

const NewServe: React.FC<NewServeProps> = ({ clients, addServe }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("clientId");
  const caseNumber = searchParams.get("caseNumber");

  const [caseAttempts, setCaseAttempts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [completedServe, setCompletedServe] = useState<ServeAttemptData | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [showAffidavitDialog, setShowAffidavitDialog] = useState(false);

  useEffect(() => {
    if (clientId && caseNumber) {
      fetchAttemptCount(clientId, caseNumber);
    }
  }, [clientId, caseNumber]);

  const fetchAttemptCount = async (clientId: string, caseNumber: string) => {
    setIsLoading(true);
    try {
      const serveAttempts = await appwrite.getClientServeAttempts(clientId);
      const attemptsForCase = serveAttempts.filter(
        (attempt) => attempt.case_number === caseNumber
      );
      setCaseAttempts(attemptsForCase.length);
    } catch (error) {
      console.error("Error fetching serve attempts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch serve attempts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleServeComplete = async (serveData: ServeAttemptData) => {
    console.log("Serve complete, data:", serveData);

    try {
      // Ensure all required fields are present
      if (!serveData.clientId || !serveData.imageData) {
        throw new Error("Missing required fields: clientId or imageData.");
      }

      // Save the serve data
      const savedServe = await appwrite.createServeAttempt(serveData);
      console.log("Serve attempt saved successfully:", savedServe);

      // Find the client data
      const client = clients.find(c => c.id === serveData.clientId);
      if (client) {
        setSelectedClient(client);
        setCompletedServe(serveData);
      }

      toast({
        title: "Serve recorded",
        description: "Service attempt has been saved successfully.",
        variant: "default",
      });

      // Show success state with affidavit option
    } catch (error) {
      console.error("Error saving serve attempt:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save serve attempt.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAffidavit = () => {
    if (completedServe && selectedClient) {
      setShowAffidavitDialog(true);
    }
  };

  // Success state after serve is completed
  if (completedServe && selectedClient) {
    return (
      <div className="page-container">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-2"
            onClick={() => navigate("/history")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            View History
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Serve Completed!</h1>
          <p className="text-muted-foreground">
            Your serve attempt has been successfully recorded
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <div className="p-6 rounded-lg border bg-green-50 border-green-200">
            <h3 className="font-medium text-green-900 mb-2">Success!</h3>
            <p className="text-sm text-green-700 mb-4">
              Serve attempt for {selectedClient.name} has been saved with photo evidence and GPS location.
            </p>
            
            <div className="space-y-2 text-xs text-green-600">
              <p><strong>Case:</strong> {completedServe.caseName || completedServe.caseNumber}</p>
              <p><strong>Status:</strong> {completedServe.status}</p>
              <p><strong>Time:</strong> {new Date(completedServe.timestamp).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleGenerateAffidavit}
              className="w-full"
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Affidavit PDF
            </Button>
            
            <Button 
              onClick={() => navigate("/new-serve")}
              className="w-full"
            >
              Create Another Serve
            </Button>
            
            <Button 
              onClick={() => navigate("/history")}
              className="w-full"
              variant="outline"
            >
              View All History
            </Button>
          </div>
        </div>

        {showAffidavitDialog && (
          <AffidavitGenerationDialog
            open={showAffidavitDialog}
            onOpenChange={setShowAffidavitDialog}
            serveData={completedServe}
            clientData={selectedClient}
          />
        )}
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">New Serve Attempt</h1>
        <p className="text-muted-foreground">
          Create a new serve record with photo evidence and GPS location
        </p>
        {caseAttempts > 0 && (
          <p className="text-sm bg-primary/10 text-primary mt-2 p-1 px-2 rounded-full inline-block">
            Attempt #{caseAttempts + 1}
          </p>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-lg font-medium mb-2">No clients found</h2>
          <p className="text-muted-foreground mb-4">
            You need to add a client before creating a serve attempt.
          </p>
          <Button onClick={() => navigate("/clients")}>
            Add Client
          </Button>
        </div>
      ) : (
        <ServeAttempt
          clients={clients}
          onComplete={handleServeComplete}
          previousAttempts={caseAttempts}
        />
      )}
    </div>
  );
};

export default NewServe;
