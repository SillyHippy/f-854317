import { Account, Client, Databases, ID, Query } from 'appwrite';

const projectID = '64f0547b6bb869c489dd';
const databaseID = '64f0552c99794474c397';

const client = new Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(projectID);

const account = new Account(client);
const databases = new Databases(client);

const DATABASE_ID = databaseID;

const COLLECTIONS = {
    CLIENTS: '64f05549c149c3b91c9a',
    CLIENT_CASES: '64f055561896ca6f3f4b',
    SERVE_ATTEMPTS: '65219048ca84a9b3e99e',
};

const appwrite = {
    client,
    account,
    databases,

    // Account methods
    createAccount: (email, password, name) => account.create(ID.unique(), email, password, name),
    getSession: () => account.getSession('current'),
    getAccount: () => account.get(),
    deleteCurrentSession: () => account.deleteSession('current'),

    // Client methods
    createClient: (clientData) => {
        console.log("Creating client with data:", clientData);
        return databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            ID.unique(),
            clientData
        );
    },
    getClient: (clientId) => {
        console.log("Fetching client with ID:", clientId);
        return databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            clientId
        );
    },
    updateClient: (clientId, clientData) => {
        console.log("Updating client with ID:", clientId, "and data:", clientData);
        return databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            clientId,
            clientData
        );
    },
    deleteClient: (clientId) => {
        console.log("Deleting client with ID:", clientId);
        return databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            clientId
        );
    },
    listClients: async () => {
        console.log("Listing clients");
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.CLIENTS,
                [
                    Query.order('name', 'ASC')
                ]
            );
            console.log("Clients listed successfully:", response.documents);
            return response.documents;
        } catch (error) {
            console.error("Error listing clients:", error);
            throw error;
        }
    },

    // Case methods
    createCase: (caseData) => {
        console.log("Creating case with data:", caseData);
        return databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENT_CASES,
            ID.unique(),
            caseData
        );
    },
    getCase: (caseId) => {
        console.log("Fetching case with ID:", caseId);
        return databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENT_CASES,
            caseId
        );
    },
    updateCase: (caseId, caseData) => {
        console.log("Updating case with ID:", caseId, "and data:", caseData);
        return databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENT_CASES,
            caseId,
            caseData
        );
    },
    deleteClientCase: (caseId) => {
        console.log("Deleting case with ID:", caseId);
        return databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENT_CASES,
            caseId
        );
    },
    getClientCases: async (clientId) => {
        console.log("Fetching cases for client ID:", clientId);
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.CLIENT_CASES,
                [
                    Query.equal('client_id', clientId),
                    Query.order('case_number', 'ASC')
                ]
            );
            console.log("Cases listed successfully:", response.documents);
            return response.documents;
        } catch (error) {
            console.error("Error listing cases:", error);
            throw error;
        }
    },

    // Serve Attempt methods
    async createServeAttempt(serveData) {
        try {
            console.log("Creating serve attempt with data:", serveData);
            
            // Map the serviceAddress field to service_address for Appwrite
            const mappedData = {
                client_id: serveData.clientId,
                client_name: serveData.clientName,
                client_email: serveData.clientEmail,
                case_number: serveData.caseNumber,
                case_name: serveData.caseName,
                person_entity_being_served: serveData.personEntityBeingServed,
                image_data: serveData.imageData,
                coordinates: serveData.coordinates,
                address: serveData.address,
                service_address: serveData.serviceAddress, // Map to correct field name
                notes: serveData.notes,
                timestamp: serveData.timestamp.toISOString(),
                status: serveData.status,
                attempt_number: serveData.attemptNumber,
                physical_description: serveData.physicalDescription ? JSON.stringify(serveData.physicalDescription) : null,
            };

            console.log("Mapped data for Appwrite:", mappedData);

            const response = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.SERVE_ATTEMPTS,
                ID.unique(),
                mappedData
            );

            console.log("Serve attempt created successfully:", response);
            return response;
        } catch (error) {
            console.error("Error creating serve attempt:", error);
            throw error;
        }
    },
    getServeAttempt: (serveId) => {
        console.log("Fetching serve attempt with ID:", serveId);
        return databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.SERVE_ATTEMPTS,
            serveId
        );
    },
    updateServeAttempt: (serveId, serveData) => {
        console.log("Updating serve attempt with ID:", serveId, "and data:", serveData);
        return databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.SERVE_ATTEMPTS,
            serveId,
            serveData
        );
    },
    deleteServeAttempt: (serveId) => {
        console.log("Deleting serve attempt with ID:", serveId);
        return databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.SERVE_ATTEMPTS,
            serveId
        );
    },
    getClientServeAttempts: async (clientId) => {
        console.log("Fetching serve attempts for client ID:", clientId);
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.SERVE_ATTEMPTS,
                [
                    Query.equal('client_id', clientId),
                    Query.order('timestamp', 'DESC')
                ]
            );
            console.log("Serve attempts listed successfully:", response.documents);
            return response.documents;
        } catch (error) {
            console.error("Error listing serve attempts:", error);
            throw error;
        }
    },
};

export { appwrite };
