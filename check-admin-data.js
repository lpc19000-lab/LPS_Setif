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

async function checkAdmin() {
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
        if (doc.exists) {
            console.log('Admin Master Data:', doc.data());
        } else {
            console.log('Admin Master doc not found');
        }
        process.exit(0);
    } catch (error) {
        console.error('Failed to fetch admin data:', error);
        process.exit(1);
    }
}

checkAdmin();
