
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ServeAttempt, { ServeAttemptData } from "@/components/ServeAttempt";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

  useEffect(() => {
    if (clientId && caseNumber) {
      fetchAttemptCount(clientId, caseNumber);
    }
  }, [clientId, caseNumber]);

  const fetchAttemptCount = async (clientId: string, caseNumber: string) => {
    setIsLoading(true);
    try {
      const serveAttempts = await appwrite.getServeAttempts();
      const attemptsForCase = serveAttempts.filter(
        (attempt) => attempt.client_id === clientId && attempt.case_number === caseNumber
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
      if (!serveData.clientId || serveData.clientId === "unknown") {
        console.error("Invalid client ID detected:", serveData.clientId);
        throw new Error("Client ID is required.");
      }

      if (!serveData.caseName) {
        console.warn("Missing case name, setting to 'Unknown Case'");
        serveData.caseName = "Unknown Case";
      }

      // Ensure coordinates are properly formatted as string
      if (typeof serveData.coordinates !== 'string') {
        console.warn("Coordinates not properly formatted, setting to null");
        serveData.coordinates = null;
      }

      console.log("Final serve data being saved:", serveData);

      // Save the serve data
      addServe(serveData);

      toast({
        title: "Serve recorded",
        description: "Service attempt has been saved successfully",
        variant: "default",
      });

      navigate("/history");
    } catch (error) {
      console.error("Error saving serve attempt:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save serve attempt",
        variant: "destructive",
      });
    }
  };

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
