"use client";

import { useEffect, useRef } from "react";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { getApp, getApps, initializeApp } from "firebase/app";

// Initialize Firebase client (reuse if already initialized)
function getFirebaseApp() {
    if (getApps().length > 0) return getApp();
    return initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
}

/**
 * Hook for subscribing to Firebase Firestore real-time changes.
 * Uses onSnapshot to listen for document changes in a collection.
 */
export function useRealtime(
    collectionName: string,
    callback: (payload: any) => void,
    event: "INSERT" | "UPDATE" | "DELETE" | "*" = "*",
    filter?: string
) {
    const callbackRef = useRef(callback);

    // Keep the callback ref up to date without re-subscribing
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const app = getFirebaseApp();
        const db = getFirestore(app);
        const col = collection(db, collectionName);
        const q = query(col, orderBy("createdAt", "desc"));

        // Track previous snapshot to detect changes
        let isFirstSnapshot = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (isFirstSnapshot) {
                isFirstSnapshot = false;
                return; // Skip initial load
            }

            snapshot.docChanges().forEach((change) => {
                const data = { id: change.doc.id, ...change.doc.data() };
                const eventType = change.type === "added" ? "INSERT" :
                    change.type === "modified" ? "UPDATE" :
                        change.type === "removed" ? "DELETE" : "*";

                if (event === "*" || event === eventType) {
                    callbackRef.current({
                        eventType,
                        new: data,
                        old: change.type === "removed" ? data : {},
                    });
                }
            });
        });

        return () => unsubscribe();
    }, [collectionName, event, filter]);
}
