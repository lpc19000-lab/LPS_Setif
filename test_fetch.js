import prisma from './lib/db.ts';

async function test() {
    try {
        const products = await prisma.product.findMany({
            where: { status: "ACTIVE" },
            take: 8,
            orderBy: { createdAt: "desc" },
            include: {
                category: { select: { name: true } },
                images: { select: { imageUrl: true }, orderBy: { position: "asc" }, take: 1 }
            }
        });
        console.log('New Arrivals found:', products.length);
        if (products.length > 0) {
            console.log('Sample product:', JSON.stringify(products[0], null, 2));
        }
    } catch (e) {
        console.error('Fetch error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
