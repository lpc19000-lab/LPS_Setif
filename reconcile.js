const fs = require('fs');
const path = require('path');

function parseList(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const text = data.text || '';
    const lines = text.split('\n');
    const products = [];
    
    // Pattern: NAME PRICE DA
    // Example: 1881 FEMME 1,600.00 DA
    const regex = /^(.*?)\s+([\d,.]+)\s+DA$/;
    
    lines.forEach(line => {
        const match = line.trim().match(regex);
        if (match) {
            products.push({
                name: match[1].trim(),
                price: parseFloat(match[2].replace(/,/g, '')),
            });
        }
    });
    return products;
}

function parseSorted(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const text = data.text || '';
    const lines = text.split('\n');
    const brands = {};
    let currentBrand = '';
    
    const brandRegex = /^Brand:\s+(.*)$/;
    const productRegex = /^(.*?)\s+([\d,.]+)\s+DA$/;
    
    lines.forEach(line => {
        const trimmed = line.trim();
        const brandMatch = trimmed.match(brandRegex);
        if (brandMatch) {
            currentBrand = brandMatch[1].trim();
        } else {
            const productMatch = trimmed.match(productRegex);
            if (productMatch && currentBrand) {
                const productName = productMatch[1].trim();
                brands[productName] = currentBrand;
            }
        }
    });
    return brands;
}

function getImages(dirPath) {
    const files = fs.readdirSync(dirPath);
    const map = {};
    files.forEach(f => {
        const name = path.parse(f).name.toUpperCase();
        map[name] = path.join(dirPath, f);
    });
    return map;
}

const products = parseList('product-list.txt');
const brandMap = parseSorted('sorted-list.txt');
const imagesLPS = getImages('C:\\Users\\fares\\Desktop\\LPS_Setif\\LPS IMAGE');
const imagesLatafa = getImages('C:\\Users\\fares\\Desktop\\LPS_Setif\\latafa');

const mergedImages = { ...imagesLPS, ...imagesLatafa };

const reconciled = products.map(p => {
    const brand = brandMap[p.name] || 'Other';
    const imagePath = mergedImages[p.name.toUpperCase()] || null;
    return {
        ...p,
        brand,
        imagePath
    };
});

fs.writeFileSync('reconciled-products.json', JSON.stringify(reconciled, null, 2));
console.log(`Reconciled ${reconciled.length} products.`);
console.log(`Products with images: ${reconciled.filter(p => p.imagePath).length}`);
console.log(`Products without images: ${reconciled.filter(p => !p.imagePath).length}`);

// Sample of missing images
const missing = reconciled.filter(p => !p.imagePath).slice(0, 10);
console.log('Sample missing images:', missing.map(m => m.name));
