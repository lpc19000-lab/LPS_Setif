const admin = require('firebase-admin');

const config = {
    projectId: "lps19-121b2",
    clientEmail: "firebase-adminsdk-fbsvc@lps19-121b2.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDEllux1BpyLikx\na6G71lBXfJfput6S4cWCbzOMd3ioJ9ThXFY3KY23JbAQ4cglL9JlWbavPbH+9Xc0\nPwSvRFlHNA+/PdZv8U3T7VHxug3/sUhZH8jnTCY4c49+63Yo2/ek8Jmy/6QI6HbB\nSCDVNG7Wt9NHk4Opojx3yahuhdyINL30bn9ih1NsIi+J1Nd5cHCs5KbyMphHXqcv\n43pTWJk1fJzP+ryAXUlCU456eQflR89AP4+ApINsjjd6qP7hIcU45cSDYcycT4lS\n+qiEW0mV086jzflEP7HljDY/PGvrHMfnuO75sFg6iTZWgfcWEbN9AsmeYRAskMeY\nFig6HRHnAgMBAAECggEARxFEHMlctiJR6ffLBCi56qa0FF7lz5um1zx0GjemesPL\nhZzn3hE7lhYdzDyTKj5bhSAllrxq+Iysh0qw2tuOmtsLRkuIlfdZ91833HcyUFk6\nml2PN26j8ox0N6HPmX3LzOjd54PbPQ0swTreA7VszFqwGpQNaOmpinRwW2QxEVu8\n2UPu6QjuekA3sUn/Ia8eXOwX4ZMFivMNNTzHjFWJsQbOrgSxJcGPCC5P+F8Fn/KO\n5bM0KJaLDpoP+Y19dwYZVA9JubhgFKuWAYP42zQnJdBwraPx7SxSEBgU0EsBpaKd\nWHEcuyxly9wpuDKaff81zYwLxnmr9EbPqJmBzf9bwQKBgQD2MkHAnEv1jZ3xwAhK\nTPXu13n/jhQi0cQ2BKCu14pjGIgT7kizg7373jmFhl70TZRmASQ/CKD6BGULJa6q\nJbJZQvP7lVOc32sGEUvQ2wlC9rMP+GDMlHuGfQJvMWjYTa4opW5woomwSHLMWbb+\nXlhblcJsbNUctlw4K/8huiMevwKBgQDMamJAV2oB/U3kIYUlL8hDCFkY6mBWcsmY\nR/tMW4z37uA5TV3ZVJd4gdLN+HplNKKyat4BoqTixrePRQ57lSVWJ2IN/Jkqtn/d\ UWTohtGiEUepCVb2pdglZWcw0AWbIOiajtpHOupO/kxLQNHbn4t82XGfQHFB2B1w\nAbWqOkp+2QKBgCK8vphNtU4FWFbG8KSDLWQw1Q7g3ih3jobMqlthIC6RRIoDYhCq\nMwE5vsX/SqCP3bNyz8lxDz2XpyYmf/mT7hE4KDLERBLrVy94+0iRz0G6i1NiiU30\nWWWFd/V2dEOo2jzz8pxD4seTwVbiBbboWvE5NUCVLpCpjmOCmbIJkHEDAoGBALfN\n/NSgBVkOnGhCX8eFRIxJyFun+8If6vd72hHZzFLvvzynPXj7IEwiaBv+jofMIXNO\ntps/1QV463ru/EvRW0YxmXC8LjmC6kxmMNcIyxzwbsAm/sQ/cbCGkpgIpNHNcHnx\nc4JTDnbDIHUWLt1Ng45as1kgB/bNzgJ19xS+31dZAoGBALMP2KBsO1kTV/NUSCqt\nPjOjJB7m06KX+dX8JmC/sNdGA0oZ10ALhgb5ZE50HbMqT9Y2T8jIHBlr7whvDtUT\nO1t5b5tuB4yUVWj4ezpDCANWnOfKM56XVgkP054LKKBt2OpjUBfvugY8+UTjTXkA\n71/PniTEBnjgUjMUUaRoXS1T\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n')
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(config)
    });
}

const db = admin.firestore();

const foundImages = [
    { name: "ABSOLU AVENTUS 2025", url: "https://creedboutique.com/cdn/shop/files/1500x1500__0000_Absolu-Aventus-100ml-Bottle_1__jpg.jpg?v=1746739740&width=832" },
    { name: "ALMAZ KAJAL TQ", url: "https://nichestory.eu/wp-content/uploads/2025/10/Almaz-By-Kajal-nichestory.eu-1A.webp" },
    { name: "AL THAIR TQ", url: "https://parfums-de-marly.com/cdn/shop/files/ALTHAIR-PERFUME-75-PACK1-1X1_CENTERED_8e536321-9220-4ece-91fd-de6b13f6896d.png?v=1759501405" },
    { name: "ASAD ZANZIBAR TQ++", url: "https://zaoud.it/cdn/shop/files/Asad_zanzibar_edp_perfume_bottle_against_white_background.jpg?v=1710628032&width=1100" },
    { name: "AMIR BANAFA3 TQ ++", url: "https://lattafa.com/wp-content/uploads/2022/10/Ameer-Al-Arab-Lattafa-Perfumes-main.jpg" }
];

async function updateImages() {
    for (const item of foundImages) {
        try {
            const query = await db.collection('products').where('name', '==', item.name).get();
            if (!query.empty) {
                const docId = query.docs[0].id;
                await db.collection('products').doc(docId).update({
                    image: item.url,
                    imageUrl: item.url,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`Updated ${item.name} with URL.`);
            } else {
                console.log(`Product ${item.name} not found in Firestore.`);
            }
        } catch (e) {
            console.error(`Error updating ${item.name}:`, e.message);
        }
    }
    process.exit(0);
}

updateImages();
