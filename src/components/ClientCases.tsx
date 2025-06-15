import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Edit2, Trash2, MapPin, ExternalLink } from 'lucide-react';
import { ClientData } from './ClientForm';
import { appwrite } from '@/lib/appwrite';
import { toast } from '@/hooks/use-toast';

interface CaseData {
  id: string;
  client_id: string;
  case_number: string;
  case_name: string | null;
  court_name: string | null;
  plaintiff_petitioner: string | null;
  defendant_respondent: string | null;
  home_address: string | null;
  work_address: string | null;
  notes: string | null;
  status: 'Open' | 'Closed';
}

const caseSchema = z.object({
  caseNumber: z.string().min(1, 'Case number is required'),
  caseName: z.string().optional(),
  courtName: z.string().optional(),
  plaintiffPetitioner: z.string().optional(),
  defendantRespondent: z.string().optional(),
  homeAddress: z.string().optional(),
  workAddress: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['Open', 'Closed']),
});

type CaseFormValues = z.infer<typeof caseSchema>;

interface ClientCasesProps {
  client: ClientData;
  onUpdate?: () => void;
}

const ClientCases: React.FC<ClientCasesProps> = ({ client, onUpdate }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [editingCase, setEditingCase] = useState<CaseData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      caseNumber: '',
      caseName: '',
      courtName: '',
      plaintiffPetitioner: '',
      defendantRespondent: '',
      homeAddress: '',
      workAddress: '',
      notes: '',
      status: 'Open',
    },
  });

  useEffect(() => {
    fetchCases();
  }, [client]);

  const fetchCases = async () => {
    try {
      const caseList = await appwrite.getClientCases(client.id);
      setCases(caseList);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cases. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: CaseFormValues) => {
    setIsSubmitting(true);
    try {
      const caseData = {
        client_id: client.id,
        case_number: data.caseNumber,
        case_name: data.caseName || null,
        court_name: data.courtName || null,
        plaintiff_petitioner: data.plaintiffPetitioner || null,
        defendant_respondent: data.defendantRespondent || null,
        home_address: data.homeAddress || null,
        work_address: data.workAddress || null,
        notes: data.notes || null,
        status: data.status,
      };

      if (editingCase) {
        await appwrite.updateCase(editingCase.id, caseData);
        toast({
          title: "Case updated",
          description: "Case has been updated successfully.",
          variant: "success",
        });
      } else {
        await appwrite.createCase(caseData);
        toast({
          title: "Case created",
          description: "New case has been created successfully.",
          variant: "success",
        });
      }

      setIsDialogOpen(false);
      setEditingCase(null);
      form.reset();
      fetchCases();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving case:', error);
      toast({
        title: "Error",
        description: "Failed to save case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (caseItem: CaseData) => {
    setEditingCase(caseItem);
    form.setValue('caseNumber', caseItem.case_number);
    form.setValue('caseName', caseItem.case_name || '');
    form.setValue('courtName', caseItem.court_name || '');
    form.setValue('plaintiffPetitioner', caseItem.plaintiff_petitioner || '');
    form.setValue('defendantRespondent', caseItem.defendant_respondent || '');
    form.setValue('homeAddress', caseItem.home_address || '');
    form.setValue('workAddress', caseItem.work_address || '');
    form.setValue('notes', caseItem.notes || '');
    form.setValue('status', caseItem.status);
    setIsDialogOpen(true);
  };

  const handleDelete = async (caseItem: CaseData) => {
    if (window.confirm(`Are you sure you want to delete case ${caseItem.case_number}?`)) {
      try {
        await appwrite.deleteCase(caseItem.id);
        toast({
          title: "Case deleted",
          description: "Case has been deleted successfully.",
          variant: "success",
        });
        fetchCases();
        onUpdate?.();
      } catch (error) {
        console.error('Error deleting case:', error);
        toast({
          title: "Error",
          description: "Failed to delete case. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Cases</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCase ? 'Edit Case' : 'Add New Case'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="caseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter case number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="caseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter case name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courtName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Court Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter court name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plaintiffPetitioner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plaintiff/Petitioner</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter plaintiff/petitioner name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defendantRespondent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Defendant/Respondent</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter defendant/respondent name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="homeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter home address" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter work address" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about this case..." 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingCase(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (editingCase ? 'Update Case' : 'Create Case')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {cases.map((caseItem) => (
          <Card key={caseItem.id} className="bg-card text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold leading-none tracking-tight">
                {caseItem.case_name || caseItem.case_number}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {caseItem.court_name && (
                  <p>
                    <strong>Court:</strong> {caseItem.court_name}
                  </p>
                )}
                <p>
                  <strong>Case Number:</strong> {caseItem.case_number}
                </p>
                {caseItem.home_address && (
                  <p className="flex items-center gap-1">
                    <strong>Home:</strong>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(caseItem.home_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-0.5"
                    >
                      {caseItem.home_address}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                )}
                {caseItem.work_address && (
                  <p className="flex items-center gap-1">
                    <strong>Work:</strong>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(caseItem.work_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-0.5"
                    >
                      {caseItem.work_address}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                )}
                {caseItem.notes && (
                  <p>
                    <strong>Notes:</strong> {caseItem.notes}
                  </p>
                )}
                <p>
                  <strong>Status:</strong> <Badge variant={caseItem.status === 'Open' ? 'default' : 'secondary'}>{caseItem.status}</Badge>
                </p>
              </div>
            </CardContent>
            <div className="flex justify-end space-x-2 p-3">
              <Button size="sm" variant="ghost" onClick={() => handleEdit(caseItem)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(caseItem)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientCases;
