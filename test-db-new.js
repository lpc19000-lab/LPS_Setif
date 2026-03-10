const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing connection with new credentials...');
    try {
        const productCount = await prisma.product.count();
        console.log('✅ Connection successful. Product count:', productCount);

        const products = await prisma.product.findMany({ take: 3 });
        console.log('Sample products:', JSON.stringify(products, null, 2));

        const userCount = await prisma.user.count();
        console.log('✅ User count:', userCount);
    } catch (e) {
        console.error('❌ Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
