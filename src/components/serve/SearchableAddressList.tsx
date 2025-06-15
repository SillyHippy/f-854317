
import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search } from "lucide-react";

interface ClientCase {
  caseNumber: string;
  caseName?: string;
  homeAddress?: string;
  workAddress?: string;
  clientId?: string;
  clientName?: string;
  personEntityBeingServed?: string;
}

interface SearchableAddressListProps {
  filteredCases: ClientCase[];
  addressSearchTerm: string;
  addressSearchOpen: boolean;
  isLoadingCases: boolean;
  isMobile: boolean;
  onSearchTermChange: (term: string) => void;
  onSearchOpenChange: (open: boolean) => void;
  onAddressSelect: (caseItem: ClientCase) => void;
}

const SearchableAddressList: React.FC<SearchableAddressListProps> = ({
  filteredCases,
  addressSearchTerm,
  addressSearchOpen,
  isLoadingCases,
  isMobile,
  onSearchTermChange,
  onSearchOpenChange,
  onAddressSelect
}) => {
  return (
    <div className="space-y-2 mb-4">
      <p className="text-sm font-medium">Search by address across all cases</p>
      <Popover open={addressSearchOpen} onOpenChange={onSearchOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={addressSearchOpen}
            className="w-full justify-between text-left relative"
          >
            {addressSearchTerm || "Search addresses, cases, or clients..."}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`${isMobile ? 'w-screen max-w-[calc(100vw-2rem)]' : 'w-[300px]'} p-0`}>
          <Command>
            <CommandInput
              placeholder="Search address, case, or client..."
              value={addressSearchTerm}
              onValueChange={onSearchTermChange}
            />
            <CommandEmpty>
              {isLoadingCases ? "Loading cases..." : "No cases found."}
            </CommandEmpty>
            <CommandList className="max-h-[300px]">
              <CommandGroup heading="Cases">
                {filteredCases.map((caseItem) => (
                  <CommandItem
                    key={`${caseItem.clientId}-${caseItem.caseNumber}`}
                    value={`${caseItem.caseNumber}-${caseItem.homeAddress}-${caseItem.workAddress}`}
                    onSelect={() => onAddressSelect(caseItem)}
                  >
                    <div className="flex flex-col w-full">
                      <span className="font-medium">
                        {caseItem.personEntityBeingServed || caseItem.caseName || caseItem.caseNumber}
                      </span>
                      {caseItem.clientName && (
                        <span className="text-xs text-muted-foreground truncate">
                          Client: {caseItem.clientName}
                        </span>
                      )}
                      {caseItem.homeAddress && (
                        <span className="text-xs text-muted-foreground truncate">
                          Home: {caseItem.homeAddress}
                        </span>
                      )}
                      {caseItem.workAddress && (
                        <span className="text-xs text-muted-foreground truncate">
                          Work: {caseItem.workAddress}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SearchableAddressList;
