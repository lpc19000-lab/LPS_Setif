
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORY_MAP = {
    "9vpWc2LcxiWRtsTJ0cmd": "UNISEX",
    "LkjLsp47F7rXXLYPyraQ": "MEN",
    "goqC33dEoaamHBaySGOh": "NICHE",
    "zwfrL7qSeWWsiSaw38ju": "WOMEN"
};

function slugify(text) {
    if (!text) return 'n-a';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function runSeeder() {
    try {
        console.log('Reading data...');
        const productsRaw = JSON.parse(fs.readFileSync('reconciled-products-refined.json', 'utf8'));
        
        // 1. Upsert Categories
        console.log('Upserting categories...');
        const categoryNames = Object.values(CATEGORY_MAP);
        const categoriesToInsert = categoryNames.map(name => ({
            name,
            slug: slugify(name),
            description: `${name} fragrances`
        }));
        
        const { data: catData, error: catError } = await supabase
            .from('categories')
            .upsert(categoriesToInsert, { onConflict: 'slug' })
            .select();
        
        if (catError) throw catError;
        const catIdMap = Object.fromEntries(catData.map(c => [c.name, c.id]));
        // Map Firestore ID to Supabase UUID
        const firestoreToUuid = Object.fromEntries(
            Object.entries(CATEGORY_MAP).map(([fid, name]) => [fid, catIdMap[name]])
        );

        // 2. Upsert Brands
        console.log('Extracting and upserting brands...');
        const uniqueBrandNames = [...new Set(productsRaw.map(p => p.brand).filter(Boolean))];
        console.log(`Found ${uniqueBrandNames.length} unique brands`);
        
        for (let i = 0; i < uniqueBrandNames.length; i += 100) {
            const chunk = uniqueBrandNames.slice(i, i + 100).map(name => ({
                name,
                slug: slugify(name),
                description: `Luxury brand: ${name}`
            }));
            const { error: brandError } = await supabase.from('brands').upsert(chunk, { onConflict: 'slug' });
            if (brandError) console.error('Brand chunk error:', brandError);
        }

        // 3. Clear existing products to avoid duplicates during re-run (Caution: dev only)
        console.log('Clearing existing products...');
        const { error: deleteError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) console.warn('Delete error (safe to ignore if no products):', deleteError);

        // 4. Prepare Products
        console.log('Preparing products...');
        const productsToInsert = productsRaw.map(p => {
            const catId = firestoreToUuid[p.categoryId] || catIdMap['UNISEX']; // fallback
            
            let imageUrl = "/images/placeholder-perfume.svg";

            return {
                name: p.name,
                slug: `${slugify(p.name)}-${Math.random().toString(36).substring(2, 6)}`,
                description: `${p.name} by ${p.brand}. Authentic luxury fragrance available at LPS Setif.`,
                base_price: p.price || 0,
                stock_weight: 1000, 
                category_id: catId,
                brand: p.brand, 
                image_url: imageUrl,
                status: 'ACTIVE'
            };
        });

        // 5. Batch Insert Products
        console.log(`Inserting ${productsToInsert.length} products in batches...`);
        const batchSize = 100;
        for (let i = 0; i < productsToInsert.length; i += batchSize) {
            const batch = productsToInsert.slice(i, i + batchSize);
            const { error: prodError } = await supabase.from('products').insert(batch);
            if (prodError) {
                console.error(`Error in batch ${i / batchSize}:`, prodError);
            } else {
                console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(productsToInsert.length / batchSize)}`);
            }
        }

        console.log('Catalog seeding completed successfully!');
    } catch (err) {
        console.error('Fatal error in seeder:', err);
    }
}

runSeeder();
