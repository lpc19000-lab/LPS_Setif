const fs = require('fs');
const text = fs.readFileSync('raw_pdf_text.txt', 'utf8');
const lines = text.split('\n');
for (let i = 0; i < 20; i++) {
    const line = lines[i];
    console.log(`Line ${i}: "${line}"`);
    console.log(`Codes: ${Array.from(line).map(c => c.charCodeAt(0)).join(', ')}`);
}
