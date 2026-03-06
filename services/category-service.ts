import prisma from "@/lib/db";

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ ──────────────────────────────────────────────────────────────────
export const getCategories = async () => {
    return await prisma.category.findMany({
        include: { products: { select: { id: true } } },
        orderBy: { name: "asc" },
    });
};

export const getCategoryById = async (id: string) => {
    return await prisma.category.findUnique({
        where: { id },
        include: {
            products: {
                where: { status: "ACTIVE" },
                include: { category: true, images: { orderBy: { position: "asc" }, take: 1 } },
                orderBy: { createdAt: "desc" },
            },
        },
    });
};

export const getCategoryBySlug = async (slug: string) => {
    return await prisma.category.findUnique({
        where: { slug },
        include: {
            products: {
                where: { status: "ACTIVE" },
                include: { category: true, images: { orderBy: { position: "asc" }, take: 1 } },
                orderBy: { createdAt: "desc" },
            },
        },
    });
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createCategory = async (data: {
    name: string;
    description?: string;
}) => {
    const slug = generateSlug(data.name);
    return await prisma.category.create({ data: { ...data, slug } });
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateCategory = async (
    id: string,
    data: Partial<{ name: string; description: string }>
) => {
    const updateData: Record<string, unknown> = { ...data };
    if (data.name) {
        updateData.slug = generateSlug(data.name);
    }
    return await prisma.category.update({ where: { id }, data: updateData });
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteCategory = async (id: string) => {
    return await prisma.category.delete({ where: { id } });
};
