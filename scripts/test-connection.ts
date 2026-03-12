import { adminDb } from '../lib/firebase-admin';

async function test() {
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
