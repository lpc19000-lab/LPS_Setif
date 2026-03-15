
import { getProductById, getActiveProducts } from './services/product-service.js';

async function testService() {
    try {
        console.log("Fetching active products...");
        const { products } = await getActiveProducts({ limit: 1 });
        
        if (!products.length) {
            console.log("No active products found.");
            return;
        }

        const product = products[0];
        console.log(`Found product: ${product.name} (ID: ${product.id})`);

        console.log("Fetching by ID...");
        const detail = await getProductById(product.id);

        if (detail) {
            console.log("Detail loaded successfully:", detail.name);
            console.log("Volumes:", detail.volumes);
        } else {
            console.log("Detail not found for ID:", product.id);
        }

    } catch (err) {
        console.error("Service test failed:", err);
    }
}

testService();
