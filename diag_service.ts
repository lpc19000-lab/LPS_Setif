import prisma from './lib/db.ts';
import { getActiveProducts } from './services/product-service.ts';

async function test() {
    try {
        console.log('Testing getActiveProducts...');
        const result = await getActiveProducts({});
        console.log('Success:', !!result);
        console.log('Total products found:', result.total);
        console.log('Products length:', result.products.length);
        if (result.products.length > 0) {
            console.log('First product ID:', result.products[0].id);
            console.log('First product Name:', result.products[0].name);
        }
    } catch (e) {
        console.error('Service test error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
