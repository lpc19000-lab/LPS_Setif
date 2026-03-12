import * as path from 'path';
import * as fs from 'fs';

// Load .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
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

async function test() {
   // Now initialize admin via dynamic import
   const { adminDb } = await import('./lib/firebase-admin');

   try {
       console.log('Testing Firestore connection...');
       const snap = await adminDb.collection('products').limit(1).get();
       console.log('✅ Firebase connected!');
       console.log('📦 Products count: ', snap.size);
       process.exit(0);
   } catch (e) {
       console.error('❌ Error connecting to Firebase:', e);
       process.exit(1);
   }
}

test();
