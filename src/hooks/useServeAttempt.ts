import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { appwrite } from "@/lib/appwrite";
import { getServeAttemptsCount } from "@/utils/appwriteStorage";
import { ClientData } from "@/components/ClientForm";
import { ServeAttemptData } from "@/types/ServeAttemptData";

interface ClientCase {
  caseNumber: string;
  caseName?: string;
  homeAddress?: string;
  workAddress?: string;
  clientId?: string;
  clientName?: string;
  personEntityBeingServed?: string;
}

const serveAttemptSchema = z.object({
  clientId: z.string().min(1, { message: "Please select a client" }),
  caseNumber: z.string().min(1, { message: "Please select a case" }),
  notes: z.string().optional(),
  status: z.enum(["completed", "failed"]),
  serviceAddress: z.string().optional(),
  addressType: z.enum(["home", "work", "custom"]).optional(),
});

type ServeFormValues = z.infer<typeof serveAttemptSchema>;

export const useServeAttempt = (clients: ClientData[]) => {
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [clientCases, setClientCases] = useState<ClientCase[]>([]);
  const [allCases, setAllCases] = useState<ClientCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<ClientCase | null>(null);
  const [caseAttemptCount, setCaseAttemptCount] = useState(0);
  const [addressSearchTerm, setAddressSearchTerm] = useState("");
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const { toast } = useToast();

  const form = useForm<ServeFormValues>({
    resolver: zodResolver(serveAttemptSchema),
    defaultValues: {
      clientId: "",
      caseNumber: "",
      notes: "",
      status: "completed",
      serviceAddress: "",
      addressType: "custom",
    },
  });

  const filteredCases = useMemo(() => {
    const casesToFilter = selectedClient ? clientCases : allCases;
    if (!addressSearchTerm.trim()) return casesToFilter;

    const lowerQuery = addressSearchTerm.toLowerCase();
    return casesToFilter.filter(
      (c) =>
        c.caseNumber?.toLowerCase().includes(lowerQuery) ||
        c.caseName?.toLowerCase().includes(lowerQuery) ||
        c.homeAddress?.toLowerCase().includes(lowerQuery) ||
        c.workAddress?.toLowerCase().includes(lowerQuery) ||
        c.clientName?.toLowerCase().includes(lowerQuery) ||
        c.personEntityBeingServed?.toLowerCase().includes(lowerQuery)
    );
  }, [addressSearchTerm, clientCases, allCases, selectedClient]);

  useEffect(() => {
    const fetchAllCases = async () => {
      setIsLoadingCases(true);
      try {
        const activeCases: ClientCase[] = [];

        for (const client of clients) {
          const clientCases = await appwrite.getClientCases(client.id);
          activeCases.push(
            ...clientCases.filter((caseItem) => caseItem.status !== "Closed").map((caseItem) => ({
              caseNumber: caseItem.case_number,
              caseName: caseItem.case_name,
              homeAddress: caseItem.home_address,
              workAddress: caseItem.work_address,
              clientId: client.id,
              clientName: client.name,
              personEntityBeingServed: caseItem.person_entity_being_served || caseItem.case_name,
            }))
          );
        }

        setAllCases(activeCases);
      } catch (error) {
        console.error("Error fetching all cases:", error);
        toast({
          title: "Error",
          description: "Failed to load cases",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCases(false);
      }
    };

    fetchAllCases();
  }, [clients, toast]);

  useEffect(() => {
    if (selectedClient?.id) {
      const fetchClientCases = async () => {
        setIsLoadingCases(true);
        try {
          const clientCases = await appwrite.getClientCases(selectedClient.id);
          const activeCases = clientCases
            .filter((caseItem) => caseItem.status !== "Closed")
            .map((caseItem) => ({
              caseNumber: caseItem.case_number,
              caseName: caseItem.case_name,
              homeAddress: caseItem.home_address,
              workAddress: caseItem.work_address,
              clientId: selectedClient.id,
              clientName: selectedClient.name,
              personEntityBeingServed: caseItem.person_entity_being_served || caseItem.case_name,
            }));

          setClientCases(activeCases);
        } catch (error) {
          console.error("Error fetching client cases:", error);
          toast({
            title: "Error",
            description: "Failed to load client cases",
            variant: "destructive",
          });
        } finally {
          setIsLoadingCases(false);
        }
      };

      fetchClientCases();
    } else {
      setClientCases([]);
    }
  }, [selectedClient, toast]);

  useEffect(() => {
    const updateAttemptCount = async () => {
      if (selectedClient?.id && selectedCase?.caseNumber) {
        const count = await getServeAttemptsCount(
          selectedClient.id, 
          selectedCase.caseNumber
        );
        setCaseAttemptCount(count);
      }
    };
    
    updateAttemptCount();
  }, [selectedClient, selectedCase]);

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setSelectedClient(client || null);
    form.setValue("clientId", clientId);
    form.setValue("caseNumber", "");
    form.setValue("serviceAddress", "");
    form.setValue("addressType", "custom");
    setSelectedCase(null);
    setAddressSearchTerm("");
  };

  const handleCaseChange = async (caseNumber: string) => {
    const caseItem = clientCases.find(c => c.caseNumber === caseNumber) || null;
    setSelectedCase(caseItem);
    form.setValue("caseNumber", caseNumber);
    
    // Reset address selection when case changes
    form.setValue("addressType", "custom");
    form.setValue("serviceAddress", "");
    
    if (selectedClient?.id) {
      const count = await getServeAttemptsCount(selectedClient.id, caseNumber);
      setCaseAttemptCount(count);
    }
  };

  const handleAddressSelect = async (caseItem: ClientCase) => {
    if (caseItem.clientId && (!selectedClient || selectedClient.id !== caseItem.clientId)) {
      const client = clients.find(c => c.id === caseItem.clientId);
      if (client) {
        setSelectedClient(client);
        form.setValue("clientId", client.id);
      }
    }
    
    setSelectedCase(caseItem);
    form.setValue("caseNumber", caseItem.caseNumber);
    
    // Reset address selection
    form.setValue("addressType", "custom");
    form.setValue("serviceAddress", "");
    
    if (caseItem.clientId) {
      form.setValue("clientId", caseItem.clientId);
      
      const count = await getServeAttemptsCount(
        caseItem.clientId, 
        caseItem.caseNumber
      );
      setCaseAttemptCount(count);
    }
    
    setAddressSearchOpen(false);
  };

  return {
    form,
    selectedClient,
    selectedCase,
    clientCases,
    allCases,
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
  };
};
