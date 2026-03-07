const fs = require('fs');

const rawData = JSON.parse(fs.readFileSync('catalog.json', 'utf8'));

const categories = [
    "Men",
    "Women",
    "Unisex",
    "Arabian Perfumes",
    "Luxury",
    "Fresh / Summer",
    "Winter / Strong"
];

function categorize(name) {
    const n = name.toUpperCase();
    
    // Arabian Perfumes (prioritize)
    if (n.includes('OUD') || n.includes('MUSK') || n.includes('ARAB') || n.includes('YAMANI') || n.includes('KHALIJ')) {
        return "Arabian Perfumes";
    }
    
    // Luxury
    if (n.includes('TQ') || n.includes('EXCLUSIVE') || n.includes('EXTRAIT') || n.includes('PRIVE')) {
        return "Luxury";
    }
    
    // Fresh / Summer
    if (n.includes('SUMMER') || n.includes('AQUA') || n.includes('FRESH') || n.includes('CHILL') || n.includes('SEA')) {
        return "Fresh / Summer";
    }

    // Winter / Strong
    if (n.includes('WINTER') || n.includes('STRONG') || n.includes('INTENSE') || n.includes('NIGHT') || n.includes('TOBACCO')) {
        return "Winter / Strong";
    }

    // Men
    if (n.includes('HOMME') || n.includes('MEN') || n.includes('HIM') || n.includes('SAUVAGE') || n.includes('BLUE') || n.includes('SPORT')) {
        return "Men";
    }

    // Women
    if (n.includes('FEMME') || n.includes('WOMAN') || n.includes('GIRL') || n.includes('LADY') || n.includes('MISS') || n.includes('ROSE') || n.includes('BELLE') || n.includes('FLORAL')) {
        return "Women";
    }

    return "Unisex";
}

function generateDescription(name, category) {
    const fragranceTypes = {
        "Men": "Sophisticated and masculine blend",
        "Women": "Elegant floral and feminine fragrance",
        "Unisex": "Versatile and balanced aromatic profile",
        "Arabian Perfumes": "Rich oriental traditions with modern touch",
        "Luxury": "Exquisite high-end masterpiece",
        "Fresh / Summer": "Vibrant and refreshing breeze",
        "Winter / Strong": "Deep, warm and powerful essence"
    };
    
    const type = fragranceTypes[category] || "Premium fragrance";
    return `A ${type.toLowerCase()} featuring ${name}. High quality inspired fragrance with long lasting performance, perfect for daily wear.`;
}

const enrichedData = rawData.map(p => {
    const category = categorize(p.name);
    return {
        ...p,
        slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: generateDescription(p.name, category),
        category: category,
        brand: p.name.split(' ')[0], // Rough estimate of brand
        status: "ACTIVE"
    };
});

// Detect and merge duplicates
const uniqueProducts = [];
const seenNames = new Set();

for (const p of enrichedData) {
    if (!seenNames.has(p.name)) {
        uniqueProducts.push(p);
        seenNames.add(p.name);
    } else {
        // Merge (could combine prices or take highest)
        const existing = uniqueProducts.find(x => x.name === p.name);
        if (p.price > existing.price) {
            existing.price = p.price;
        }
    }
}

fs.writeFileSync('enriched_catalog.json', JSON.stringify(uniqueProducts, null, 2));
console.log(`Enriched and cleaned catalog: ${uniqueProducts.length} unique products.`);
