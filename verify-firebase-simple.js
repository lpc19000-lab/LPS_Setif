const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    }
}

async function verify() {
    console.log('--- INDEPENDENT SERVICE VERIFICATION ---');
    
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    privateKey = privateKey.replace(/\\n/g, '\n');

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    }

    // Firestore
    try {
        console.log('Testing Firestore...');
        const db = admin.firestore();
        const productsSnap = await db.collection('products').limit(1).get();
        console.log('✅ Firestore: SUCCESS. Products found:', productsSnap.size);
    } catch (e) {
        console.error('❌ Firestore: FAILED.', e.message);
    }

    // Storage
    try {
        console.log('Testing Storage...');
        const storage = admin.storage();
        // Try the configured bucket
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        console.log(`Using bucket: ${bucketName}`);
        const [files] = await storage.bucket(bucketName).getFiles({ maxResults: 1 });
        console.log('✅ Storage: SUCCESS. Files found:', files.length);
    } catch (e) {
        console.error('❌ Storage: FAILED.', e.message);
        console.log('Attempting fallback bucket name (appspot.com)...');
        try {
            const fallbackBucket = process.env.FIREBASE_PROJECT_ID + '.appspot.com';
            const [files] = await admin.storage().bucket(fallbackBucket).getFiles({ maxResults: 1 });
            console.log(`✅ Storage: SUCCESS (with fallback ${fallbackBucket}). Files found:`, files.length);
        } catch (e2) {
            console.error('❌ Storage Fallback: FAILED.', e2.message);
        }
    }

    // Auth
    try {
        console.log('Testing Auth...');
        const listUsers = await admin.auth().listUsers(1);
        console.log('✅ Auth: SUCCESS. Users found:', listUsers.users.length);
    } catch (e) {
        console.error('❌ Auth: FAILED.', e.message);
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
    process.exit(0);
}

verify();
