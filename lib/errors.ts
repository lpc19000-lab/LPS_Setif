import { NextResponse } from "next/server";

// ── Standardized Application Error Classes ─────────────────────────────────
// Used by all API routes and services for consistent error responses.

export type ErrorCode =
  | "INVALID_INPUT"
  | "PRODUCT_NOT_FOUND"
  | "OUT_OF_STOCK"
  | "MINIMUM_ORDER_NOT_MET"
  | "UNITS_PER_BOX_MISMATCH"
  | "DUPLICATE_ORDER"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// ── Convenience Factories ──────────────────────────────────────────────────

export const Errors = {
  invalidInput: (msg: string) => new AppError("INVALID_INPUT", msg, 400),
  productNotFound: (id: string) => new AppError("PRODUCT_NOT_FOUND", `Product not found: ${id}`, 404),
  outOfStock: (name: string, available: number, requested: number) =>
    new AppError("OUT_OF_STOCK", `Insufficient stock for "${name}". Available: ${available}, Requested: ${requested}`, 400),
  minimumNotMet: (name: string, min: number, requested: number) =>
    new AppError("MINIMUM_ORDER_NOT_MET", `Minimum order for "${name}" is ${min}. You requested ${requested}.`, 400),
  unitsPerBoxMismatch: (name: string, upb: number, requested: number) =>
    new AppError("UNITS_PER_BOX_MISMATCH", `Quantity for "${name}" must be a multiple of ${upb}. You requested ${requested}.`, 400),
  duplicateOrder: () => new AppError("DUPLICATE_ORDER", "An order is already being processed. Please wait.", 429),
  unauthorized: () => new AppError("UNAUTHORIZED", "Authentication required.", 401),
  forbidden: () => new AppError("FORBIDDEN", "You do not have permission.", 403),
  notFound: (entity: string) => new AppError("NOT_FOUND", `${entity} not found.`, 404),
  rateLimited: () => new AppError("RATE_LIMITED", "Too many requests. Please try again later.", 429),
  internal: (msg = "Internal server error") => new AppError("INTERNAL_ERROR", msg, 500),
};

// ── JSON Response Helper ───────────────────────────────────────────────────

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error_code: error.code, message: error.message },
      { status: error.statusCode }
    );
  }
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  return NextResponse.json(
    { success: false, error_code: "INTERNAL_ERROR" as ErrorCode, message },
    { status: 500 }
  );
}
