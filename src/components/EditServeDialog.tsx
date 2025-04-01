
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ServeAttemptData } from "./ServeAttempt";
import { ClientData } from "./ClientForm";

interface EditServeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serveData: ServeAttemptData;
  onUpdate: (updatedData: ServeAttemptData) => void;
  onDelete: (id: string) => void;
  clients: ClientData[];
}

const statusOptions = [
  { value: 'attempted', label: 'Attempted' },
  { value: 'served', label: 'Served' },
  { value: 'not-served', label: 'Not Served' },
];

export default function EditServeDialog({ 
  open, 
  onOpenChange, 
  serveData, 
  onUpdate, 
  onDelete,
  clients 
}: EditServeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      id: serveData.id,
      clientId: serveData.clientId,
      date: serveData.timestamp,
      time: format(serveData.timestamp, 'HH:mm'),
      notes: serveData.notes || '',
      status: serveData.status || 'attempted',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        id: serveData.id,
        clientId: serveData.clientId,
        date: serveData.timestamp,
        time: format(serveData.timestamp, 'HH:mm'),
        notes: serveData.notes || '',
        status: serveData.status || 'attempted',
      });
    }
  }, [open, serveData, form]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const [hours, minutes] = data.time.split(':').map(Number);
      const timestamp = new Date(data.date);
      timestamp.setHours(hours, minutes, 0, 0);
      
      const updatedServe: ServeAttemptData = {
        ...serveData,
        notes: data.notes,
        status: data.status,
        timestamp,
      };
      
      await onUpdate(updatedServe);
      console.error("Serve updated successfully");
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating serve:", err);
      setError(err instanceof Error ? err.message : "Failed to update serve attempt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(serveData.id);
      onOpenChange(false);
    } catch (err) {
      console.error("Error deleting serve:", err);
      setError(err instanceof Error ? err.message : "Failed to delete serve attempt");
    } finally {
      setIsDeleting(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Attempt</DialogTitle>
          <DialogDescription>
            Update the details of this service attempt for {getClientName(serveData.clientId)}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
              >
                {isDeleting ? "Deleting..." : "Delete Serve"}
              </Button>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting || isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting || isDeleting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
