
import React, { useState, useEffect } from "react";
import PaginatedServeHistory from "@/components/PaginatedServeHistory";
import { ClientData } from "@/components/ClientForm";
import { ServeAttemptData } from "@/components/ServeAttempt";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditServeDialog from "@/components/EditServeDialog";
import { useOptimizedServes } from "@/hooks/useOptimizedServes";
import ErrorBoundary from "@/components/ErrorBoundary";

interface HistoryProps {
  serves: ServeAttemptData[];
  clients: ClientData[];
  deleteServe: (id: string) => Promise<boolean>;
  updateServe: (serve: ServeAttemptData) => Promise<boolean>;
}

const History: React.FC<HistoryProps> = ({ 
  serves: propsServes, 
  clients, 
  deleteServe,
  updateServe
}) => {
  const [selectedServe, setSelectedServe] = useState<ServeAttemptData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Use optimized serves hook with higher limit for history page
  const {
    serves: optimizedServes,
    isLoading,
    error,
    refreshServes,
    lastSync,
    totalCount
  } = useOptimizedServes({ 
    limit: 100, // Load more for history page
    autoSync: false // Disable auto-sync to prevent performance issues
  });

  // Use optimized serves if available, otherwise fall back to props
  const servesToDisplay = optimizedServes.length > 0 ? optimizedServes : propsServes;

  const handleRefresh = async () => {
    try {
      await refreshServes();
      toast({
        title: "History Refreshed",
        description: "Serve history has been updated with the latest data."
      });
    } catch (error) {
      console.error("Error refreshing history:", error);
      toast({
        title: "Error",
        description: "Failed to refresh serve history.",
        variant: "destructive",
      });
    }
  };

  const handleEditServe = (serve: ServeAttemptData) => {
    setSelectedServe(serve);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteServe(id);
      if (success) {
        toast({
          title: "Success",
          description: "Serve attempt has been deleted",
          variant: "default"
        });
        
        // Refresh the optimized data
        await refreshServes();
      } else {
        throw new Error("Failed to delete serve attempt");
      }
    } catch (error) {
      console.error("Error deleting serve attempt:", error);
      toast({
        title: "Error",
        description: "Failed to delete serve attempt",
        variant: "destructive"
      });
    }
  };

  if (error) {
    return (
      <div className="page-container">
        <div className="text-center p-8">
          <p className="text-destructive mb-4">Error loading serve history: {error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="page-container">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Serve History</h1>
          <div className="flex gap-2 items-center">
            {lastSync && (
              <span className="text-xs text-muted-foreground">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-muted-foreground">
            View your serve history and outcomes ({totalCount} total serves)
          </p>
        </div>

        {isLoading && servesToDisplay.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="mb-2 text-xl font-semibold">Loading serve history...</h3>
            <p className="text-muted-foreground">Please wait while we fetch your data</p>
          </div>
        ) : servesToDisplay.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <HistoryIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">No serve history yet</h3>
            <p className="mb-6 text-muted-foreground">
              Create your first serve attempt to see your history here
            </p>
            <Button onClick={() => window.location.href = "/new-serve"}>
              Create Serve Attempt
            </Button>
          </div>
        ) : (
          <PaginatedServeHistory 
            serves={servesToDisplay} 
            clients={clients} 
            onDelete={handleDelete}
            onEdit={handleEditServe}
            itemsPerPage={12}
          />
        )}

        {selectedServe && (
          <EditServeDialog
            serve={selectedServe}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSave={updateServe}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default History;
