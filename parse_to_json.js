const fs = require('fs');
const raw = fs.readFileSync('raw_pdf_text.txt', 'utf8');
const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

const wilayas = [];
let currentWilaya = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('Page (')) continue;
    if (line.includes('Nombre de communes')) continue;
    if (line.includes('Liste des')) continue;
    if (line.includes('d’Algérie')) continue;
    if (line.includes('Ce document contient')) continue;
    if (line.includes('communes respectives')) continue;
    
    // Check if it starts with any kind of dash
    if (line.match(/^[-–—−]\s+(.+)$/)) {
        if (currentWilaya) wilayas.push(currentWilaya);
        currentWilaya = {
            id: (wilayas.length + 1).toString(),
            name: line.replace(/^[-–—−]\s+/, '').trim(),
            communes: []
        };
    } else if (currentWilaya) {
        currentWilaya.communes.push(line);
    }
}
if (currentWilaya) wilayas.push(currentWilaya);

fs.writeFileSync('lib/algeria_69_wilayas.json', JSON.stringify(wilayas, null, 2));
console.log(`Successfully parsed ${wilayas.length} wilayas.`);
