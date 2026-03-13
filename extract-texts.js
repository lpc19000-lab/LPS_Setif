const fs = require('fs');
const pdf = require('pdf-parse');

async function extractText(filename) {
    if (!fs.existsSync(filename)) {
        console.error(`File not found: ${filename}`);
        return null;
    }
    const buffer = fs.readFileSync(filename);
    const uint8Array = new Uint8Array(buffer);
    try {
        const instance = new pdf.PDFParse(uint8Array);
        await instance.load();
        const text = await instance.getText();
        console.log(`Type of text from ${filename}:`, typeof text);
        if (typeof text !== 'string') {
            console.log(`Text object keys:`, Object.keys(text));
            // If it's an object with a toString or similar, use it
            return JSON.stringify(text, null, 2);
        }
        return text;
    } catch (err) {
        console.error(`Error extracting from ${filename}:`, err);
        return null;
    }
}

async function run() {
    const listPath = 'C:\\Users\\fares\\Desktop\\LPS_Setif\\LPS LISTE PARFUME_103725 (1) (2).pdf';
    const sortedPath = 'C:\\Users\\fares\\Desktop\\LPS_Setif\\Perfumes_Sorted (1).pdf';

    console.log('Extracting text from product list...');
    const listText = await extractText(listPath);
    if (listText) {
        fs.writeFileSync('product-list.txt', listText);
        console.log(`Saved product-list.txt`);
    }

    console.log('Extracting text from sorted list...');
    const sortedText = await extractText(sortedPath);
    if (sortedText) {
        fs.writeFileSync('sorted-list.txt', sortedText);
        console.log(`Saved sorted-list.txt`);
    }
}

run();
