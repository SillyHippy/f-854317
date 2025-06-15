
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserPlus, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appwrite } from "@/lib/appwrite";
import { toast } from "@/hooks/use-toast";
import ClientForm, { ClientData } from "@/components/ClientForm";
import ResponsiveDialog from "@/components/ResponsiveDialog";

export default function Clients() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      console.log("Fetching clients from Appwrite...");
      
      // Try the getClients method first
      let clientList;
      try {
        clientList = await appwrite.getClients();
        console.log("Retrieved clients using getClients:", clientList);
      } catch (error) {
        console.log("getClients failed, trying listClients:", error);
        clientList = await appwrite.listClients();
        console.log("Retrieved clients using listClients:", clientList);
      }
      
      // Ensure we have an array
      const clientArray = Array.isArray(clientList) ? clientList : [];
      console.log("Final client array:", clientArray);
      
      setClients(clientArray);
      
      if (clientArray.length === 0) {
        console.log("No clients found in database");
        toast({
          title: "No clients found",
          description: "Your client database appears to be empty. Try adding a new client.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error loading clients",
        description: "Failed to fetch clients from database. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (newClient: ClientData) => {
    try {
      console.log("Adding new client:", newClient);
      const createdClient = await appwrite.createClient(newClient);
      console.log("Client created successfully:", createdClient);
      
      // Refresh the client list after adding
      await fetchClients();
      
      toast({
        title: "Client added",
        description: "Client has been added successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error adding client:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add client.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateClient = async (updatedClient: ClientData) => {
    try {
      console.log("Updating client:", updatedClient);
      const success = await appwrite.updateClient(updatedClient);
      if (success) {
        // Refresh the client list after updating
        await fetchClients();
        
        toast({
          title: "Client updated",
          description: "Client has been updated successfully.",
          variant: "success",
        });
      } else {
        throw new Error("Failed to update client");
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update client.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      console.log("Deleting client:", id);
      await appwrite.deleteClient(id);
      
      // Refresh the client list after deleting
      await fetchClients();
      
      toast({
        title: "Client deleted",
        description: "Client has been deleted successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete client.",
        variant: "destructive",
      });
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchClients}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
            <ResponsiveDialog
              trigger={
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              }
              title="Add New Client"
            >
              <ClientForm onSubmit={handleAddClient} />
            </ResponsiveDialog>
          </div>
        </div>
        <p className="text-muted-foreground">
          Manage your clients and their information.
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            View, search, and manage your clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="search">Search Clients</Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {loading ? (
            <div className="text-center">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center space-y-4">
              <p>No clients found.</p>
              <p className="text-sm text-muted-foreground">
                {clients.length === 0 
                  ? "Your client database appears to be empty. Add your first client to get started."
                  : "No clients match your search criteria."}
              </p>
            </div>
          ) : (
            <ScrollArea className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${client.email}`}
                          className="text-primary hover:underline"
                        >
                          {client.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${client.phone}`}
                          className="text-primary hover:underline"
                        >
                          {client.phone}
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/client/${client.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-destructive hover:bg-destructive/5"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
