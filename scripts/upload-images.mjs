
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const IMAGE_DIRS = [
    'c:/Users/fares/Desktop/LPS_Setif/LPS IMAGE',
    'c:/Users/fares/Desktop/LPS_Setif/latafa'
];

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.webp': return 'image/webp';
        case '.avif': return 'image/avif';
        default: return 'application/octet-stream';
    }
}

async function uploadImages() {
    try {
        console.log('Fetching products from database...');
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, name');
        
        if (prodError) throw prodError;
        console.log(`Found ${products.length} products to process.`);

        // 1. Build a map of filenames in local dirs
        console.log('Indexing local images...');
        const localImages = new Map(); // Name (lowercase) -> Full Path
        
        for (const dir of IMAGE_DIRS) {
            if (!fs.existsSync(dir)) {
                console.warn(`Directory not found: ${dir}`);
                continue;
            }
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
                    const baseName = path.basename(file, ext).toLowerCase().trim();
                    if (!localImages.has(baseName)) {
                        localImages.set(baseName, path.join(dir, file));
                    }
                }
            }
        }
        console.log(`Indexed ${localImages.size} unique image files.`);

        // 2. Match and Upload
        let matchedCount = 0;
        let uploadedCount = 0;

        for (const product of products) {
            const productNameLower = product.name.toLowerCase().trim();
            const imagePath = localImages.get(productNameLower);

            if (imagePath) {
                matchedCount++;
                const fileExt = path.extname(imagePath);
                const fileName = `${product.id}${fileExt}`;
                const fileBuffer = fs.readFileSync(imagePath);

                console.log(`Uploading image for: ${product.name} (${fileName})`);

                // Upload to 'products' bucket
                const { data, error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(fileName, fileBuffer, {
                        contentType: getContentType(imagePath),
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`Error uploading ${product.name}:`, uploadError.message);
                    continue;
                }

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName);

                // Update product in DB
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ image_url: publicUrl })
                    .eq('id', product.id);

                if (updateError) {
                    console.error(`Error updating DB for ${product.name}:`, updateError.message);
                } else {
                    uploadedCount++;
                    console.log(`Successfully updated ${product.name}`);
                }
            }
        }

        console.log(`--- Summary ---`);
        console.log(`Total Products: ${products.length}`);
        console.log(`Matched Images: ${matchedCount}`);
        console.log(`Successfully Uploaded: ${uploadedCount}`);

    } catch (err) {
        console.error('Fatal error in image uploader:', err);
    }
}

uploadImages();
