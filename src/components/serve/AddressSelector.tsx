
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ClientCase {
  caseNumber: string;
  caseName?: string;
  homeAddress?: string;
  workAddress?: string;
  clientId?: string;
  clientName?: string;
  personEntityBeingServed?: string;
}

interface AddressSelectorProps {
  selectedCase: ClientCase | null;
  form: any;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  selectedCase,
  form
}) => {
  const handleAddressTypeChange = (value: string) => {
    form.setValue("addressType", value);
    
    if (value === "home" && selectedCase?.homeAddress) {
      form.setValue("serviceAddress", selectedCase.homeAddress);
    } else if (value === "work" && selectedCase?.workAddress) {
      form.setValue("serviceAddress", selectedCase.workAddress);
    } else if (value === "custom") {
      form.setValue("serviceAddress", "");
    }
  };

  const addressType = form.watch("addressType");

  return (
    <FormField
      control={form.control}
      name="serviceAddress"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Service Address (Optional)</FormLabel>
          <FormControl>
            <div className="space-y-3">
              <Input 
                placeholder="Enter the actual service address (optional)"
                {...field}
              />
              
              {(selectedCase?.homeAddress || selectedCase?.workAddress) && (
                <FormField
                  control={form.control}
                  name="addressType"
                  render={({ field: addressTypeField }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={handleAddressTypeChange}
                          value={addressTypeField.value || "custom"}
                          className="space-y-2"
                        >
                          {selectedCase?.homeAddress && (
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="home" id="home" />
                              <Label htmlFor="home" className="text-sm cursor-pointer flex-1">
                                Use Home Address: {selectedCase.homeAddress}
                              </Label>
                            </div>
                          )}
                          {selectedCase?.workAddress && (
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="work" id="work" />
                              <Label htmlFor="work" className="text-sm cursor-pointer flex-1">
                                Use Work Address: {selectedCase.workAddress}
                              </Label>
                            </div>
                          )}
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AddressSelector;
