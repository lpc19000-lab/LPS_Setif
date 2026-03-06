"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartProduct {
    id: string;
    name: string;
    brand: string;
    imageUrl: string;
    wholesalePrice: number;
    unitsPerBox: number;
    minimumOrderQuantity: number;
    stockQuantity: number;
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
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => { success: boolean; error?: string };
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
    const totalPrice = items.reduce((sum, item) => sum + Number(item.product.wholesalePrice) * item.quantity, 0);

    const addItem = (product: CartProduct, quantityToAdd: number) => {
        let error = "";

        setItems(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            const currentQty = existing ? existing.quantity : 0;
            const newQty = currentQty + quantityToAdd;

            if (newQty > product.stockQuantity) {
                error = `Cannot add more. Only ${product.stockQuantity} in stock.`;
                return prev;
            }

            if (existing) {
                return prev.map(i => i.product.id === product.id ? { ...i, quantity: newQty } : i);
            } else {
                return [...prev, { id: product.id, product, quantity: newQty }];
            }
        });

        if (error) return { success: false, error };

        // Open mini cart on successful add
        setIsCartOpen(true);
        return { success: true };
    };

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(i => i.product.id !== productId));
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        let error = "";
        setItems(prev => {
            const existing = prev.find(i => i.product.id === productId);
            if (!existing) return prev;

            if (newQuantity > existing.product.stockQuantity) {
                error = `Cannot update. Only ${existing.product.stockQuantity} in stock.`;
                return prev;
            }

            if (newQuantity < existing.product.minimumOrderQuantity) {
                error = `Minimum order quantity is ${existing.product.minimumOrderQuantity}.`;
                return prev;
            }

            return prev.map(i => i.product.id === productId ? { ...i, quantity: newQuantity } : i);
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
