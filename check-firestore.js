const admin = require('firebase-admin');
const fs = require('fs');

// Initialize with environment variables or default config
// Assuming standard Next.js env vars for Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'lps19-121b2' // From previous logs
  });
}

const db = admin.firestore();

async function checkCurrentState() {
  try {
    const productsSnapshot = await db.collection('products').get();
    const manufacturersSnapshot = await db.collection('manufacturers').get();
    
    console.log(`Current products in Firestore: ${productsSnapshot.size}`);
    console.log(`Current manufacturers in Firestore: ${manufacturersSnapshot.size}`);
    
    const sampleProducts = [];
    productsSnapshot.limit(5).forEach(doc => {
      sampleProducts.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('Sample Products:', JSON.stringify(sampleProducts, null, 2));
    
    const manufacturers = [];
    manufacturersSnapshot.forEach(doc => {
        manufacturers.push({ id: doc.id, name: doc.data().name });
    });
    fs.writeFileSync('current-manufacturers.json', JSON.stringify(manufacturers, null, 2));
    
  } catch (error) {
    console.error('Error checking Firestore state:', error);
  } finally {
    process.exit(0);
  }
}

checkCurrentState();
