import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileText, Download, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { appwrite } from "@/lib/appwrite";

interface ClientDocument {
  $id: string;
  client_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  case_number?: string;
  description?: string;
  created_at: string;
}

interface ClientDocumentsProps {
  clientId: string;
  clientName: string;
}

export default function ClientDocuments({ clientId, clientName }: ClientDocumentsProps) {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [availableCases, setAvailableCases] = useState<{ caseNumber: string; caseName?: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    caseNumber: "",
    description: ""
  });
  const { toast } = useToast();

  // Fetch documents and cases on component mount
  useEffect(() => {
    fetchDocuments();
    fetchAvailableCases();
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      const docs = await appwrite.getClientDocuments(clientId);
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive"
      });
    }
  };

  const fetchAvailableCases = async () => {
    try {
      const cases = await appwrite.getClientCases(clientId);
      setAvailableCases(cases.map(c => ({
        caseNumber: c.case_number,
        caseName: c.case_name
      })));
    } catch (error) {
      console.error("Error fetching cases:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadForm.file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadedDoc = await appwrite.uploadClientDocument(
        clientId,
        uploadForm.file,
        uploadForm.caseNumber || undefined,
        uploadForm.description || undefined
      );

      if (uploadedDoc) {
        await fetchDocuments();
        setIsDialogOpen(false);
        setUploadForm({ file: null, caseNumber: "", description: "" });
        toast({
          title: "Success",
          description: "Document uploaded successfully"
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: ClientDocument) => {
    try {
      const url = await appwrite.getDocumentUrl(doc.file_path);
      if (url) {
        const link = globalThis.document.createElement('a');
        link.href = url;
        link.download = doc.file_name;
        link.click();
      } else {
        throw new Error("Could not generate download URL");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (document: ClientDocument) => {
    try {
      console.log(`Attempting to delete document with ID: ${document.$id} and fileId: ${document.file_path}`);
      
      // Check if file_path is valid before attempting deletion
      if (!document.file_path || document.file_path === 'unique()') {
        console.log('Invalid fileId: ' + document.file_path + '. Skipping file deletion.');
        
        // Only delete the database record
        await appwrite.databases.deleteDocument(
          appwrite.DATABASE_ID,
          appwrite.CLIENT_DOCUMENTS_COLLECTION_ID,
          document.$id
        );
      } else {
        // Delete both file and database record
        const success = await appwrite.deleteClientDocument(document.$id, document.file_path);
        if (!success) {
          throw new Error("Failed to delete document");
        }
      }
      
      console.log(`Successfully deleted document with ID: ${document.$id}`);
      await fetchDocuments();
      toast({
        title: "Success",
        description: "Document deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCaseName = (caseNumber: string): string => {
    const caseData = availableCases.find(c => c.caseNumber === caseNumber);
    return caseData?.caseName || caseNumber;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Client Documents</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a new document for {clientName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadForm(prev => ({ 
                    ...prev, 
                    file: e.target.files?.[0] || null 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="case">Case (Optional)</Label>
                <Select 
                  value={uploadForm.caseNumber} 
                  onValueChange={(value) => setUploadForm(prev => ({ 
                    ...prev, 
                    caseNumber: value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a case (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCases.map(caseData => (
                      <SelectItem key={caseData.caseNumber} value={caseData.caseNumber}>
                        {getCaseName(caseData.caseNumber)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  placeholder="Document description"
                />
              </div>
              
              <Button 
                onClick={handleFileUpload} 
                disabled={isUploading || !uploadForm.file}
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {documents.map((document) => (
          <Card key={document.$id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="truncate">{document.file_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(document)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(document)}
                    className="h-8 w-8 p-0 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Size:</strong> {formatFileSize(document.file_size)}</p>
                <p><strong>Type:</strong> {document.file_type}</p>
                {document.case_number && (
                  <p><strong>Case:</strong> {getCaseName(document.case_number)}</p>
                )}
                {document.description && (
                  <p><strong>Description:</strong> {document.description}</p>
                )}
                <p><strong>Uploaded:</strong> {new Date(document.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {documents.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
