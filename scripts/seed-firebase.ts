/**
 * Firebase Seed Script
 * Seeds Firestore with initial data: admin user, categories, sample products
 * 
 * Run with: npx tsx scripts/seed-firebase.ts
 */
import { adminDb } from '../lib/firebase-admin';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';

async function seed() {
    console.log('🔥 Starting Firebase seed...\n');

    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminRef = db.collection('admins').doc('admin-001');
    await adminRef.set({
        email: 'admin@lps-setif.com',
        password: adminPassword,
        name: 'LPS Admin',
        role: 'SUPER_ADMIN',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('  ✅ Admin: admin@lps-setif.com / admin123\n');

    // 2. Create Categories
    console.log('📂 Creating categories...');
    const categories = [
        { name: 'Eau de Parfum', slug: 'eau-de-parfum', description: 'Concentrated fragrance oils for lasting scent', imageUrl: '' },
        { name: 'Eau de Toilette', slug: 'eau-de-toilette', description: 'Light and refreshing everyday fragrances', imageUrl: '' },
        { name: 'Oud & Oriental', slug: 'oud-oriental', description: 'Rich Arabian oud and oriental blends', imageUrl: '' },
        { name: 'Body Mist', slug: 'body-mist', description: 'Gentle body sprays and mists', imageUrl: '' },
        { name: 'Gift Sets', slug: 'gift-sets', description: 'Curated perfume gift collections', imageUrl: '' },
    ];

    const categoryIds: Record<string, string> = {};
    for (const cat of categories) {
        const ref = db.collection('categories').doc();
        await ref.set({
            ...cat,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        categoryIds[cat.slug] = ref.id;
        console.log(`  ✅ Category: ${cat.name} (${ref.id})`);
    }
    console.log('');

    // 3. Create Tags
    console.log('🏷️ Creating tags...');
    const tags = ['New Arrival', 'Best Seller', 'Limited Edition', 'Exclusive', 'On Sale'];
    const tagIds: string[] = [];
    for (const tagName of tags) {
        const ref = db.collection('tags').doc();
        await ref.set({
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-'),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tagIds.push(ref.id);
        console.log(`  ✅ Tag: ${tagName}`);
    }
    console.log('');

    // 4. Create Collections
    console.log('🗂️ Creating collections...');
    const collections = [
        { name: 'Summer 2026', slug: 'summer-2026', description: 'Refreshing summer fragrances' },
        { name: 'Winter Essentials', slug: 'winter-essentials', description: 'Warm and cozy winter scents' },
        { name: 'Bestsellers', slug: 'bestsellers', description: 'Our most popular fragrances' },
    ];
    const collectionIds: string[] = [];
    for (const col of collections) {
        const ref = db.collection('collections').doc();
        await ref.set({
            ...col,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        collectionIds.push(ref.id);
        console.log(`  ✅ Collection: ${col.name}`);
    }
    console.log('');

    // 5. Create Sample Products
    console.log('🧴 Creating sample products...');
    const products = [
        {
            name: 'Royal Amber Oud',
            brand: 'LPS Setif',
            description: 'A majestic blend of amber and oud, with hints of sandalwood and vanilla.',
            basePrice: 8500,
            stockWeight: 5000,
            status: 'ACTIVE',
            categoryId: categoryIds['oud-oriental'],
            categoryName: 'Oud & Oriental',
            imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400',
        },
        {
            name: 'Jasmine Bloom',
            brand: 'LPS Setif',
            description: 'Fresh jasmine petals with a delicate floral heart and citrus top notes.',
            basePrice: 6200,
            stockWeight: 8000,
            status: 'ACTIVE',
            categoryId: categoryIds['eau-de-parfum'],
            categoryName: 'Eau de Parfum',
            imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
        },
        {
            name: 'Midnight Velvet',
            brand: 'LPS Setif',
            description: 'A seductive evening fragrance with dark roses, musk, and black pepper.',
            basePrice: 7800,
            stockWeight: 3500,
            status: 'ACTIVE',
            categoryId: categoryIds['eau-de-parfum'],
            categoryName: 'Eau de Parfum',
            imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400',
        },
        {
            name: 'Cedar & Sage',
            brand: 'LPS Setif',
            description: 'Woody and herbal, a sophisticated masculine scent.',
            basePrice: 5500,
            stockWeight: 6000,
            status: 'ACTIVE',
            categoryId: categoryIds['eau-de-toilette'],
            categoryName: 'Eau de Toilette',
            imageUrl: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400',
        },
        {
            name: 'Rose Gold Mist',
            brand: 'LPS Setif',
            description: 'Lightweight body mist with Bulgarian rose, peony, and white tea.',
            basePrice: 3200,
            stockWeight: 10000,
            status: 'ACTIVE',
            categoryId: categoryIds['body-mist'],
            categoryName: 'Body Mist',
            imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400',
        },
        {
            name: 'Oriental Nights Gift Set',
            brand: 'LPS Setif',
            description: 'Complete gift set featuring our finest oriental fragrances.',
            basePrice: 15000,
            stockWeight: 2000,
            status: 'ACTIVE',
            categoryId: categoryIds['gift-sets'],
            categoryName: 'Gift Sets',
            imageUrl: 'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=400',
        },
    ];

    for (const product of products) {
        const ref = db.collection('products').doc();
        await ref.set({
            ...product,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`  ✅ Product: ${product.name} (${product.basePrice} DA)`);
    }
    console.log('');

    // 6. Create a sample customer
    console.log('🛍️ Creating sample customer...');
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customerRef = db.collection('customers').doc();
    await customerRef.set({
        email: 'customer@example.com',
        password: customerPassword,
        name: 'Ahmed Benali',
        shopName: 'Parfumerie Benali',
        phone: '0555123456',
        address: 'Rue Didouche Mourad, Sétif',
        wilaya: 'Sétif',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('  ✅ Customer: customer@example.com / customer123\n');

    console.log('🎉 Seed complete! Your Firebase database is ready.');
    console.log('');
    console.log('📋 Login credentials:');
    console.log('  Admin:    admin@lps-setif.com / admin123');
    console.log('  Customer: customer@example.com / customer123');
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Seed error:', err);
        process.exit(1);
    });
