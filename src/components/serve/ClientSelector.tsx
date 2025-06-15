
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Mail, ExternalLink } from "lucide-react";
import { ClientData } from "../ClientForm";

interface ClientSelectorProps {
  clients: ClientData[];
  selectedClient: ClientData | null;
  onClientChange: (clientId: string) => void;
  form: any;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClient,
  onClientChange,
  form
}) => {
  const getMapLink = (address: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const handleAddressClick = (address: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <FormField
        control={form.control}
        name="clientId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Client</FormLabel>
            <FormControl>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  onClientChange(value);
                }}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id || ""}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedClient && (
        <div className="space-y-2 p-3 rounded-md bg-accent/50">
          <p className="text-sm font-medium">{selectedClient.name}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> 
            <a 
              href={getMapLink(selectedClient.address)}
              className="hover:underline text-primary flex items-center gap-1"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleAddressClick(selectedClient.address, e)}
            >
              {selectedClient.address}
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" /> 
            {selectedClient.email}
          </p>
        </div>
      )}
    </>
  );
};

export default ClientSelector;
