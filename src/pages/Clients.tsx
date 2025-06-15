
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
      const clientList = await appwrite.listClients();
      setClients(clientList);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (newClient: ClientData) => {
    try {
      const createdClient = await appwrite.createClient(newClient);
      setClients((prevClients) => [...prevClients, createdClient]);
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
      const success = await appwrite.updateClient(updatedClient);
      if (success) {
        setClients((prevClients) =>
          prevClients.map((client) =>
            client.id === updatedClient.id ? updatedClient : client
          )
        );
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
      await appwrite.deleteClient(id);
      setClients((prevClients) => prevClients.filter((client) => client.id !== id));
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
            <div className="text-center">No clients found.</div>
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
