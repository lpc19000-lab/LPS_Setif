import { adminDb } from '../lib/firebase-admin';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';

const db = adminDb;

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
