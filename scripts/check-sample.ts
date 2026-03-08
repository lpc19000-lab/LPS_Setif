import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSample() {
    const products = await prisma.product.findMany({
        take: 20,
        select: { name: true, imageUrl: true }
    });
    console.log(JSON.stringify(products, null, 2));
    await prisma.$disconnect();
}

checkSample();
