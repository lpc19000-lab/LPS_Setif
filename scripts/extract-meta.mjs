
import fs from 'fs';

const products = JSON.parse(fs.readFileSync('reconciled-products-refined.json', 'utf8'));

const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))]; // These are Firestore IDs

console.log('Unique Brands:', brands.length);
console.log('Unique Category IDs:', categoryIds.length);

fs.writeFileSync('extraction-meta.json', JSON.stringify({ brands, categoryIds }, null, 2));
