import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwtToken } from "./lib/auth";
import { isRateLimited } from "./lib/rate-limit";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export const config = {
    matcher: ["/((?!api|_next|.*\\..*).*)", "/admin/:path*", "/account/:path*", "/api/:path*"],
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

    // Locale handling
    const handleIntl = (req: NextRequest) => intlMiddleware(req);

    // ── ADMIN PROTECTION ──────────────────────────────────────────────────
    if (pathname.includes("/admin")) {
        const adminLoginPath = "/admin/login";
        if (pathname.includes(adminLoginPath)) {
            const token = request.cookies.get("admin_token")?.value;
            if (token) {
                const payload = await verifyJwtToken(token);
                if (payload && (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN")) {
                    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
                }
            }
            return handleIntl(request);
        }

        const token = request.cookies.get("admin_token")?.value;
        if (!token) return NextResponse.redirect(new URL("/admin/login", request.url));

        try {
            const payload = await verifyJwtToken(token);
            if (!payload || (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN")) {
                return NextResponse.redirect(new URL("/admin/login", request.url));
            }
            return handleIntl(request);
        } catch (error) {
            console.error("Admin auth error:", error);
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    // ── CUSTOMER (TRADER) PROTECTION ───────────────────────────────────────
    if (pathname.includes("/account")) {
        const token = request.cookies.get("customer_token")?.value;
        if (!token) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        try {
            const payload = await verifyJwtToken(token);
            if (!payload || payload?.role !== "TRADER") {
                return NextResponse.redirect(new URL("/login", request.url));
            }
            return handleIntl(request);
        } catch (error) {
            console.error("Customer auth error:", error);
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return handleIntl(request);
}
