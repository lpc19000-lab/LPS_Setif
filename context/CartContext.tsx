"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartProduct {
    id: string;
    name: string;
    brand: string;
    imageUrl: string;
    basePrice: number;
    volumeId: string;
    weight: number;
    stockWeight: number; // For gram-based validation
}

export interface CartItem {
    id: string; // unique ID for the cart item, could match product.id here
    product: CartProduct;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    totalQuantity: number;
    totalPrice: number;
    addItem: (product: CartProduct, quantity: number) => { success: boolean; error?: string };
    removeItem: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, newQuantity: number) => { success: boolean; error?: string };
    clearCart: () => void;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        setIsMounted(true);
        try {
            const saved = localStorage.getItem("lps_cart");
            if (saved) {
                setItems(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to load cart from localStorage", e);
        }
    }, []);

    // Save to localStorage when items change
    useEffect(() => {
        if (isMounted) {
            localStorage.setItem("lps_cart", JSON.stringify(items));
        }
    }, [items, isMounted]);

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (Number(item.product.basePrice) * item.quantity), 0);

    const addItem = (product: CartProduct, quantityToAdd: number) => {
        let error = "";

        setItems(prev => {
            // Check for existing item WITH SAME VOLUME ID
            const existing = prev.find(i =>
                i.product.id === product.id &&
                i.product.volumeId === product.volumeId
            );

            const currentQty = existing ? existing.quantity : 0;
            const newQty = currentQty + quantityToAdd;

            const totalWeightRequired = newQty * product.weight;
            if (totalWeightRequired > product.stockWeight) {
                const available = product.stockWeight >= 1000 ? `${(product.stockWeight / 1000).toFixed(2)}kg` : `${product.stockWeight}g`;
                error = `Insufficient stock. Only ${available} available.`;
                return prev;
            }

            if (existing) {
                return prev.map(i =>
                    (i.product.id === product.id && i.product.volumeId === product.volumeId)
                        ? { ...i, quantity: newQty }
                        : i
                );
            } else {
                return [...prev, { id: `${product.id}-${product.volumeId}`, product, quantity: newQty }];
            }
        });

        if (error) return { success: false, error };

        // Open mini cart on successful add
        setIsCartOpen(true);
        return { success: true };
    };

    const removeItem = (cartItemId: string) => {
        setItems(prev => prev.filter(i => i.id !== cartItemId));
    };

    const updateQuantity = (cartItemId: string, newQuantity: number) => {
        let error = "";
        setItems(prev => {
            const existing = prev.find(i => i.id === cartItemId);
            if (!existing) return prev;

            const totalWeightRequired = newQuantity * existing.product.weight;
            if (totalWeightRequired > existing.product.stockWeight) {
                const available = existing.product.stockWeight >= 1000 ? `${(existing.product.stockWeight / 1000).toFixed(2)}kg` : `${existing.product.stockWeight}g`;
                error = `Insufficient stock. Only ${available} available.`;
                return prev;
            }

            if (newQuantity < 1) {
                error = `Minimum quantity is 1 unit.`;
                return prev;
            }

            return prev.map(i => i.id === cartItemId ? { ...i, quantity: newQuantity } : i);
        });

        if (error) return { success: false, error };
        return { success: true };
    };

    const clearCart = () => {
        setItems([]);
    };

    return (
        <CartContext.Provider value={{
            items,
            totalQuantity,
            totalPrice,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            isCartOpen,
            setIsCartOpen
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
