/**
 * Configuration verification script
 * This script checks that all Appwrite configurations are properly set up with the new database
 */

import { APPWRITE_CONFIG, isAppwriteConfigured } from './src/config/backendConfig.ts';

console.log('=== Appwrite Configuration Verification ===');
console.log('');

console.log('Endpoint:', APPWRITE_CONFIG.endpoint);
console.log('Project ID:', APPWRITE_CONFIG.projectId);
console.log('Database ID:', APPWRITE_CONFIG.databaseId);
console.log('');

console.log('Collection IDs:');
console.log('- Clients:', APPWRITE_CONFIG.collections.clients);
console.log('- Client Cases:', APPWRITE_CONFIG.collections.clientCases);
console.log('- Serve Attempts:', APPWRITE_CONFIG.collections.serveAttempts);
console.log('- Client Documents:', APPWRITE_CONFIG.collections.clientDocuments);
console.log('');

console.log('Storage Bucket ID:', APPWRITE_CONFIG.storageBucket);
console.log('Email Function ID:', APPWRITE_CONFIG.functions.emailer);
console.log('');

console.log('Configuration Valid:', isAppwriteConfigured());
console.log('');

console.log('Expected Values:');
console.log('- Endpoint should be: https://nyc.cloud.appwrite.io/v1');
console.log('- Project ID should be: 67ff9afd003750551953');
console.log('- Database ID should be: 67eae6fe0020c6721531');
console.log('- Clients Collection should be: 67eae70e000c042112c8');
console.log('- Client Cases Collection should be: 67eae98f0017c9503bee');
console.log('- Serve Attempts Collection should be: 684c14fb002f6275b932');
console.log('- Client Documents Collection should be: 67eaeaa900128f318514');
console.log('- Storage Bucket should be: 67eaeb7700322d74597e');
console.log('- Email Function should be: 67ed8899003a8b119a18');
