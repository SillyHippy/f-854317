
import React, { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CameraComponent from "./Camera";
import { embedGpsIntoImage, formatCoordinates } from "@/utils/gps";
import { useToast } from "@/components/ui/use-toast";
import { Camera, AlertCircle, CheckCircle, Loader2, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import PhysicalDescriptionForm, { PhysicalDescriptionData } from "./PhysicalDescriptionForm";
import { ServeAttemptData } from "@/types/ServeAttemptData";
import { ClientData } from "./ClientForm";
import { useServeAttempt } from "@/hooks/useServeAttempt";
import ClientSelector from "./serve/ClientSelector";
import CaseSelector from "./serve/CaseSelector";
import AddressSelector from "./serve/AddressSelector";
import SearchableAddressList from "./serve/SearchableAddressList";

interface ServeAttemptProps {
  clients: ClientData[];
  onComplete: (data: ServeAttemptData) => void;
  previousAttempts?: number;
}

const ServeAttempt: React.FC<ServeAttemptProps> = ({ 
  clients, 
  onComplete,
  previousAttempts = 0
}) => {
  const [step, setStep] = useState<"select" | "capture" | "confirm">("select");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [physicalDescription, setPhysicalDescription] = useState<PhysicalDescriptionData | undefined>();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const {
    form,
    selectedClient,
    selectedCase,
    clientCases,
    filteredCases,
    caseAttemptCount,
    addressSearchTerm,
    addressSearchOpen,
    isLoadingCases,
    setAddressSearchTerm,
    setAddressSearchOpen,
    handleClientChange,
    handleCaseChange,
    handleAddressSelect,
  } = useServeAttempt(clients);

  const handleCameraCapture = async (imageData: string, coords: GeolocationCoordinates) => {
    setCapturedImage(imageData);
    setLocation(coords);
    setStep("confirm");
  };

  const handlePhysicalDescriptionSave = (data: PhysicalDescriptionData) => {
    setPhysicalDescription(data);
  };

  const formatPhysicalDescription = (desc: PhysicalDescriptionData): string => {
    const parts: string[] = [];
    if (desc.age) parts.push(`Age: ${desc.age}`);
    if (desc.sex) parts.push(`Sex: ${desc.sex}`);
    if (desc.race) parts.push(`Race: ${desc.race}`);
    if (desc.height) parts.push(`Height: ${desc.height}`);
    if (desc.weight) parts.push(`Weight: ${desc.weight}`);
    if (desc.hair) parts.push(`Hair: ${desc.hair}`);
    if (desc.beard) parts.push(`Beard: ${desc.beard}`);
    if (desc.glasses) parts.push(`Glasses: ${desc.glasses}`);
    return parts.join(', ');
  };

  const handleSubmit = async (data: any) => {
    if (!capturedImage || !location || !selectedClient || !selectedCase) {
      console.error("Missing required information. Please try again.");
      toast({
        title: "Missing Information",
        description: "Required information is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const imageWithGPS = embedGpsIntoImage(capturedImage, location);

      let finalNotes = data.notes || "";
      if (physicalDescription && data.status === "completed") {
        const descText = formatPhysicalDescription(physicalDescription);
        if (descText) {
          finalNotes = finalNotes ? `${finalNotes}\n\nPhysical Description: ${descText}` : `Physical Description: ${descText}`;
        }
      }

      const serveData: ServeAttemptData = {
        client_id: selectedClient.id,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientEmail: selectedClient.email || "",
        case_number: selectedCase.caseNumber,
        caseNumber: selectedCase.caseNumber,
        case_name: selectedCase.caseName || "Unknown Case",
        caseName: selectedCase.caseName || "Unknown Case",
        personEntityBeingServed: selectedCase.personEntityBeingServed || selectedCase.caseName || "",
        imageData: imageWithGPS,
        coordinates: `${location.latitude},${location.longitude}`,
        address: selectedCase.homeAddress || selectedCase.workAddress || selectedClient.address || "No address available",
        serviceAddress: data.serviceAddress,
        notes: finalNotes,
        timestamp: new Date(),
        status: data.status,
        attemptNumber: caseAttemptCount + 1,
        physicalDescription,
      };

      await onComplete(serveData);

      form.reset();
      setCapturedImage(null);
      setLocation(null);
      setPhysicalDescription(undefined);
      setStep("select");
    } catch (error) {
      console.error("Error saving serve attempt:", error);
      toast({
        title: "Error",
        description: "Failed to save serve attempt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const isCaseSelected = !!form.watch("caseNumber");
  const isSuccessfulServe = form.watch("status") === "completed";

  return (
    <div className="animate-slide-in w-full max-w-md mx-auto">
      {step === "select" && (
        <Card className="neo-card mb-6">
          <CardHeader>
            <CardTitle>New Serve Attempt</CardTitle>
            <CardDescription>
              Select a client and case to begin
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form className="space-y-4">
                <SearchableAddressList
                  filteredCases={filteredCases}
                  addressSearchTerm={addressSearchTerm}
                  addressSearchOpen={addressSearchOpen}
                  isLoadingCases={isLoadingCases}
                  isMobile={isMobile}
                  onSearchTermChange={setAddressSearchTerm}
                  onSearchOpenChange={setAddressSearchOpen}
                  onAddressSelect={handleAddressSelect}
                />

                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-2 text-xs text-muted-foreground">
                      OR SELECT CLIENT DIRECTLY
                    </span>
                  </div>
                </div>

                <ClientSelector
                  clients={clients}
                  selectedClient={selectedClient}
                  onClientChange={handleClientChange}
                  form={form}
                />

                {selectedClient && (
                  <CaseSelector
                    clientCases={clientCases}
                    selectedCase={selectedCase}
                    onCaseChange={handleCaseChange}
                    form={form}
                  />
                )}
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => setStep("capture")}
              disabled={!isCaseSelected}
            >
              <Camera className="w-4 h-4 mr-2" />
              Continue to Camera
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === "capture" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Capture Photo</h3>
            <Button 
              variant="ghost"
              onClick={() => setStep("select")}
              size="sm"
            >
              Back
            </Button>
          </div>
          
          <CameraComponent onCapture={handleCameraCapture} />
          <p className="text-sm text-muted-foreground text-center">
            The photo will automatically include GPS location data
          </p>
        </div>
      )}

      {step === "confirm" && capturedImage && location && (
        <Card className="neo-card">
          <CardHeader>
            <CardTitle>Complete Serve Attempt</CardTitle>
            <CardDescription>
              Submit details to complete the serve attempt
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {selectedClient && (
                  <div className="mb-4">
                    <p className="text-sm font-medium">Client: {selectedClient.name}</p>
                    <p className="text-xs text-muted-foreground">Address: {selectedClient.address}</p>
                    {selectedCase && selectedCase.personEntityBeingServed && (
                      <>
                        <p className="text-xs text-muted-foreground">Person/Entity: {selectedCase.personEntityBeingServed}</p>
                        <p className="text-xs bg-primary/10 text-primary mt-1 p-1 px-2 rounded-full inline-block">
                          Attempt #{caseAttemptCount + 1}
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div className="rounded-md overflow-hidden mb-4 border">
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full aspect-[4/3] object-cover" 
                  />
                </div>
                
                <div className="p-3 rounded-md bg-accent/50 text-xs space-y-1 mb-4">
                  <div className="font-medium">Location Data:</div>
                  <div className="text-muted-foreground">
                    GPS: {formatCoordinates(location.latitude, location.longitude)}
                  </div>
                  <div className="text-muted-foreground">
                    Accuracy: ±{Math.round(location.accuracy)}m
                  </div>
                </div>

                <AddressSelector
                  selectedCase={selectedCase}
                  form={form}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">
                              <div className="flex items-center">
                                <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-500" />
                                Successful Serve
                              </div>
                            </SelectItem>
                            <SelectItem value="failed">
                              <div className="flex items-center">
                                <AlertCircle className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                Failed Attempt
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isSuccessfulServe && (
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Details about this serve attempt..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setStep("capture")}
                    className="flex-1"
                    disabled={isSending}
                  >
                    Retake Photo
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : "Complete & Send"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServeAttempt;
