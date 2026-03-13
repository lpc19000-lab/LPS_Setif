const admin = require('firebase-admin');
const fs = require('fs');

async function check() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const projectId = envContent.match(/FIREBASE_PROJECT_ID=([^\r\n]+)/)[1].trim();
        const clientEmail = envContent.match(/FIREBASE_CLIENT_EMAIL=([^\r\n]+)/)[1].trim();
        const privateKeyRaw = envContent.match(/FIREBASE_PRIVATE_KEY="([^"]+)"/)[1];
        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey
                })
            });
        }

        const db = admin.firestore();
        console.log('Querying existing products for image URLs...');
        const snapshot = await db.collection('products').where('imageUrl', '>', '').limit(10).get();
        
        if (snapshot.empty) {
            console.log('No products with imageUrl found. Trying "image" field...');
            const snapshot2 = await db.collection('products').where('image', '>', '').limit(10).get();
            if (snapshot2.empty) {
                console.log('No products with images found at all.');
            } else {
                console.log(JSON.stringify(snapshot2.docs.map(d => ({id: d.id, name: d.data().name, image: d.data().image})), null, 2));
            }
        } else {
            console.log(JSON.stringify(snapshot.docs.map(d => ({id: d.id, name: d.data().name, imageUrl: d.data().imageUrl, image: d.data().image})), null, 2));
        }

    } catch (e) {
        console.error('ERROR:', e.message);
    }
    process.exit(0);
}

check();
