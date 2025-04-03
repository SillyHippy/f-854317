import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
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
import { UploadButton } from "@/utils/uploadthing";
import { useUploadThing } from "@/utils/uploadthing";
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { EditServeDialog } from "@/components/EditServeDialog";
import { ServeHistory } from "@/components/ServeHistory";

export interface ServeAttemptData {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  caseNumber: string;
  caseName?: string;
  timestamp: Date;
  status: string;
  notes: string;
  coordinates: string | { latitude: number; longitude: number } | null;
  imageData?: string | null;
  attemptNumber: number;
}

interface ServeAttemptProps {
  serve: ServeAttemptData;
  clients: any[];
  deleteServe: (serveId: string) => Promise<boolean>;
  updateServe: (serveData: ServeAttemptData) => Promise<boolean>;
}

export function ServeAttempt({ serve, clients, deleteServe, updateServe }: ServeAttemptProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ServeAttemptData>(serve);
  const [isEditing, setIsEditing] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setFormData(serve);
  }, [serve]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, status: checked ? "completed" : "failed" }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, timestamp: date }));
    }
  };

  const handleSliderChange = (value: number[]) => {
    setFormData(prev => ({ ...prev, attemptNumber: value[0] }));
  };

  const handleLocationClick = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError
      );
    } else {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleLocationSuccess = (position: GeolocationPosition) => {
    const coords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    
    // Format the coordinates as a string
    const coordStr = `${coords.lat},${coords.lng}`;
    setFormData(prev => ({ ...prev, coordinates: coordStr }));
    setIsLoading(false);
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    toast({
      title: "Error getting location",
      description: error.message,
      variant: "destructive",
    });
    setIsLoading(false);
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, imageData: url }));
  };

  const handleImageExpand = () => {
    setIsImageExpanded(!isImageExpanded);
  };

  const handleDelete = async () => {
    setIsDeleteDialogOpen(false);
    const success = await deleteServe(serve.id);
    if (success) {
      toast({
        title: "Serve deleted",
        description: "Service attempt has been removed",
        variant: "success",
      });
    } else {
      toast({
        title: "Error deleting serve",
        description: "Failed to delete service attempt",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setIsEditing(false);
    const success = await updateServe(formData);
    if (success) {
      toast({
        title: "Serve updated",
        description: "Service attempt has been updated",
        variant: "success",
      });
    } else {
      toast({
        title: "Error updating serve",
        description: "Failed to update service attempt",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Service Attempt for {serve.clientName}</CardTitle>
        <CardDescription>
          Details of service attempt on {formatDate(serve.timestamp)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="caseNumber">Case Number</Label>
            <Input
              type="text"
              id="caseNumber"
              name="caseNumber"
              value={formData.caseNumber || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="caseName">Case Name</Label>
            <Input
              type="text"
              id="caseName"
              name="caseName"
              value={formData.caseName || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="timestamp">Date and Time</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !formData.timestamp && "text-muted-foreground"
                )}
                disabled={!isEditing}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.timestamp ? (
                  format(new Date(formData.timestamp), "MMMM dd, yyyy h:mm a")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" side="bottom">
              <Calendar
                mode="single"
                selected={formData.timestamp}
                onSelect={handleDateChange}
                disabled={!isEditing}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              checked={formData.status === "completed"}
              onCheckedChange={handleCheckboxChange}
              disabled={!isEditing}
            />
            <span>{formData.status === "completed" ? "Completed" : "Failed"}</span>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes || ""}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="coordinates">Coordinates</Label>
            <div className="relative">
              <Input
                type="text"
                id="coordinates"
                name="coordinates"
                value={formData.coordinates ? (typeof formData.coordinates === 'string' ? formData.coordinates : `${formData.coordinates.latitude},${formData.coordinates.longitude}`) : ""}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              {isEditing && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={handleLocationClick}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Get Location"}
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="attemptNumber">Attempt Number</Label>
            <Slider
              defaultValue={[formData.attemptNumber || 1]}
              max={10}
              step={1}
              aria-label="Attempt Number"
              onChange={handleSliderChange}
              disabled={!isEditing}
            />
            <p className="text-sm text-muted-foreground">
              Attempt: {formData.attemptNumber}
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="image">Image</Label>
          {formData.imageData ? (
            <div className="relative">
              <img
                src={formData.imageData}
                alt="Serve Evidence"
                className="rounded-md cursor-pointer"
                onClick={handleImageExpand}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No image uploaded</p>
          )}
          {isEditing && (
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                // Do something with the response
                console.log("Files: ", res);
                if (res && res[0] && res[0].url) {
                  handleImageUpload(res[0].url);
                  toast({
                    title: "Image uploaded",
                    description: "Image has been uploaded successfully",
                    variant: "success",
                  });
                }
              }}
              onUploadError={(error) => {
                // Do something with the error.
                console.error("Error:", error);
                toast({
                  title: "Error uploading image",
                  description: error.message,
                  variant: "destructive",
                });
              }}
            />
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!isEditing ? (
          <>
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this serve attempt from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
