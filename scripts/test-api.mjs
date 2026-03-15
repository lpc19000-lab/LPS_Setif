
const baseUrl = 'http://localhost:3000';

async function testApi() {
    try {
        // First get products to find a valid ID
        console.log("Fetching products list...");
        const listRes = await fetch(`${baseUrl}/api/products?limit=1`);
        const listJson = await listRes.json();
        
        if (!listJson.success || !listJson.data.length) {
            console.error("Could not get products list:", listJson);
            return;
        }

        const productId = listJson.data[0].id;
        console.log(`Testing product detail API for ID: ${productId}`);

        const detailRes = await fetch(`${baseUrl}/api/products/${productId}`);
        const detailJson = await detailRes.json();

        console.log("API Result Status:", detailRes.status);
        console.log("API Result Data:", JSON.stringify(detailJson, null, 2));

    } catch (err) {
        console.error("Test failed:", err.message);
    }
}

testApi();
