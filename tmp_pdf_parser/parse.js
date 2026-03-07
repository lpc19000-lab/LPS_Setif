const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = '../LPS LISTE PARFUME_103725 (1) (2).pdf';
const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    const text = data.text;
    const lines = text.split('\n');
    const products = [];
    
    let currentName = '';

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Match price pattern like 1,400.00 DA or 1400.00 DA
        // Often prices are stuck to the name like PERFUMENAME1,400.00 DA
        const priceMatch = line.match(/(\d{1,3}(,\d{3})*(\.\d{2})?)\s*DA$/i);
        
        if (priceMatch) {
            const priceStr = priceMatch[1];
            const price = parseFloat(priceStr.replace(/,/g, ''));
            
            // The name is everything before the price
            let namePart = line.substring(0, line.lastIndexOf(priceMatch[0])).trim();
            
            if (namePart) {
                // If we have a pending name from previous lines, join it
                const fullName = (currentName ? currentName + ' ' : '') + namePart;
                products.push({
                    name: fullName.replace(/\s+/g, ' ').trim(),
                    price: price
                });
                currentName = '';
            } else if (currentName) {
                // Case where price was on its own line
                products.push({
                    name: currentName.trim(),
                    price: price
                });
                currentName = '';
            }
        } else {
            // Probably part of a name or metadata
            // Ignore headers like "Page 1/1" or "Nombre de lignes"
            if (line.match(/^Page \d+\/\d+$/i) || line.match(/Nombre de lignes/i)) {
                continue;
            }
            currentName += ' ' + line;
        }
    }
    
    console.log(JSON.stringify(products, null, 2));
    fs.writeFileSync('catalog.json', JSON.stringify(products, null, 2));
    console.log(`Extracted ${products.length} products to catalog.json`);
}).catch(err => {
    console.error('Error:', err);
});
