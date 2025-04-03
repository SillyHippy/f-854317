
import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServeAttemptData } from "@/components/ServeAttempt";
import { ClientData } from "@/components/ClientForm";
import { appwrite } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  clients: ClientData[];
  serves: ServeAttemptData[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, serves }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [serveAttempts, setServeAttempts] = useState<ServeAttemptData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (date) {
      const selectedDate = new Date(date);
      const filteredServes = serves.filter((serve) => {
        const serveDate = new Date(serve.timestamp);
        return (
          serveDate.getFullYear() === selectedDate.getFullYear() &&
          serveDate.getMonth() === selectedDate.getMonth() &&
          serveDate.getDate() === selectedDate.getDate()
        );
      });
      setServeAttempts(filteredServes);
    }
  }, [date, serves]);

  const getClientName = (clientId: string): string => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const saveServe = async (updatedServe: ServeAttemptData): Promise<boolean> => {
    try {
      await updateServe(updatedServe);
      return true;
    } catch (error) {
      console.error("Error updating serve:", error);
      return false;
    }
  };

  const updateServe = async (serveData: ServeAttemptData) => {
    try {
      // Create a proper payload with converted timestamp
      const timestamp = serveData.timestamp ? 
        (serveData.timestamp instanceof Date ? 
          serveData.timestamp : 
          new Date(serveData.timestamp)) : 
        new Date();
      
      // Prepare the payload without relying on timestamp methods
      const payload = {
        client_id: serveData.clientId,
        case_number: serveData.caseNumber || null,
        case_name: serveData.caseName || "Unknown Case",
        status: serveData.status || "unknown",
        notes: serveData.notes || "",
        coordinates: serveData.coordinates || null,
        image_data: serveData.imageData || null,
        timestamp: timestamp.toISOString(),
        attempt_number: serveData.attemptNumber || 1
      };

      const updatedServe = await appwrite.updateServeAttempt(serveData.id, payload);

      // Ensure the `id` field is preserved
      const formattedServe = {
        id: serveData.id,
        ...updatedServe,
        timestamp: timestamp
      };

      return formattedServe;
    } catch (error) {
      console.error("Error updating serve attempt:", error);
      toast({
        title: "Error updating serve attempt",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Custom calendar components
  const CustomCaption = ({ displayMonth, onPreviousClick, onNextClick }: any) => (
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground">
        {format(displayMonth, "MMMM yyyy")}
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onPreviousClick}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Go to previous month</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onNextClick}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Go to next month</span>
        </Button>
      </div>
    </div>
  );

  const CustomRow = ({ children }: { children: React.ReactNode }) => (
    <div className="flex w-full mt-2">{children}</div>
  );

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Overview of today's serve attempts</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              components={{
                Caption: CustomCaption,
                Row: CustomRow
              }}
            />
          </div>
          <div>
            <h3 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
              Serve Attempts for {date ? format(date, "PPP") : "Select a Date"}
            </h3>
            {serveAttempts.length === 0 ? (
              <p>No serve attempts for this date.</p>
            ) : (
              <div className="divide-y divide-border rounded-md border">
                {serveAttempts.map((serve) => (
                  <div key={serve.id} className="grid items-center gap-4 p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{getClientName(serve.clientId)}</p>
                      <p className="text-sm text-muted-foreground">Case: {serve.caseNumber || "N/A"}</p>
                    </div>
                    <div className="ml-auto font-medium">
                      <Badge 
                        variant={serve.status === "completed" ? "default" : "outline"}
                        className={`${
                          serve.status === "completed" ? "bg-green-100 text-green-800" : 
                          "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {serve.status === "completed" ? "Completed" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
