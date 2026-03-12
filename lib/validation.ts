import { z } from "zod";

// ── Product Validation ─────────────────────────────────────────────────────

export const volumeSchema = z.object({
  weight: z.number().int().positive(),
  price: z.number().positive(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  slug: z.string().min(1).max(200).optional(),
  brand: z.string().min(1, "Brand is required").max(100),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  imageUrl: z.string().url("Invalid image URL"),
  basePrice: z.number().positive("Base price must be positive"),
  stockWeight: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
  volumes: z.array(volumeSchema).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ── Customer Registration Validation ───────────────────────────────────────

export const customerRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .min(9, "Phone must be at least 9 digits")
    .max(15)
    .regex(/^[0-9+\-\s]+$/, "Invalid phone number format"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  shopName: z.string().min(2, "Shop name is required").max(150),
  wilayaNumber: z.string().min(1, "Wilaya number is required"),
  wilayaName: z.string().min(1, "Wilaya name is required"),
  commune: z.string().min(1, "Commune is required"),
  address: z.string().min(5, "Address must be at least 5 characters").max(500),
});

export const customerLoginSchema = z.object({
  phone: z.string().min(9).max(15),
  password: z.string().min(1, "Password is required"),
});

// ── Order Payload Validation ───────────────────────────────────────────────

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  volumeId: z.string().min(1, "Volume is required"),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  shippingData: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      wilayaNumber: z.string().optional(),
      wilayaName: z.string().optional(),
      wilaya: z.string().optional(), // Combined string for backward compat
      address: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

// ── Cart Validation ────────────────────────────────────────────────────────

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  volumeId: z.string().min(1),
});

// ── Category Validation ────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().max(500).optional(),
});

// ── Admin Data Validation ──────────────────────────────────────────────────

export const stockUpdateSchema = z.object({
  stockWeight: z.number().int().min(0, "Stock cannot be negative"),
});

export const priceUpdateSchema = z.object({
  basePrice: z.number().positive("Price must be positive"),
});

// ── Helper: Format Zod Errors ──────────────────────────────────────────────

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
}

