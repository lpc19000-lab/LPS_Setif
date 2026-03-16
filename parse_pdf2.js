const fs = require('fs');
const PDFParser = require('pdf2json');

let pdfParser = new PDFParser(this, 1);

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFileSync('raw_pdf_text.txt', pdfParser.getRawTextContent());
    console.log("Extraction complete.");
});

pdfParser.loadPDF("algeria_69_provinces_communes.pdf");
