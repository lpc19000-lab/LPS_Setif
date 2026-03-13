const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const projectId = envContent.match(/FIREBASE_PROJECT_ID=([^\r\n]+)/)[1].trim();
const clientEmail = envContent.match(/FIREBASE_CLIENT_EMAIL=([^\r\n]+)/)[1].trim();
const privateKeyRaw = envContent.match(/FIREBASE_PRIVATE_KEY="([^"]+)"/)[1];
const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
const storageBucket = envContent.match(/NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=([^\r\n]+)/)[1].trim();

console.log('Project:', projectId);
console.log('Bucket:', storageBucket);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey
        }),
        storageBucket
    });
}

const bucket = getStorage().bucket();

async function testUpload() {
    try {
        console.log('Checking bucket existence:', bucket.name);
        const [exists] = await bucket.exists();
        console.log('Exists:', exists);
        
        if (exists) {
            const fileName = `test-${Date.now()}.txt`;
            const file = bucket.file(fileName);
            await file.save('Hello world', {
                metadata: { contentType: 'text/plain ' }
            });
            console.log('Upload SUCCESS');
            await file.makePublic();
            console.log('Public URL:', `https://storage.googleapis.com/${bucket.name}/${fileName}`);
        } else {
            console.log('Bucket DOES NOT EXIST. Trying to list buckets to see what we have...');
            const [buckets] = await bucket.storage.getBuckets();
            console.log('Available buckets:', buckets.map(b => b.name));
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

testUpload();
