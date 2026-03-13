const { adminDb } = require('./lib/firebase-admin');

async function inspectCollections() {
  const collections = ['users', 'admins', 'products', 'customers', 'categories'];
  for (const coll of collections) {
    try {
      const snap = await adminDb.collection(coll).limit(1).get();
      if (snap.empty) {
        console.log(`Collection ${coll}: EMPTY`);
      } else {
        const doc = snap.docs[0];
        console.log(`Collection ${coll}: 1st doc ID: ${doc.id}`);
        console.log(`Data keys: ${Object.keys(doc.data()).join(', ')}`);
      }
    } catch (e) {
      console.error(`Error inspecting collection ${coll}:`, e.message);
    }
  }
}

inspectCollections().then(() => process.exit(0));
