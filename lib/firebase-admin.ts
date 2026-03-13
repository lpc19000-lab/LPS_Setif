import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Ensure Firebase Admin is initialized ONLY ONCE.
// This is critical for Next.js hot-reloading and Vercel environments.
const firebaseAdminApp = (() => {
    // Check if any apps are already initialized
    const apps = getApps();
    if (apps.length > 0) {
        return getApp();
    }

    // REQUIRED environment variables for Firebase Admin SDK
    const requiredEnvVars = [
        "FIREBASE_PROJECT_ID",
        "FIREBASE_CLIENT_EMAIL",
        "FIREBASE_PRIVATE_KEY"
    ];

    const missingVars = requiredEnvVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        // Warning instead of error to allow build to continue if this is just a build step
        console.warn(`Firebase Admin SDK: Missing environment variables (${missingVars.join(", ")}). Initialization skipped.`);
        return null;
    }

    try {
        return initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Handle escaped newlines in Vercel environment variables
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    } catch (error) {
        console.error("Firebase Admin initialization failed:", error);
        return null;
    }
})();

// Export initialized services safely. If the app is null, these will be null.
// Callers should ideally check for null if they run in environments where this might happen,
// but for API routes it should only happen during build if Next.js traces them.
export const adminDb = firebaseAdminApp ? getFirestore(firebaseAdminApp) : null as any;
export const adminAuth = firebaseAdminApp ? getAuth(firebaseAdminApp) : null as any;
export const adminStorage = firebaseAdminApp ? getStorage(firebaseAdminApp) : null as any;

export default firebaseAdminApp;
