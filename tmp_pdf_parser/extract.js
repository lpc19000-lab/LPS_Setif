const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('../Perfumes_Sorted (1).pdf');

async function extractText() {
    try {
        const data = await pdf(dataBuffer);
        fs.writeFileSync('extracted_text.txt', data.text);
        console.log('Successfully extracted text to extracted_text.txt');
    } catch(err) {
        console.error('Error parsing PDF:', err);
    }
}

extractText();
