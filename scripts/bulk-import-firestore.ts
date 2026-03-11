import { adminDb } from "../lib/firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("--- Starting Firebase Bulk Import ---");

    // 1. Load Catalog
    const catalogPath = path.join(__dirname, "../tmp_pdf_parser/enriched_catalog.json");
    if (!fs.existsSync(catalogPath)) {
        console.error(`Catalog file not found at ${catalogPath}`);
        process.exit(1);
    }
    const products = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));

    // 2. Define Categories
    const categoryNames = [
        "Men", "Women", "Unisex", "Arabian Perfumes", "Luxury", "Fresh / Summer", "Winter / Strong"
    ];

    console.log("Seeding categories...");
    const categoryMap: Record<string, string> = {};
    for (const name of categoryNames) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const catQuery = await adminDb.collection("categories").where("slug", "==", slug).limit(1).get();
        
        if (catQuery.empty) {
            const docRef = await adminDb.collection("categories").add({
                name,
                slug,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            categoryMap[name] = docRef.id;
        } else {
            categoryMap[name] = catQuery.docs[0].id;
        }
    }

    // 3. Import Products in Batches
    console.log(`Importing ${products.length} products to Firestore...`);
    const BATCH_SIZE = 400; // Firestore limit is 500 writes per batch
    let batch = adminDb.batch();
    let count = 0;

    for (const p of products) {
        const basePrice = Number(p.price);
        if (isNaN(basePrice) || basePrice <= 0) continue;

        const cleanName = p.name.trim();
        const slug = (p.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-")) + "-" + Math.random().toString(36).substring(7);

        const productRef = adminDb.collection("products").doc();
        const volumeSizes = [30, 50, 100, 150, 200];

        batch.set(productRef, {
            name: cleanName,
            slug: slug,
            brand: p.brand || "LPS",
            description: p.description || "Premium fragrance",
            basePrice: basePrice,
            stockWeight: 5000,
            status: "ACTIVE",
            imageUrl: `/images/perfumes/${p.slug || slug}.jpg`,
            categoryId: categoryMap[p.category] || categoryMap["Unisex"],
            volumes: volumeSizes.map((v, i) => ({
                id: `vol-${Date.now()}-${i}`,
                weight: v,
                price: (basePrice / 100) * v
            })),
            images: [],
            tagIds: [],
            collectionIds: [],
            sales: { unitsSold: 0, revenue: 0 },
            createdAt: new Date(),
            updatedAt: new Date()
        });

        count++;
        if (count % BATCH_SIZE === 0) {
            await batch.commit();
            console.log(`Committed ${count} products...`);
            batch = adminDb.batch();
        }
    }

    if (count % BATCH_SIZE !== 0) {
        await batch.commit();
    }

    console.log(`--- Import Complete: ${count} products imported ---`);
}

main()
    .catch(e => {
        console.error("Fatal error during import:", e);
        process.exit(1);
    });
