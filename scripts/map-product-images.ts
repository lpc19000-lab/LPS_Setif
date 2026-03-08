import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateImages() {
    console.log("Updating product images to new AI assets...");
    const products = await prisma.product.findMany({
        select: { id: true, name: true, imageUrl: true }
    });

    // Target all products to ensure they use the new PNG assets
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const imageIndex = (i % 5) + 1;
        const newImageUrl = `/images/perfumes/perfume_${imageIndex}.png`;

        // Only update if it doesn't already match the new pattern
        if (product.imageUrl !== newImageUrl) {
            await prisma.product.update({
                where: { id: product.id },
                data: { imageUrl: newImageUrl }
            });
        }

        if ((i + 1) % 100 === 0) {
            console.log(`Processed ${i + 1} products...`);
        }
    }

    console.log("Product images mapping complete.");
    await prisma.$disconnect();
}

updateImages();
