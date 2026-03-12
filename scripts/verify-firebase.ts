import { adminDb } from '../lib/firebase-admin';

// NOW DYNAMICALLY IMPORT SERVICES
async function verify() {
    const { getAdminStats } = await import("../services/admin-service");
    const { getCustomers } = await import("../services/customer-service");
    const { getProducts } = await import("../services/product-service");
    const { getOrders } = await import("../services/order-service");
    const { getCategories } = await import("../services/category-service");

    console.log("--- Firebase Verification Starting ---");
    
    try {
        console.log("\n1. Testing Admin Stats...");
        const stats = await getAdminStats();
        console.log("Stats:", stats);
        
        console.log("\n2. Testing Customers List...");
        const customers = await getCustomers({ limit: 5 });
        console.log(`Found ${customers.length} customers.`);
        if (customers.length > 0) {
            console.log("Sample Customer shopName:", customers[0].shopName);
        }
        
        console.log("\n3. Testing Products List...");
        const products = await getProducts({ limit: 5 });
        console.log(`Found ${products.length} products.`);
        if (products.length > 0) {
            console.log("Sample Product price:", products[0].price);
            console.log("Sample Product image:", products[0].image);
        }
        
        console.log("\n--- Verification Completed Successfully ---");
    } catch (error) {
        console.error("\n--- Verification Failed ---");
        console.error(error);
    }
}

verify().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
