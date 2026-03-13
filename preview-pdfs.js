const fs = require('fs');
const pdf = require('pdf-parse');

async function readPDF(filename) {
    if (!fs.existsSync(filename)) {
        console.error(`File not found: ${filename}`);
        return;
    }
    let dataBuffer = fs.readFileSync(filename);
    try {
        const data = await pdf(dataBuffer);
        console.log(`--- Content of ${filename} ---`);
        console.log(data.text.substring(0, 1500));
        console.log(`--- End of Preview ---`);
    } catch (err) {
        console.error(`Error reading ${filename}:`, err);
    }
}

async function run() {
    await readPDF('C:\\Users\\fares\\Desktop\\LPS_Setif\\LPS LISTE PARFUME_103725 (1) (2).pdf');
    console.log('\n\n' + '='.repeat(50) + '\n\n');
    await readPDF('C:\\Users\\fares\\Desktop\\LPS_Setif\\Perfumes_Sorted (1).pdf');
}

run();
