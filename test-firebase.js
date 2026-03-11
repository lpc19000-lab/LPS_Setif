require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

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
});

const db = admin.firestore();

async function test() {
  try {
    const snapshot = await db.collection('products').limit(1).get();
    console.log('Successfully connected to Firestore.');
    console.log(`Found ${snapshot.size} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to Firestore:', error);
    process.exit(1);
  }
}

test();
