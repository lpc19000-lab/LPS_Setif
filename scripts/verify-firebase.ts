const fs = require('fs');
const path = require('path');

// 1. MANUALLY LOAD .env.local BEFORE ANY OTHER IMPORTS
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return;
        
        const firstEqual = trimmedLine.indexOf('=');
        if (firstEqual !== -1) {
            const key = trimmedLine.slice(0, firstEqual).trim();
            let val = trimmedLine.slice(firstEqual + 1).trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
            process.env[key] = val;
        }
    });
}

console.log("FIREBASE_PROJECT_ID after load:", process.env.FIREBASE_PROJECT_ID);

// 2. NOW DYNAMICALLY IMPORT SERVICES
async function verify() {
    const { getAdminStats } = await import("./services/admin-service");
    const { getCustomers } = await import("./services/customer-service");
    const { getProducts } = await import("./services/product-service");
    const { getOrders } = await import("./services/order-service");
    const { getCategories } = await import("./services/category-service");

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
