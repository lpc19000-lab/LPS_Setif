import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAll() {
    const products = await prisma.product.findMany({
        select: { imageUrl: true }
    });
    const urls = products.map(p => p.imageUrl);
    const unsplashCount = urls.filter(u => u && u.includes("unsplash")).length;
    const emptyCount = urls.filter(u => !u || u === "").length;
    console.log(`Total: ${products.length}`);
    console.log(`Unsplash: ${unsplashCount}`);
    console.log(`Empty: ${emptyCount}`);
    await prisma.$disconnect();
}

checkAll();
