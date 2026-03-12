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
    console.log(`[Middleware] Debug: Pathname: ${pathname}`);

    // ── RATE LIMITING (API routes only) ─────────────────────────────────────
    if (pathname.startsWith("/api/")) {
        const rateLimitedPaths = ["/api/orders", "/api/cart", "/api/customers/login", "/api/customers/register"];
        const shouldLimit = rateLimitedPaths.some((p) => pathname.startsWith(p));

        if (shouldLimit) {
            const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                request.headers.get("x-real-ip") ||
                "unknown";
            if (isRateLimited(ip)) {
                console.log(`[Middleware] Rate limited IP: ${ip}`);
                return NextResponse.json(
                    { success: false, error_code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
                    { status: 429 }
                );
            }
        }
        // Bypass next-intl for API routes
        return NextResponse.next();
    }

    // Locale handling
    const handleIntl = (req: NextRequest) => intlMiddleware(req);

    // ── ADMIN PROTECTION ──────────────────────────────────────────────────
    if (pathname.includes("/admin")) {
        // Find current locale from pathname or cookie, default to 'fr'
        const locale = pathname.split('/')[1] || routing.defaultLocale;
        const isValidLocale = routing.locales.includes(locale as any);
        const lang = isValidLocale ? locale : routing.defaultLocale;

        const adminLoginPath = `/${lang}/admin/login`;
        const adminDashboardPath = `/${lang}/admin/dashboard`;

        if (pathname.includes("/admin/login")) {
            const token = request.cookies.get("admin_token")?.value;
            console.log(`[Middleware] Admin Login Path. Token exists: ${!!token}`);
            if (token) {
                const payload = await verifyJwtToken(token);
                console.log(`[Middleware] Admin Token Payload:`, payload);
                if (payload && (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN" || payload.role === "VENDOR")) {
                    console.log(`[Middleware] Valid Admin Token. Redirecting to dashboard.`);
                    return NextResponse.redirect(new URL(adminDashboardPath, request.url));
                }
            }
            return handleIntl(request);
        }

        const token = request.cookies.get("admin_token")?.value;
        console.log(`[Middleware] Admin Protected Path. Token exists: ${!!token}`);
        if (!token) {
            console.log(`[Middleware] No admin token. Redirecting to login.`);
            return NextResponse.redirect(new URL(adminLoginPath, request.url));
        }

        try {
            const payload = await verifyJwtToken(token);
            console.log(`[Middleware] Admin Token Payload:`, payload);
            if (!payload || (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN" && payload.role !== "VENDOR")) {
                console.log(`[Middleware] Invalid/Unauthorized Admin Token. Redirecting to login.`);
                return NextResponse.redirect(new URL(adminLoginPath, request.url));
            }
            return handleIntl(request);
        } catch (error) {
            console.error("[Middleware] Admin auth error:", error);
            return NextResponse.redirect(new URL(adminLoginPath, request.url));
        }
    }

    // ── CUSTOMER (TRADER) PROTECTION ───────────────────────────────────────
    if (pathname.includes("/account")) {
        const locale = pathname.split('/')[1] || routing.defaultLocale;
        const isValidLocale = routing.locales.includes(locale as any);
        const lang = isValidLocale ? locale : routing.defaultLocale;
        const loginPath = `/${lang}/login`;

        const token = request.cookies.get("customer_token")?.value;
        console.log(`[Middleware] Account Protected Path. Token exists: ${!!token}`);
        if (!token) {
            console.log(`[Middleware] No customer token. Redirecting to login.`);
            return NextResponse.redirect(new URL(loginPath, request.url));
        }

        try {
            const payload = await verifyJwtToken(token);
            console.log(`[Middleware] Customer Token Payload:`, payload);
            if (!payload) {
                console.log(`[Middleware] Invalid Customer Token. Redirecting to login.`);
                return NextResponse.redirect(new URL(loginPath, request.url));
            }
            return handleIntl(request);
        } catch (error) {
            console.error("[Middleware] Customer auth error:", error);
            return NextResponse.redirect(new URL(loginPath, request.url));
        }
    }

    return handleIntl(request);
}
