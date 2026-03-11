import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local manually
const envPath = path.resolve(__dirname, '..', '.env.local');
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
    console.log('✅ Loaded .env.local');
}

// Initialize Firebase Admin directly without relying on `lib/firebase-admin`
// to avoid any Next.js specific issues in this standalone script.
if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

const db = admin.firestore();
try {
  db.settings({ preferRest: true });
} catch(e) {}

async function deleteCollection(collectionPath: string, batchSize: number) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: any) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}


async function runAuditAndReset() {
    console.log('🔥 Starting Firebase Audit and Reset...\n');

    // 1. Delete existing collections
    const collectionsToClear = ['products', 'orders', 'categories', 'collections', 'tags', 'customers', 'admins'];
    
    console.log('🧹 Wiping existing collections...');
    for (const collectionName of collectionsToClear) {
        console.log(`   - Clearing collection: ${collectionName}`);
        await deleteCollection(collectionName, 100);
    }
    console.log('✅ All specified collections cleared.\n');

    // 2. Create the requested Admin User
    console.log('👤 Creating admin user...');
    
    const adminEmail = 'admin@gmail.com';
    const rawPassword = '123123123';
    
    console.log(`   - Hashing password...`);
    const adminPassword = await bcrypt.hash(rawPassword, 10);
    console.log(`   - Writing to admins collection...`);
    
    const adminRef = db.collection('admins').doc('admin-master');
    
    await adminRef.set({
        email: adminEmail,
        password: adminPassword,
        passwordHash: adminPassword,
        name: 'System Admin',
        role: 'SUPER_ADMIN',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✅ Admin Account Created: ${adminEmail} / ${rawPassword}\n`);

    console.log('🎉 Reset and Audit setup complete. Database is ready for import.');
}

runAuditAndReset()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Error during reset:', err);
        process.exit(1);
    });
