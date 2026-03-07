import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing connection to Supabase...');
        const productCount = await prisma.product.count();
        console.log('Successfully connected to Supabase!');
        console.log(`Current product count: ${productCount}`);
        
        const categories = await prisma.category.findMany({
            take: 3
        });
        console.log('Sample categories:', categories.map(c => c.name).join(', '));
        
    } catch (error) {
        console.error('Failed to connect to Supabase:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
