import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { appwrite } from '@/lib/appwrite';
import { ServeAttemptData } from '@/components/ServeAttempt';
import { ClientData } from '@/components/ClientForm';
import { CaseData } from '@/components/CaseForm';
import { DocumentData } from '@/components/DocumentUpload';
import { Loader2, Search, Plus, RefreshCw } from 'lucide-react';
import ServeAttemptList from '@/components/ServeAttemptList';
import ClientList from '@/components/ClientList';
import CaseList from '@/components/CaseList';
import DocumentList from '@/components/DocumentList';
import { useAuth } from '@/hooks/use-auth';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [serveAttempts, setServeAttempts] = useState<ServeAttemptData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [activeTab, setActiveTab] = useState('serves');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load data from Appwrite
      await Promise.all([
        loadServeAttempts(),
        loadClients(),
        loadCases(),
        loadDocuments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadServeAttempts = async () => {
    try {
      const serves = await appwrite.getServeAttempts();
      setServeAttempts(serves);
    } catch (error) {
      console.error('Error loading serve attempts:', error);
    }
  };

  const loadClients = async () => {
    try {
      const clientsData = await appwrite.getClients();
      setClients(clientsData.map((client: any) => ({
        id: client.$id,
        name: client.name,
        email: client.email,
        additionalEmails: client.additional_emails || [],
        phone: client.phone,
        address: client.address,
        notes: client.notes,
        createdAt: client.created_at ? new Date(client.created_at) : new Date(),
      })));
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadCases = async () => {
    try {
      // Load all cases for all clients
      const allCases: CaseData[] = [];
      for (const client of clients) {
        const clientCases = await appwrite.getClientCases(client.id);
        allCases.push(...clientCases.map((caseItem: any) => ({
          id: caseItem.$id,
          clientId: caseItem.client_id,
          caseNumber: caseItem.case_number,
          caseName: caseItem.case_name,
          description: caseItem.description,
          status: caseItem.status,
          homeAddress: caseItem.home_address,
          workAddress: caseItem.work_address,
          createdAt: caseItem.created_at ? new Date(caseItem.created_at) : new Date(),
        })));
      }
      setCases(allCases);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      // Load all documents for all clients
      const allDocuments: DocumentData[] = [];
      for (const client of clients) {
        const clientDocuments = await appwrite.getClientDocuments(client.id);
        allDocuments.push(...clientDocuments.map((doc: any) => ({
          id: doc.$id,
          clientId: doc.client_id,
          caseNumber: doc.case_number,
          fileName: doc.file_name,
          fileSize: doc.file_size,
          fileType: doc.file_type,
          filePath: doc.file_path,
          description: doc.description,
          createdAt: doc.created_at ? new Date(doc.created_at) : new Date(),
        })));
      }
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      toast({
        title: 'Refreshed',
        description: 'Data has been refreshed successfully.',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const renderStatusCounts = () => {
    // Calculate completion rate and other summary data
    const total = serveAttempts.length;
    const completed = serveAttempts.filter(serve => serve.status === 'completed').length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Simple data structure for doughnut chart
    const statusData = [
      { name: 'Completed', value: completed, color: '#4ade80' },
      { name: 'Failed', value: total - completed, color: '#f87171' }
    ];

    // Return the JSX with fixed TypeScript errors
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">
                {completed} of {total} attempts successful
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serve attempts this month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Serve Attempts This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serveAttempts.filter(serve => {
                const serveDate = new Date(serve.timestamp);
                return serveDate.getMonth() === new Date().getMonth() &&
                  serveDate.getFullYear() === new Date().getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const filteredServeAttempts = serveAttempts.filter(serve => 
    serve.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    serve.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    serve.caseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    serve.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    serve.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCases = cases.filter(caseItem => 
    caseItem.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseItem.caseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseItem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseItem.homeAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseItem.workAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocuments = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your process serving activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            onClick={() => navigate('/serve-attempt/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Serve Attempt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent serve attempts and client activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="serves">Serves</TabsTrigger>
                      <TabsTrigger value="clients">Clients</TabsTrigger>
                      <TabsTrigger value="cases">Cases</TabsTrigger>
                      <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="serves" className="mt-4">
                      <ServeAttemptList 
                        serveAttempts={filteredServeAttempts} 
                        onRefresh={loadServeAttempts}
                      />
                    </TabsContent>
                    
                    <TabsContent value="clients" className="mt-4">
                      <ClientList 
                        clients={filteredClients} 
                        onRefresh={loadClients}
                      />
                    </TabsContent>
                    
                    <TabsContent value="cases" className="mt-4">
                      <CaseList 
                        cases={filteredCases} 
                        clients={clients}
                        onRefresh={loadCases}
                      />
                    </TabsContent>
                    
                    <TabsContent value="documents" className="mt-4">
                      <DocumentList 
                        documents={filteredDocuments} 
                        clients={clients}
                        onRefresh={loadDocuments}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                Overview of your serve attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                renderStatusCounts()
              )}
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>
                  Your service statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Clients:</span>
                    <span className="font-medium">{clients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Cases:</span>
                    <span className="font-medium">
                      {cases.filter(c => c.status === 'Active' || c.status === 'Pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Documents:</span>
                    <span className="font-medium">{documents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serve Attempts:</span>
                    <span className="font-medium">{serveAttempts.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
