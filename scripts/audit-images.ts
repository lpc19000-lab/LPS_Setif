import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function audit() {
    console.log("--- AUDIT START ---");
    
    const products = await prisma.product.findMany({
        select: { id: true, name: true, imageUrl: true }
    });
    
    const missingProductImages = products.filter(p => !p.imageUrl || p.imageUrl === "" || p.imageUrl.includes("unsplash"));
    console.log(`Products without real images: ${missingProductImages.length} / ${products.length}`);
    
    const categories = await prisma.category.findMany({
        select: { id: true, name: true }
    });
    console.log(`Total categories: ${categories.length}`);
    
    // Check if category images folder exists
    // (We'll assume we need to generate banners for all)
    
    console.log("Missing product images sample:", missingProductImages.slice(0, 5).map(p => p.name));
    
    console.log("--- AUDIT END ---");
    await prisma.$disconnect();
}

audit();
