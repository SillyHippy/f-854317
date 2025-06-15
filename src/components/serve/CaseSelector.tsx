
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, ExternalLink } from "lucide-react";

interface ClientCase {
  caseNumber: string;
  caseName?: string;
  homeAddress?: string;
  workAddress?: string;
  clientId?: string;
  clientName?: string;
  personEntityBeingServed?: string;
}

interface CaseSelectorProps {
  clientCases: ClientCase[];
  selectedCase: ClientCase | null;
  onCaseChange: (caseNumber: string) => void;
  form: any;
}

const CaseSelector: React.FC<CaseSelectorProps> = ({
  clientCases,
  selectedCase,
  onCaseChange,
  form
}) => {
  const getMapLink = (address: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const handleAddressClick = (address: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank', 'noopener,noreferrer');
  };

  if (clientCases.length === 0) {
    return (
      <div className="text-sm text-center p-3 bg-accent/30 rounded-md">
        <p className="text-muted-foreground">No cases found for this client.</p>
        <p className="text-xs text-muted-foreground mt-1">Please select a different client or add cases first.</p>
      </div>
    );
  }

  return (
    <>
      <FormField
        control={form.control}
        name="caseNumber"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel>Case</FormLabel>
            <FormControl>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  onCaseChange(value);
                }}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {clientCases.map(c => (
                    <SelectItem key={c.caseNumber} value={c.caseNumber}>
                      {c.caseNumber} - {c.personEntityBeingServed || c.caseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedCase && (selectedCase.homeAddress || selectedCase.workAddress) && (
        <div className="space-y-2 p-3 rounded-md bg-accent/20">
          {selectedCase.homeAddress && (
            <div className="space-y-1">
              <p className="text-xs font-medium">Home Address:</p>
              <a 
                href={getMapLink(selectedCase.homeAddress)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleAddressClick(selectedCase.homeAddress!, e)}
              >
                <MapPin className="h-3 w-3" />
                {selectedCase.homeAddress}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {selectedCase.workAddress && (
            <div className="space-y-1">
              <p className="text-xs font-medium">Work Address:</p>
              <a 
                href={getMapLink(selectedCase.workAddress)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleAddressClick(selectedCase.workAddress!, e)}
              >
                <MapPin className="h-3 w-3" />
                {selectedCase.workAddress}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CaseSelector;
