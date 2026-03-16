const fs = require('fs');
const pdf = require('pdf-parse');

async function extractWilayas() {
    try {
        const dataBuffer = fs.readFileSync('algeria_69_provinces_communes.pdf');
        const data = await pdf(dataBuffer);

        const text = data.text;
        
        // Let's write the raw text out to see what it looks like before parsing.
        fs.writeFileSync('raw_pdf_text.txt', text);
        console.log("Extracted raw text. Please examine raw_pdf_text.txt to adjust regex.");
        
    } catch (e) {
        console.error("Error reading PDF:", e);
    }
}

extractWilayas();
