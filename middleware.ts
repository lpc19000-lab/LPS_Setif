import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwtToken } from "./lib/auth";
import { isRateLimited } from "./lib/rate-limit";

export const config = {
    matcher: ["/admin/:path*", "/account/:path*", "/api/:path*"],
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── RATE LIMITING (API routes only) ─────────────────────────────────────
    if (pathname.startsWith("/api/")) {
        const rateLimitedPaths = ["/api/orders", "/api/cart", "/api/customers/login", "/api/customers/register"];
        const shouldLimit = rateLimitedPaths.some((p) => pathname.startsWith(p));

        if (shouldLimit) {
            const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                        request.headers.get("x-real-ip") ||
                        "unknown";
            if (isRateLimited(ip)) {
                return NextResponse.json(
                    { success: false, error_code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
                    { status: 429 }
                );
            }
        }
    }

    // ── ADMIN PROTECTION ──────────────────────────────────────────────────
    if (pathname.startsWith("/admin")) {
        if (pathname.startsWith("/admin/login")) {
            const token = request.cookies.get("admin_token")?.value;
            if (token) {
                const payload = await verifyJwtToken(token);
                if (payload && (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN")) {
                    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
                }
            }
            return NextResponse.next();
        }

        const token = request.cookies.get("admin_token")?.value;
        if (!token) return NextResponse.redirect(new URL("/admin/login", request.url));

        try {
            const payload = await verifyJwtToken(token);
            if (!payload || (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN")) {
                return NextResponse.redirect(new URL("/admin/login", request.url));
            }
            return NextResponse.next();
        } catch (error) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    // ── CUSTOMER (TRADER) PROTECTION ───────────────────────────────────────
    if (pathname.startsWith("/account")) {
        const token = request.cookies.get("customer_token")?.value;
        if (!token) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        try {
            const payload = await verifyJwtToken(token);
            if (!payload || payload.role !== "TRADER") {
                return NextResponse.redirect(new URL("/login", request.url));
            }
            return NextResponse.next();
        } catch (error) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}
