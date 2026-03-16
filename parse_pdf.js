const fs = require('fs');
const PDFParser = require("pdf2json");

async function extractWilayas() {
    try {
        const pdfParser = new PDFParser(null, 1);

        pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            const text = pdfParser.getRawTextContent();
            fs.writeFileSync('raw_pdf_text.txt', text);
            console.log("Extracted raw text. Please examine raw_pdf_text.txt to adjust regex.");
        });

        pdfParser.loadPDF("algeria_69_provinces_communes.pdf");
    } catch (e) {
        console.error("Error reading PDF:", e);
    }
}

extractWilayas();
