const admin = require('firebase-admin');
const fs = require('fs');

async function discover() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const projectId = envContent.match(/FIREBASE_PROJECT_ID=([^\r\n]+)/)[1].trim();
        const clientEmail = envContent.match(/FIREBASE_CLIENT_EMAIL=([^\r\n]+)/)[1].trim();
        const privateKeyRaw = envContent.match(/FIREBASE_PRIVATE_KEY="([^"]+)"/)[1];
        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey
                })
            });
        }

        const { getStorage } = require('firebase-admin/storage');
        const storage = getStorage();
        // storage.bucket() is a wrapper. storage.bucket().storage is the GCP SDK instance.
        const sdkStorage = storage.bucket('dummy').storage;
        
        console.log('Project ID:', projectId);
        console.log('Listing all buckets...');
        const [buckets] = await sdkStorage.getBuckets();
        console.log('Buckets found:', buckets.map(b => b.name));
        
        if (buckets.length === 0) {
            console.log('No buckets found. Checking if Default Bucket exists from metadata...');
            // Try to guess default bucket
            const defaultBucket = storage.bucket(`${projectId}.appspot.com`);
            const [exists] = await defaultBucket.exists();
            console.log(`${projectId}.appspot.com exists:`, exists);
        }

    } catch (e) {
        console.error('ERROR:', e.message);
    }
    process.exit(0);
}

discover();
