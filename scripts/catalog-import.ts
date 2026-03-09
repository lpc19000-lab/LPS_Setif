import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log('--- Starting Catalog Import ---');

    // 1. Purge Existing Data
    console.log('Purging legacy products and categories...');
    try {
        await prisma.cartItem.deleteMany();
        await prisma.orderItem.deleteMany();

        // Use raw query or check if table exists to avoid crash
        try {
            await prisma.productVolume.deleteMany();
        } catch (e) {
            console.warn('ProductVolume table might not exist yet, skipping deleteMany');
        }

        await prisma.inventoryLog.deleteMany();
        await prisma.productSales.deleteMany();
        await prisma.productImage.deleteMany();
        await prisma.product.deleteMany();
        await prisma.category.deleteMany();
    } catch (e: any) {
        console.warn('Warning during purge:', e.message);
    }

    // 2. Load Enriched Catalog
    const catalogPath = path.join(__dirname, '../tmp_pdf_parser/enriched_catalog.json');
    if (!fs.existsSync(catalogPath)) {
        throw new Error(`Catalog file not found at ${catalogPath}`);
    }
    const products = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

    // 3. Define Categories
    const categoryNames = [
        "Men",
        "Women",
        "Unisex",
        "Arabian Perfumes",
        "Luxury",
        "Fresh / Summer",
        "Winter / Strong"
    ];

    console.log('Seeding categories...');
    const categoryMap: Record<string, string> = {};
    for (const name of categoryNames) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const cat = await prisma.category.upsert({
            where: { slug },
            update: {},
            create: {
                name,
                slug
            }
        });
        categoryMap[name] = cat.id;
    }

    // 4. Import Products
    console.log(`Importing ${products.length} products...`);
    const volumeSizes = [30, 50, 100, 150, 200];

    for (const p of products) {
        try {
            const basePrice = Number(p.price);
            if (isNaN(basePrice) || basePrice <= 0) continue;

            const cleanName = p.name.trim();
            const slug = p.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            await prisma.product.create({
                data: {
                    name: cleanName,
                    slug: slug,
                    brand: p.brand || 'LPS',
                    description: p.description || 'Premium fragrance',
                    basePrice: basePrice,
                    stockWeight: 5000,
                    status: 'ACTIVE',
                    imageUrl: `/images/perfumes/${slug}.jpg`,
                    categoryId: categoryMap[p.category] || categoryMap['Unisex'],
                    volumes: {
                        create: volumeSizes.map(v => ({
                            weight: v,
                            price: (basePrice / 100) * v
                        }))
                    }
                }
            });
        } catch (err: any) {
            if (err.code === 'P2002') {
                // Skip duplicates
            } else {
                console.error(`Failed to import ${p.name}:`, err.message);
            }
        }
    }

    console.log('--- Import Complete ---');
}

main()
    .catch(e => {
        console.error('Fatal error during import:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
