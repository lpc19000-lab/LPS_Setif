import prisma from './lib/db.ts';

async function test() {
    try {
        console.log('Testing raw product fetch...');
        const result = await prisma.product.findMany({
            where: { status: "ACTIVE" },
            take: 5,
            include: {
                category: true,
                tags: { include: { tag: true } }
            }
        });
        console.log('Products found:', result.length);
        if (result.length > 0) {
            console.log('Product 0:', result[0].name);
            console.log('Tags:', result[0].tags.map(t => t.tag.name));
        }

        const total = await prisma.product.count({ where: { status: "ACTIVE" } });
        console.log('Total ACTIVE products:', total);

    } catch (e) {
        console.error('Raw test error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
