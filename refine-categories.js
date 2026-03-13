const fs = require('fs');

const products = JSON.parse(fs.readFileSync('reconciled-products.json', 'utf8'));
const categories = JSON.parse(fs.readFileSync('firestore-categories.json', 'utf8'));

// Categories: UNISEX, MEN, NICHE, WOMEN
const menId = categories['MEN'];
const womenId = categories['WOMEN'];
const unisexId = categories['UNISEX'];
const nicheId = categories['NICHE'];

const nicheBrands = [
    'XERJOFF', 'KAJAL', 'AMOUAGE', 'INITIO', 'KILIAN', 'FREDERIC MALLE', 'PARFUMS DE MARLY', 
    'BYREDO', 'DIPTYQUE', 'LE LABO', 'MAISON FRANCIS KURKDJIAN', 'ROJA', 'NASOMATTO', 'ORTO PARISI'
];

const refined = products.map(p => {
    let catId = unisexId;
    const nameUpper = p.name.toUpperCase();
    const brandUpper = p.brand.toUpperCase();
    
    // Niche check
    if (nicheBrands.some(nb => nameUpper.includes(nb) || brandUpper.includes(nb))) {
        catId = nicheId;
    } 
    // Gender keywords
    else if (nameUpper.includes('HOMME') || nameUpper.includes('POUR LUI') || nameUpper.includes('MAN') || nameUpper.includes('MEN')) {
        catId = menId;
    } 
    else if (nameUpper.includes('FEMME') || nameUpper.includes('POUR ELLE') || nameUpper.includes('WOMAN') || nameUpper.includes('WOMEN') || nameUpper.includes('GIRL')) {
        catId = womenId;
    }
    
    return { ...p, categoryId: catId };
});

fs.writeFileSync('reconciled-products-refined.json', JSON.stringify(refined, null, 2));
console.log('Refined categories for all products.');
const counts = {};
refined.forEach(r => counts[r.categoryId] = (counts[r.categoryId] || 0) + 1);
console.log('Category breakdown:', counts);
