"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { getApp, getApps, initializeApp } from "firebase/app";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

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

interface UseRealtimeOptions<T> {
    table: string;
    event?: RealtimeEvent;
    schema?: string;
    onInsert?: (newRecord: T) => void;
    onUpdate?: (newRecord: T) => void;
    onDelete?: (oldRecord: T) => void;
    onChange?: (payload: { eventType: string; new: T; old: T }) => void;
}

/**
 * Firebase Firestore Realtime Hook
 * Subscribes to real-time changes on a specific collection.
 * 
 * Usage:
 * ```
 * useRealtime<Product>({
 *   table: 'products',
 *   onChange: (payload) => {
 *     console.log('Change:', payload);
 *     router.refresh(); // or update state
 *   }
 * });
 * ```
 */
export function useRealtime<T = any>({
    table,
    event = "*",
    onInsert,
    onUpdate,
    onDelete,
    onChange,
}: UseRealtimeOptions<T>) {
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const app = getFirebaseApp();
        const db = getFirestore(app);
        const col = collection(db, table);

        let isFirstSnapshot = true;

        const unsubscribe = onSnapshot(col, (snapshot) => {
            if (!isSubscribed) setIsSubscribed(true);

            if (isFirstSnapshot) {
                isFirstSnapshot = false;
                return; // Skip initial load
            }

            snapshot.docChanges().forEach((change) => {
                const newRecord = { id: change.doc.id, ...change.doc.data() } as T;
                const oldRecord = change.type === "removed" ? newRecord : ({} as T);
                const eventType = change.type === "added" ? "INSERT" :
                    change.type === "modified" ? "UPDATE" :
                        change.type === "removed" ? "DELETE" : "*";

                if (event !== "*" && event !== eventType) return;

                if (eventType === "INSERT" && onInsert) onInsert(newRecord);
                if (eventType === "UPDATE" && onUpdate) onUpdate(newRecord);
                if (eventType === "DELETE" && onDelete) onDelete(oldRecord);

                if (onChange) {
                    onChange({ eventType, new: newRecord, old: oldRecord });
                }
            });
        });

        return () => {
            unsubscribe();
            setIsSubscribed(false);
        };
    }, [table, event]);

    return { isSubscribed };
}

/**
 * Hook to auto-refresh on collection changes.
 * Triggers lastUpdate timestamp when any change occurs.
 */
export function useRealtimeRefresh(tables: string[]) {
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

    useEffect(() => {
        const app = getFirebaseApp();
        const db = getFirestore(app);

        let isFirstSnapshot = true;

        const unsubscribers = tables.map((table) => {
            return onSnapshot(collection(db, table), () => {
                if (isFirstSnapshot) {
                    isFirstSnapshot = false;
                    return;
                }
                setLastUpdate(Date.now());
            });
        });

        return () => {
            unsubscribers.forEach((unsub) => unsub());
        };
    }, [tables.join(",")]);

    return { lastUpdate };
}
