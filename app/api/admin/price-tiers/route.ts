import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { logAdminAction, logSystemError } from "@/services/audit-service";
import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET price tiers for a product
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json({ error: "productId is required" }, { status: 400 });
        }

        const tiers = await prisma.priceTier.findMany({
            where: { productId },
            orderBy: { minQuantity: "asc" },
        });

        return NextResponse.json(tiers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create or update price tiers for a product (bulk replace)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, tiers } = body;

        if (!productId || !tiers || !Array.isArray(tiers)) {
            return NextResponse.json({ error: "productId and tiers array are required" }, { status: 400 });
        }

        // Delete existing tiers and replace
        await prisma.$transaction(async (tx) => {
            await tx.priceTier.deleteMany({ where: { productId } });
            if (tiers.length > 0) {
                await tx.priceTier.createMany({
                    data: tiers.map((t: { minQuantity: number; price: number }) => ({
                        productId,
                        minQuantity: t.minQuantity,
                        price: t.price,
                    })),
                });
            }
        });

        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;
        const payload = token ? await verifyJwtToken(token) : null;
        const adminId = payload?.sub as string | undefined;

        if (adminId) {
            await logAdminAction({
                adminId,
                action: "UPDATE_PRICE_TIERS",
                targetType: "PRODUCT",
                targetId: productId,
                metadata: { tiersUpdated: tiers.length },
            });
        }

        const updatedTiers = await prisma.priceTier.findMany({
            where: { productId },
            orderBy: { minQuantity: "asc" },
        });

        return NextResponse.json(updatedTiers, { status: 201 });
    } catch (error: any) {
        await logSystemError({
            message: error.message,
            path: "/api/admin/price-tiers",
            method: "POST",
            stackTrace: error.stack,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
