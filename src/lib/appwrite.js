

import { Client, Account, Databases, Storage, Query, ID } from "appwrite";
import { APPWRITE_CONFIG } from "@/config/backendConfig";

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// Create instances of the Appwrite services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Export the Appwrite client and services
export { client, account, databases, storage, Query, ID };

// Export config values for ease of use
export const DATABASE_ID = APPWRITE_CONFIG.databaseId;
export const CLIENTS_COLLECTION_ID = APPWRITE_CONFIG.collections.clients;
export const CASES_COLLECTION_ID = APPWRITE_CONFIG.collections.clientCases;
export const SERVE_ATTEMPTS_COLLECTION_ID = APPWRITE_CONFIG.collections.serveAttempts;
export const CLIENT_DOCUMENTS_COLLECTION_ID = APPWRITE_CONFIG.collections.clientDocuments;
export const STORAGE_BUCKET_ID = APPWRITE_CONFIG.storageBucket;

const appwrite = {
  // Export the databases instance so Dashboard can access it
  databases,
  storage,
  DATABASE_ID,
  CLIENTS_COLLECTION_ID,
  CASES_COLLECTION_ID,
  SERVE_ATTEMPTS_COLLECTION_ID,
  CLIENT_DOCUMENTS_COLLECTION_ID,
  STORAGE_BUCKET_ID,

  // Setup realtime subscription function
  setupRealtimeSubscription: (callback) => {
    try {
      const unsubscribe = client.subscribe('databases.*', (response) => {
        console.log('Realtime update received:', response);
        if (callback) callback(response);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      return () => {}; // Return empty cleanup function
    }
  },

  // Account Management
  createAccount: async (email, password, name) => {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      return user;
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  },

  getSession: async (sessionId) => {
    try {
      const session = await account.getSession(sessionId);
      return session;
    } catch (error) {
      console.error("Error getting session:", error);
      throw error;
    }
  },

  deleteSession: async (sessionId) => {
    try {
      await account.deleteSession(sessionId);
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  },

  getAccount: async () => {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      console.error("Error getting account:", error);
      throw error;
    }
  },

  createEmailSession: async (email, password) => {
    try {
      const session = await account.createEmailSession(email, password);
      return session;
    } catch (error) {
      console.error("Error creating email session:", error);
      throw error;
    }
  },

  deleteCurrentSession: async () => {
    try {
      await account.deleteSession("current");
    } catch (error) {
      console.error("Error deleting current session:", error);
      throw error;
    }
  },

  // Client Management
  createClient: async (clientData) => {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        ID.unique(),
        {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          notes: clientData.notes || "",
          additional_emails: clientData.additionalEmails || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
      return response;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  },

  getClients: async () => {
    try {
      const { documents } = await databases.listDocuments(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID
      );
      return documents;
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  },

  getClient: async (clientId) => {
    try {
      const client = await databases.getDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        clientId
      );
      return client;
    } catch (error) {
      console.error("Error fetching client:", error);
      throw error;
    }
  },

  updateClient: async (clientId, clientData) => {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        clientId,
        {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          notes: clientData.notes || "",
          additional_emails: clientData.additionalEmails || [],
          updated_at: new Date().toISOString()
        }
      );
      return response;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  deleteClient: async (clientId) => {
    try {
      // First delete all related documents
      await this.deleteAllClientData(clientId);
      
      // Then delete the client
      await databases.deleteDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        clientId
      );
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  deleteAllClientData: async (clientId) => {
    try {
      // Delete serve attempts
      const serves = await this.getClientServeAttempts(clientId);
      for (const serve of serves) {
        await this.deleteServeAttempt(serve.$id);
      }

      // Delete cases
      const cases = await this.getClientCases(clientId);
      for (const caseItem of cases) {
        await this.deleteClientCase(caseItem.$id);
      }

      // Delete documents
      const documents = await databases.listDocuments(
        DATABASE_ID,
        CLIENT_DOCUMENTS_COLLECTION_ID,
        [Query.equal('client_id', clientId)]
      );
      
      for (const doc of documents.documents) {
        if (doc.file_path && doc.file_path !== 'unique()') {
          try {
            await storage.deleteFile(STORAGE_BUCKET_ID, doc.file_path);
          } catch (storageError) {
            console.error('Error deleting file from storage:', storageError);
          }
        }
        
        await databases.deleteDocument(
          DATABASE_ID,
          CLIENT_DOCUMENTS_COLLECTION_ID,
          doc.$id
        );
      }
    } catch (error) {
      console.error('Error deleting client data:', error);
      throw error;
    }
  },

  // Client Case Management
  createClientCase: async (caseData) => {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        ID.unique(),
        {
          client_id: caseData.client_id,
          case_number: caseData.case_number,
          case_name: caseData.case_name,
          court_name: caseData.court_name || "",
          plaintiff_petitioner: caseData.plaintiff_petitioner || "",
          defendant_respondent: caseData.defendant_respondent || "",
          notes: caseData.notes || "",
          status: caseData.status || "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          home_address: caseData.home_address || "",
          work_address: caseData.work_address || ""
        }
      );
      return response;
    } catch (error) {
      console.error("Error creating client case:", error);
      throw error;
    }
  },

  getClientCases: async (clientId) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        [Query.equal('client_id', clientId)]
      );
      return response.documents;
    } catch (error) {
      console.error('Error fetching client cases:', error);
      return [];
    }
  },

  deleteClientCase: async (caseId) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        caseId
      );
      return true;
    } catch (error) {
      console.error('Error deleting client case:', error);
      throw error;
    }
  },

  updateCaseStatus: async (clientId, caseNumber, status) => {
    try {
      const cases = await databases.listDocuments(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        [
          Query.equal('client_id', clientId),
          Query.equal('case_number', caseNumber)
        ]
      );
      
      if (cases.documents.length > 0) {
        const caseDoc = cases.documents[0];
        await databases.updateDocument(
          DATABASE_ID,
          CASES_COLLECTION_ID,
          caseDoc.$id,
          { status: status }
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating case status:', error);
      return false;
    }
  },

  // Serve Attempt Management - Updated to use correct collection ID
  createServeAttempt: async (serveData) => {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        ID.unique(),
        {
          client_id: serveData.clientId,
          case_number: serveData.caseNumber,
          case_name: serveData.caseName,
          description: serveData.description || "",
          status: serveData.status || "pending",
          service_address: serveData.serviceAddress || "",
          timestamp: serveData.timestamp || new Date().toISOString(),
          coordinates: serveData.coordinates || null,
          image_data: serveData.imageData || null,
          attempt_number: serveData.attemptNumber || 1,
          person_entity_being_served: serveData.personEntityBeingServed || "",
          physical_description: serveData.physicalDescription || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
      return response;
    } catch (error) {
      console.error("Error creating serve attempt:", error);
      throw error;
    }
  },

  // Updated getServeAttempts to handle limit and offset parameters
  getServeAttempts: async (limit = 100, offset = 0) => {
    try {
      const queries = [Query.limit(limit), Query.offset(offset), Query.orderDesc('created_at')];
      const { documents } = await databases.listDocuments(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        queries
      );
      return documents;
    } catch (error) {
      console.error("Error fetching serve attempts:", error);
      return [];
    }
  },

  getServeAttempt: async (serveId) => {
    try {
      const serve = await databases.getDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        serveId
      );
      return serve;
    } catch (error) {
      console.error("Error fetching serve attempt:", error);
      throw error;
    }
  },

  getClientServeAttempts: async (clientId) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        [Query.equal('client_id', clientId)]
      );
      return response.documents;
    } catch (error) {
      console.error('Error fetching client serve attempts:', error);
      return [];
    }
  },

  updateServeAttempt: async (serveId, serveData) => {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        serveId,
        {
          client_id: serveData.clientId,
          case_number: serveData.caseNumber,
          case_name: serveData.caseName,
          description: serveData.description || "",
          status: serveData.status || "pending",
          service_address: serveData.serviceAddress || "",
          timestamp: serveData.timestamp || new Date().toISOString(),
          coordinates: serveData.coordinates || null,
          image_data: serveData.imageData || null,
          attempt_number: serveData.attemptNumber || 1,
          person_entity_being_served: serveData.personEntityBeingServed || "",
          physical_description: serveData.physicalDescription || null,
          updated_at: new Date().toISOString()
        }
      );
      return response;
    } catch (error) {
      console.error("Error updating serve attempt:", error);
      throw error;
    }
  },

  deleteServeAttempt: async (serveId) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        serveId
      );
      return true;
    } catch (error) {
      console.error("Error deleting serve attempt:", error);
      throw error;
    }
  },

  // Client Document Management
  uploadClientDocument: async (clientId, file, caseNumber, description) => {
    try {
      const fileUpload = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        file
      );

      const response = await databases.createDocument(
        DATABASE_ID,
        CLIENT_DOCUMENTS_COLLECTION_ID,
        ID.unique(),
        {
          client_id: clientId,
          file_name: file.name,
          file_path: fileUpload.$id,
          file_type: file.type,
          file_size: file.size,
          case_number: caseNumber || "",
          description: description || "",
          created_at: new Date().toISOString()
        }
      );
      return response;
    } catch (error) {
      console.error("Error uploading client document:", error);
      throw error;
    }
  },

  getClientDocuments: async (clientId) => {
    try {
      const { documents } = await databases.listDocuments(
        DATABASE_ID,
        CLIENT_DOCUMENTS_COLLECTION_ID,
        [Query.equal('client_id', clientId)]
      );
      return documents;
    } catch (error) {
      console.error("Error fetching client documents:", error);
      return [];
    }
  },

  getDocumentUrl: async (fileId) => {
    try {
      const url = await storage.getFileView(STORAGE_BUCKET_ID, fileId);
      return url.href;
    } catch (error) {
      console.error("Error getting document URL:", error);
      throw error;
    }
  },

  deleteClientDocument: async (documentId, filePath) => {
    try {
      await storage.deleteFile(STORAGE_BUCKET_ID, filePath);
      await databases.deleteDocument(
        DATABASE_ID,
        CLIENT_DOCUMENTS_COLLECTION_ID,
        documentId
      );
      return true;
    } catch (error) {
      console.error("Error deleting client document:", error);
      return false;
    }
  },

  // Additional helper methods
  getTotalServeAttemptsCount: async () => {
    try {
      const { total } = await databases.listDocuments(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        [Query.limit(1)]
      );
      return total;
    } catch (error) {
      console.error("Error getting total serve attempts count:", error);
      return 0;
    }
  },

  // Local Storage Sync (Example - Adapt as needed)
  syncAppwriteClientsToLocal: async () => {
    try {
      const clients = await this.getClients();
      localStorage.setItem("appwrite-clients", JSON.stringify(clients));
    } catch (error) {
      console.error("Error syncing Appwrite clients to local storage:", error);
    }
  },

  syncAppwriteServesToLocal: async () => {
    try {
      const serves = await this.getServeAttempts();
      localStorage.setItem("appwrite-serves", JSON.stringify(serves));
    } catch (error) {
      console.error("Error syncing Appwrite serves to local storage:", error);
    }
  }
};

export { appwrite };
