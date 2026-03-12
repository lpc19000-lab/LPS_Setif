/**
 * Centralized Firebase Schema Types
 * Unified as per project audit requirements.
 */

export interface Admin {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  createdAt: Date;
  name?: string;
  passwordHash?: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  shopName: string;
  wilaya: string;
  commune?: string;
  address: string;
  createdAt: Date;
  ordersCount: number;
  wilayaNumber?: string;
  wilayaName?: string;
  passwordHash?: string;
  role?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string | { id: string; name?: string; slug?: string } | null;
  description: string;
  price: number; // Unified name for basePrice
  image: string; // Unified name for imageUrl
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  stockWeight: number;
  volumes?: {
    id: string;
    weight: number;
    price: number;
  }[];
  // Internal fields preserved for compatibility
  basePrice?: number;
  imageUrl?: string;
  categoryId?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  volumeId: string;
  volume: any;
  product?: {
    name: string;
    brand: string;
    imageUrl: string;
  };
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  totalPrice: number;
  createdAt: Date;
  customer?: {
    id: string;
    email: string;
    name: string;
    shopName: string;
    phone: string;
    address: string;
    wilaya: string;
    wilayaName?: string;
  } | null;
  wilayaName?: string;
  shipping?: {
    company?: string;
    trackingNumber?: string;
    date?: Date;
  };
  invoice?: {
    number?: string;
    url?: string;
    date?: Date;
    totalAmount?: number;
  };
  logs?: {
    status: string;
    changedBy: string;
    message: string;
    createdAt: Date;
  }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: Date;
}
