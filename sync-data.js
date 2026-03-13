const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const config = {
    projectId: "lps19-121b2",
    clientEmail: "firebase-adminsdk-fbsvc@lps19-121b2.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDEllux1BpyLikx\na6G71lBXfJfput6S4cWCbzOMd3ioJ9ThXFY3KY23JbAQ4cglL9JlWbavPbH+9Xc0\nPwSvRFlHNA+/PdZv8U3T7VHxug3/sUhZH8jnTCY4c49+63Yo2/ek8Jmy/6QI6HbB\nSCDVNG7Wt9NHk4Opojx3yahuhdyINL30bn9ih1NsIi+J1Nd5cHCs5KbyMphHXqcv\n43pTWJk1fJzP+ryAXUlCU456eQflR89AP4+ApINsjjd6qP7hIcU45cSDYcycT4lS\n+qiEW0mV086jzflEP7HljDY/PGvrHMfnuO75sFg6iTZWgfcWEbN9AsmeYRAskMeY\nFig6HRHnAgMBAAECggEARxFEHMlctiJR6ffLBCi56qa0FF7lz5um1zx0GjemesPL\nhZzn3hE7lhYdzDyTKj5bhSAllrxq+Iysh0qw2tuOmtsLRkuIlfdZ91833HcyUFk6\nml2PN26j8ox0N6HPmX3LzOjd54PbPQ0swTreA7VszFqwGpQNaOmpinRwW2QxEVu8\n2UPu6QjuekA3sUn/Ia8eXOwX4ZMFivMNNTzHjFWJsQbOrgSxJcGPCC5P+F8Fn/KO\n5bM0KJaLDpoP+Y19dwYZVA9JubhgFKuWAYP42zQnJdBwraPx7SxSEBgU0EsBpaKd\nWHEcuyxly9wpuDKaff81zYwLxnmr9EbPqJmBzf9bwQKBgQD2MkHAnEv1jZ3xwAhK\nTPXu13n/jhQi0cQ2BKCu14pjGIgT7kizg7373jmFhl70TZRmASQ/CKD6BGULJa6q\nJbJZQvP7lVOc32sGEUvQ2wlC9rMP+GDMlHuGfQJvMWjYTa4opW5woomwSHLMWbb+\nXlhblcJsbNUctlw4K/8huiMevwKBgQDMamJAV2oB/U3kIYUlL8hDCFkY6mBWcsmY\nR/tMW4z37uA5TV3ZVJd4gdLN+HplNKKyat4BoqTixrePRQ57lSVWJ2IN/Jkqtn/d\nUWTohtGiEUepCVb2pdglZWcw0AWbIOiajtpHOupO/kxLQNHbn4t82XGfQHFB2B1w\nAbWqOkp+2QKBgCK8vphNtU4FWFbG8KSDLWQw1Q7g3ih3jobMqlthIC6RRIoDYhCq\nMwE5vsX/SqCP3bNyz8lxDz2XpyYmf/mT7hE4KDLERBLrVy94+0iRz0G6i1NiiU30\nWWWFd/V2dEOo2jzz8pxD4seTwVbiBbboWvE5NUCVLpCpjmOCmbIJkHEDAoGBALfN\n/NSgBVkOnGhCX8eFRIxJyFun+8If6vd72hHZzFLvvzynPXj7IEwiaBv+jofMIXNO\ntps/1QV463ru/EvRW0YxmXC8LjmC6kxmMNcIyxzwbsAm/sQ/cbCGkpgIpNHNcHnx\nc4JTDnbDIHUWLt1Ng45as1kgB/bNzgJ19xS+31dZAoGBALMP2KBsO1kTV/NUSCqt\nPjOjJB7m06KX+dX8JmC/sNdGA0oZ10ALhgb5ZE50HbMqT9Y2T8jIHBlr7whvDtUT\nO1t5b5tuB4yUVWj4ezpDCANWnOfKM56XVgkP054LKKBt2OpjUBfvugY8+UTjTXkA\n71/PniTEBnjgUjMUUaRoXS1T\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n')
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(config)
    });
}

const db = admin.firestore();

// Attempt to find the correct bucket
async function getBucket() {
    const bucketsToTest = [
        "lps19-121b2.firebasestorage.app",
        "lps19-121b2.appspot.com"
    ];
    for (const bName of bucketsToTest) {
        try {
            const b = admin.storage().bucket(bName);
            await b.getMetadata();
            console.log(`Using bucket: ${bName}`);
            return b;
        } catch (e) {
            console.warn(`Bucket ${bName} not accessible: ${e.message}`);
        }
    }
    throw new Error('No accessible Firebase Storage bucket found.');
}

async function sync() {
    const bucket = await getBucket();
    const products = JSON.parse(fs.readFileSync('reconciled-products.json', 'utf8'));
    const firestoreData = JSON.parse(fs.readFileSync('firestore-data.json', 'utf8'));
    const categoriesMap = JSON.parse(fs.readFileSync('firestore-categories.json', 'utf8'));

    const existingMap = firestoreData.existingProducts;
    const defaultCategory = categoriesMap['UNISEX'];

    console.log(`Starting sync for ${products.length} products...`);
    let successCount = 0;
    let uploadCount = 0;
    
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        try {
            let imageUrl = null;
            
            if (p.imagePath && fs.existsSync(p.imagePath)) {
                const ext = path.extname(p.imagePath);
                const destination = `products/${p.brand.replace(/[^a-zA-Z0-9]/g, '_')}/${p.name.replace(/[^a-zA-Z0-9]/g, '_')}${ext}`;
                
                await bucket.upload(p.imagePath, {
                    destination: destination,
                    gzip: true,
                    metadata: {
                        cacheControl: 'public, max-age=31536000',
                    }
                });
                
                // Get signed URL that doesn't expire for 50 years to use as a persistent link
                // Or use the public link format: https://storage.googleapis.com/[BUCKET]/[PATH]
                // But for that to work the file must be made public.
                await bucket.file(destination).makePublic();
                imageUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
                uploadCount++;
            }
            
            const productData = {
                name: p.name,
                brand: p.brand,
                basePrice: p.price,
                price: p.price,
                description: `A fragrant creation from ${p.brand}.`,
                status: 'ACTIVE',
                categoryId: defaultCategory,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            
            if (imageUrl) {
                productData.image = imageUrl;
                productData.imageUrl = imageUrl;
            }
            
            const existingId = existingMap[p.name.toUpperCase()];
            if (existingId) {
                await db.collection('products').doc(existingId).update(productData);
            } else {
                productData.createdAt = admin.firestore.FieldValue.serverTimestamp();
                productData.slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
                productData.sales = { unitsSold: 0 };
                productData.stockWeight = 1000;
                await db.collection('products').add(productData);
            }
            
            successCount++;
            if (successCount % 20 === 0) {
                console.log(`Progress: ${successCount}/${products.length} (Uploaded ${uploadCount} images)`);
            }
        } catch (err) {
            console.error(`Error syncing ${p.name}:`, err.message);
        }
    }
    
    console.log(`Sync complete! ${successCount} products processed. ${uploadCount} images uploaded.`);
    process.exit(0);
}

sync().catch(console.error);
