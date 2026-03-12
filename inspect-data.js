const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

async function inspect() {
    try {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
        privateKey = privateKey.replace(/\\n/g, '\n');

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey,
                }),
            });
        }

        const db = admin.firestore();
        const doc = await db.collection('admins').doc('admin-master').get();
        console.log('Admin Master data:', JSON.stringify(doc.data(), null, 2));

        const customers = await db.collection('customers').limit(1).get();
        if (!customers.empty) {
            console.log('Sample Customer data:', JSON.stringify(customers.docs[0].data(), null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Inspection failed:', error);
        process.exit(1);
    }
}

inspect();
