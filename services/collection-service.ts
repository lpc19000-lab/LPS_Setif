import prisma from "@/lib/db";

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ ──────────────────────────────────────────────────────────────────
export const getCollections = async () => {
    return await prisma.collection.findMany({
        include: { products: { select: { id: true } } },
        orderBy: { name: "asc" },
    });
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
    return await prisma.collection.create({ data: { name: data.name, slug } });
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateCollection = async (id: string, data: { name: string }) => {
    const slug = generateSlug(data.name);
    return await prisma.collection.update({ where: { id }, data: { name: data.name, slug } });
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteCollection = async (id: string) => {
    return await prisma.collection.delete({ where: { id } });
};
