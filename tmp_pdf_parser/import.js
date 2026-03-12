const fs = require("fs");
const admin = require("firebase-admin");

// Ensure service account path is correct (from project context)
// We will generate a quick credential file below if needed, but normally use application default or env vars.
// The user provided the raw JSON text for the service account in the context.

const serviceAccount = {
  "type": "service_account",
  "project_id": "lps19-121b2",
  "private_key_id": "c5829893dc7cf84c05ea8b6a928e2fed7cd2324f",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDEllux1BpyLikx\na6G71lBXfJfput6S4cWCbzOMd3ioJ9ThXFY3KY23JbAQ4cglL9JlWbavPbH+9Xc0\nPwSvRFlHNA+/PdZv8U3T7VHxug3/sUhZH8jnTCY4c49+63Yo2/ek8Jmy/6QI6HbB\nSCDVNG7Wt9NHk4Opojx3yahuhdyINL30bn9ih1NsIi+J1Nd5cHCs5KbyMphHXqcv\n43pTWJk1fJzP+ryAXUlCU456eQflR89AP4+ApINsjjd6qP7hIcU45cSDYcycT4lS\n+qiEW0mV086jzflEP7HljDY/PGvrHMfnuO75sFg6iTZWgfcWEbN9AsmeYRAskMeY\nFig6HRHnAgMBAAECggEARxFEHMlctiJR6ffLBCi56qa0FF7lz5um1zx0GjemesPL\nhZzn3hE7lhYdzDyTKj5bhSAllrxq+Iysh0qw2tuOmtsLRkuIlfdZ91833HcyUFk6\nml2PN26j8ox0N6HPmX3LzOjd54PbPQ0swTreA7VszFqwGpQNaOmpinRwW2QxEVu8\n2UPu6QjuekA3sUn/Ia8eXOwX4ZMFivMNNTzHjFWJsQbOrgSxJcGPCC5P+F8Fn/KO\n5bM0KJaLDpoP+Y19dwYZVA9JubhgFKuWAYP42zQnJdBwraPx7SxSEBgU0EsBpaKd\nWHEcuyxly9wpuDKaff81zYwLxnmr9EbPqJmBzf9bwQKBgQD2MkHAnEv1jZ3xwAhK\nTPXu13n/jhQi0cQ2BKCu14pjGIgT7kizg7373jmFhl70TZRmASQ/CKD6BGULJa6q\nJbJZQvP7lVOc32sGEUvQ2wlC9rMP+GDMlHuGfQJvMWjYTa4opW5woomwSHLMWbb+\nXlhblcJsbNUctlw4K/8huiMevwKBgQDMamJAV2oB/U3kIYUlL8hDCFkY6mBWcsmY\nR/tMW4z37uA5TV3ZVJd4gdLN+HplNKKyat4BoqTixrePRQ57lSVWJ2IN/Jkqtn/d\nUWTohtGiEUepCVb2pdglZWcw0AWbIOiajtpHOupO/kxLQNHbn4t82XGfQHFB2B1w\nAbWqOkp+2QKBgCK8vphNtU4FWFbG8KSDLWQw1Q7g3ih3jobMqlthIC6RRIoDYhCq\nMwE5vsX/SqCP3bNyz8lxDz2XpyYmf/mT7hE4KDLERBLrVy94+0iRz0G6i1NiiU30\nWWWFd/V2dEOo2jzz8pxD4seTwVbiBbboWvE5NUCVLpCpjmOCmbIJkHEDAoGBALfN\n/NSgBVkOnGhCX8eFRIxJyFun+8If6vd72hHZzFLvvzynPXj7IEwiaBv+jofMIXNO\ntps/1QV463ru/EvRW0YxmXC8LjmC6kxmMNcIyxzwbsAm/sQ/cbCGkpgIpNHNcHnx\nc4JTDnbDIHUWLt1Ng45as1kgB/bNzgJ19xS+31dZAoGBALMP2KBsO1kTV/NUSCqt\nPjOjJB7m06KX+dX8JmC/sNdGA0oZ10ALhgb5ZE50HbMqT9Y2T8jIHBlr7whvDtUT\nO1t5b5tuB4yUVWj4ezpDCANWnOfKM56XVgkP054LKKBt2OpjUBfvugY8+UTjTXkA\n71/PniTEBnjgUjMUUaRoXS1T\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@lps19-121b2.iam.gserviceaccount.com"
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

function guessCategory(name) {
    name = name.toLowerCase();
    if (name.includes("femme") || name.includes("girl") || name.includes("elle")) return "Women";
    if (name.includes("homme") || name.includes("man") || name.includes("boy")) return "Men";
    if (name.includes("oud") || name.includes("arab")) return "Niche";
    return "Unisex";
}

async function runImport() {
    const text = fs.readFileSync('extracted_text.txt', 'utf8');
    const lines = text.split('\n');

    let currentBrand = "LPS";
    const products = [];

    // Simple parser
    for (let line of lines) {
        line = line.trim();
        if (!line || line === 'Perfume NamePrice' || line.includes("Page ") || line.match(/^[0-9]+$/)) continue;

        if (line.startsWith("Brand: ")) {
            currentBrand = line.replace("Brand: ", "").trim();
            continue;
        }

        // lines often look like: "1881 FEMME1,600.00 DA" or "212 MAN1,550.00 DA"
        // Try to match the price at the end
        const match = line.match(/(.+?)(\d[\d,]*\.00 DA)/);
        if (match) {
            let name = match[1].trim();
            let priceStr = match[2].trim();
            let priceNumeric = parseFloat(priceStr.replace(/,/g, '').replace(' DA', ''));
            // Multiply by 100 if handling cents/dinars properly, depending on existing store architecture (stored in cents typically)
            
            // Generate basic fallback image path from brand
            const fallbackImage = `https://firebasestorage.googleapis.com/v0/b/lps19-121b2.firebasestorage.app/o/products%2Fbrand_${currentBrand.toLowerCase().replace(/[^a-z0-9]/g, '')}.jpg?alt=media`;

            const catName = guessCategory(name);

            products.push({
                name,
                brand: currentBrand,
                basePrice: priceNumeric * 100, // storing in cents
                price: priceNumeric * 100,
                description: `A fragrant creation from ${currentBrand}.`,
                status: "ACTIVE",
                stockWeight: 5000, 
                categoryName: catName, // We can resolve categoryId next
                imageUrl: fallbackImage,
                image: fallbackImage,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now() + Math.floor(Math.random()*1000)
            });
        }
    }

    console.log(`Parsed ${products.length} products. Starting batch upload...`);

    // Ensure Categories Exist First
    const catsCache = {};
    for (let p of products) {
        if (!catsCache[p.categoryName]) {
            const catQuery = await db.collection("categories").where("name", "==", p.categoryName).get();
            if (catQuery.empty) {
                const cRef = await db.collection("categories").add({
                    name: p.categoryName,
                    slug: p.categoryName.toLowerCase(),
                    createdAt: new Date()
                });
                catsCache[p.categoryName] = cRef.id;
                console.log("Created category:", p.categoryName);
            } else {
                catsCache[p.categoryName] = catQuery.docs[0].id;
            }
        }
        p.categoryId = catsCache[p.categoryName];
        delete p.categoryName;
    }

    // Batch chunking (500 limit per batch in Firestore)
    const chunkSize = 100;
    for (let i = 0; i < products.length; i += chunkSize) {
        const batch = db.batch();
        const chunk = products.slice(i, i + chunkSize);
        
        chunk.forEach(pData => {
            const ref = db.collection("products").doc();
            batch.set(ref, pData);
        });

        await batch.commit();
        console.log(`Uploaded batch ${i/chunkSize + 1}`);
    }

    console.log("Import Complete!");
}

runImport().catch(console.error);
