const fs = require('fs');

function parseWilayas() {
    let text = fs.readFileSync('raw_pdf_text.txt', 'utf8');
    // Remove NULL characters and other non-printable stuff except common ones
    text = text.replace(/\0/g, '');
    
    const lines = text.split(/\r?\n/);
    
    const wilayas = [];
    let currentWilaya = null;
    let codeCounter = 1;

    console.log(`Processing ${lines.length} lines...`);

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Regex for wilaya name: matches lines starting with a single dash followed by a space and name.
        // It avoids matching the long dash lines used for page breaks.
        const wilayaMatch = line.match(/^-\s+([^-][^]*)$/);
        
        if (wilayaMatch && !line.includes('Mise à jour') && !line.includes('Page (')) {
            const name = wilayaMatch[1].trim();
            currentWilaya = {
                code: String(codeCounter++).padStart(2, '0'),
                name: name,
                communes: []
            };
            wilayas.push(currentWilaya);
            console.log(`Found Wilaya: ${name}`);
        } else if (currentWilaya) {
            if (line.startsWith('----------------Page')) continue;
            if (line.startsWith('Nombre de communes')) continue;
            if (line.includes('Total des wilayas')) {
                currentWilaya = null;
                continue;
            }
            
            currentWilaya.communes.push({
                name: line
            });
        }
    }

    const filteredWilayas = wilayas.filter(w => w.communes.length > 0);

    fs.writeFileSync('lib/algeria_69_wilayas.json', JSON.stringify(filteredWilayas, null, 2));
    console.log(`Successfully generated lib/algeria_69_wilayas.json with ${filteredWilayas.length} wilayas.`);
}

parseWilayas();
