import prisma from "@/lib/db";
import { unstable_cache, revalidateTag } from "next/cache";

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ (cached) ─────────────────────────────────────────────────────────
export const getCollections = () => {
    return unstable_cache(
        async () => {
            return await prisma.collection.findMany({
                include: { products: { select: { id: true } } },
                orderBy: { name: "asc" },
            });
        },
        ['collections-list'],
        { revalidate: 300, tags: ['collections'] }
    )();
};

export const getCollectionBySlug = async (slug: string) => {
    return await prisma.collection.findUnique({
        where: { slug },
        include: {
            products: {
                include: {
                    product: {
                        include: {
                            category: true,
                            images: { orderBy: { position: "asc" }, take: 1 },
                        },
                    },
                },
                where: { product: { status: "ACTIVE" } },
            },
        },
    });
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createCollection = async (data: { name: string }) => {
    const slug = generateSlug(data.name);
    const result = await prisma.collection.create({ data: { name: data.name, slug } });
    revalidateTag('collections', "max");
    return result;
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateCollection = async (id: string, data: { name: string }) => {
    const slug = generateSlug(data.name);
    const result = await prisma.collection.update({ where: { id }, data: { name: data.name, slug } });
    revalidateTag('collections', "max");
    return result;
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteCollection = async (id: string) => {
    const result = await prisma.collection.delete({ where: { id } });
    revalidateTag('collections', "max");
    return result;
};
