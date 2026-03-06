import prisma from "@/lib/db";

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ ──────────────────────────────────────────────────────────────────
export const getTags = async () => {
    return await prisma.tag.findMany({
        include: { products: { select: { id: true } } },
        orderBy: { name: "asc" },
    });
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createTag = async (data: { name: string }) => {
    const slug = generateSlug(data.name);
    return await prisma.tag.create({ data: { name: data.name, slug } });
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateTag = async (id: string, data: { name: string }) => {
    const slug = generateSlug(data.name);
    return await prisma.tag.update({ where: { id }, data: { name: data.name, slug } });
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteTag = async (id: string) => {
    return await prisma.tag.delete({ where: { id } });
};
