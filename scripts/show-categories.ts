import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function showCategories() {
    const categories = await prisma.category.findMany({
        select: { name: true, slug: true }
    });
    console.log(JSON.stringify(categories, null, 2));
    await prisma.$disconnect();
}

showCategories();
