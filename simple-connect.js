const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Very Simple Connection Check...');
    try {
        await prisma.$connect();
        console.log('✅ Prisma connected successfully!');
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('✅ SQL execution successful:', result);
    } catch (e) {
        console.error('❌ Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
