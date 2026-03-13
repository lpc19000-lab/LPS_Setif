const fs = require('fs');
const pdf = require('pdf-parse');

async function test() {
    console.log('PDFParse:', pdf.PDFParse);
    const dataBuffer = fs.readFileSync('C:\\Users\\fares\\Desktop\\LPS_Setif\\Perfumes_Sorted (1).pdf');
    
    try {
        // Try as constructor if it exists
        if (pdf.PDFParse) {
            console.log('Attempting to use new pdf.PDFParse(dataBuffer)...');
            // Some versions use a different approach
            // Let's try to just call it if it's a function or check methods
            if (typeof pdf.PDFParse === 'function') {
                try {
                    const result = await pdf.PDFParse(dataBuffer);
                    console.log('Success with pdf.PDFParse(dataBuffer)');
                    console.log(result.text.substring(0, 500));
                } catch (e) {
                    console.log('Failed with pdf.PDFParse(dataBuffer):', e.message);
                }
            }
        }
        
        // Let's try to see if there is any other way
        // Maybe it's not a function but has a parse method?
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
