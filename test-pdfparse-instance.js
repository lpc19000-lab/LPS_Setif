const fs = require('fs');
const pdf = require('pdf-parse');

async function test() {
    const dataBuffer = fs.readFileSync('C:\\Users\\fares\\Desktop\\LPS_Setif\\Perfumes_Sorted (1).pdf');
    
    try {
        const instance = new pdf.PDFParse(dataBuffer);
        console.log('Instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
        
        // Let's try to just use the default export if I can find it
        // If this is a different library, I might need to look for documentation
        // But wait, the package.json said pdf-parse.
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
