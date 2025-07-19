
import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ServeAttemptData } from '@/types/ServeAttemptData';
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { createUpdateNotificationEmail } from "@/utils/email"; // Add this import
import { appwrite } from "@/lib/appwrite";
import PhysicalDescriptionForm, { PhysicalDescriptionData } from "./PhysicalDescriptionForm";
import { User } from "lucide-react";

interface EditServeDialogProps {
  serve: ServeAttemptData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (serve: ServeAttemptData) => Promise<boolean>;
}

const EditServeDialog: React.FC<EditServeDialogProps> = ({ serve, open, onOpenChange, onSave }) => {
  const { toast } = useToast();
  // Only allow completed or failed status to match ServeAttemptData
  const [status, setStatus] = useState<"completed" | "failed">(serve.status === "completed" || serve.status === "failed" ? serve.status : "completed");
  const [notes, setNotes] = useState(serve.notes || "");
  const [updatedServe, setUpdatedServe] = useState<ServeAttemptData | null>(serve);
  const [isSaving, setIsSaving] = useState(false);
  const [physicalDescription, setPhysicalDescription] = useState<PhysicalDescriptionData | undefined>(() => {
    // Initialize physical description from existing serve data
    if (serve.age || serve.sex || serve.ethnicity || serve.height_feet || serve.height_inches || 
        serve.weight || serve.hair || serve.beard || serve.glasses) {
      return {
        age: serve.age || '',
        sex: serve.sex || '',
        ethnicity: serve.ethnicity || '',
        height_feet: serve.height_feet || '',
        height_inches: serve.height_inches || '',
        weight: serve.weight || '',
        hair: serve.hair || '',
        beard: serve.beard || '',
        glasses: serve.glasses || '',
      };
    }
    return undefined;
  });

  useEffect(() => {
    // Ensure status is always a valid value based on ServeAttemptData
    // Default to completed if status is unknown
    setStatus(serve.status === "completed" || serve.status === "failed" ? serve.status : "completed");
    setNotes(serve.notes || "");
    setUpdatedServe(serve);
  }, [serve]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!updatedServe) return;
    
    try {
      setIsSaving(true);
      
      // Create a proper payload with type-safe status
      const payload: ServeAttemptData = {
        ...updatedServe,
        status: status,
        notes: notes || "",
        // Include physical description fields
        age: physicalDescription?.age || '',
        sex: physicalDescription?.sex || '',
        ethnicity: physicalDescription?.ethnicity || '',
        height_feet: physicalDescription?.height_feet || '',
        height_inches: physicalDescription?.height_inches || '',
        weight: physicalDescription?.weight || '',
        hair: physicalDescription?.hair || '',
        beard: physicalDescription?.beard || '',
        glasses: physicalDescription?.glasses || '',
      };
      
      // Call the onSave function provided by the parent component
      const success = await onSave(payload);
      
      if (success) {
        // Send email notification about the update
        try {
          const emailBody = createUpdateNotificationEmail(
            payload.clientName || "Unknown Client",
            payload.caseNumber || "Unknown Case",
            new Date(),
            updatedServe.status || "unknown",
            status,
            notes,
            payload.caseName
          );

          // Prepare the email data
          const emailData = {
            to: [
              payload.clientEmail || "info@justlegalsolutions.org", 
              "info@justlegalsolutions.org" // Always include the business email
            ],
            subject: `Serve Attempt Updated - ${payload.caseNumber || "Unknown Case"}`,
            html: emailBody,
            imageData: payload.imageData // Include image data in the email payload
          };

          // Send the email notification
          await appwrite.sendEmailViaFunction(emailData);
          console.log("Update notification email sent successfully");
        } catch (emailError) {
          console.error("Error sending update notification email:", emailError);
          // Continue with the update even if email fails
        }

        toast({
          title: "Serve updated",
          description: "Serve attempt has been updated successfully"
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Error updating serve",
          description: "Failed to update serve attempt",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating serve:", error);
      toast({
        title: "Error updating serve",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhysicalDescriptionSave = (data: PhysicalDescriptionData) => {
    console.log("Physical description saved in edit dialog:", data);
    setPhysicalDescription(data);
  };

  const formatPhysicalDescription = (desc: PhysicalDescriptionData): string => {
    const parts: string[] = [];
    if (desc.age) parts.push(`Age: ${desc.age}`);
    if (desc.sex) parts.push(`Sex: ${desc.sex}`);
    if (desc.ethnicity) parts.push(`Ethnicity: ${desc.ethnicity}`);
    if (desc.height_feet && desc.height_inches) {
      parts.push(`Height: ${desc.height_feet}'${desc.height_inches}"`);
    } else if (desc.height_feet) {
      parts.push(`Height: ${desc.height_feet}'`);
    }
    if (desc.weight) parts.push(`Weight: ${desc.weight}`);
    if (desc.hair) parts.push(`Hair: ${desc.hair}`);
    if (desc.beard) parts.push(`Beard: ${desc.beard}`);
    if (desc.glasses) parts.push(`Glasses: ${desc.glasses}`);
    return parts.join(', ');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Serve Attempt</AlertDialogTitle>
          <AlertDialogDescription>
            Update the status and notes for this serve attempt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <select
              id="status"
              value={status}
              onChange={(e) => {
                // Type guard to ensure only valid values are set
                const newStatus = e.target.value;
                if (newStatus === "completed" || newStatus === "failed") {
                  setStatus(newStatus);
                }
              }}
              className="col-span-3 rounded-md border shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="completed">Successful</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] w-full"
              placeholder="Enter detailed notes about this serve attempt..."
            />
          </div>
          
          {status === "completed" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Physical Description (Optional)</Label>
              <PhysicalDescriptionForm 
                onSave={handlePhysicalDescriptionSave}
                initialData={physicalDescription}
              >
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full justify-start"
                  size="sm"
                >
                  <User className="w-4 h-4 mr-2" />
                  {physicalDescription && Object.values(physicalDescription).some(v => v && v.trim()) 
                    ? "Edit Physical Description" 
                    : "Add Physical Description"
                  }
                </Button>
              </PhysicalDescriptionForm>
              {physicalDescription && Object.values(physicalDescription).some(v => v && v.trim()) && (
                <div className="text-xs text-muted-foreground p-2 bg-accent/30 rounded">
                  {formatPhysicalDescription(physicalDescription)}
                </div>
              )}
            </div>
          )}
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isSaving} onClick={handleSubmit}>
            {isSaving ? "Saving..." : "Save"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditServeDialog;
