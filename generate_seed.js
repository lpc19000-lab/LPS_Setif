
const fs = require('fs');

const content = fs.readFileSync('data/algeria-locations.ts', 'utf-8');

// Use regex to extract the array content
// The array starts after 'algeriaLocations: WilayaData[] = '
const startIndex = content.indexOf('[');
const endIndex = content.lastIndexOf(']') + 1;
const jsonLike = content.slice(startIndex, endIndex);

// A very loose parser for the specific format in algeria-locations.ts
function parseLocations(text) {
    const results = [];
    // Wilaya block regex: { "id": "...", "name": "...", "communes": [...] }
    const wilayaRegex = /\{\s*"id":\s*"(\d+)",\s*"name":\s*"([^"]+)",\s*"communes":\s*\[(.*?)\]\s*\}/gs;
    
    let match;
    while ((match = wilayaRegex.exec(text)) !== null) {
        const id = match[1];
        const name = match[2];
        const communesText = match[3];
        // Extract communes names between quotes
        const communeNames = [];
        const communeRegex = /"([^"]+)"/g;
        let cMatch;
        while ((cMatch = communeRegex.exec(communesText)) !== null) {
            communeNames.push(cMatch[1]);
        }
        results.push({ id, name, communes: communeNames });
    }
    return results;
}

const locations = parseLocations(jsonLike);
console.log(`Found ${locations.length} wilayas.`);

let sql = "-- Full Algerian Communes Seed\n";
sql += "TRUNCATE TABLE communes CASCADE;\n";
sql += "INSERT INTO communes (wilaya_id, name) VALUES\n";

const values = [];
locations.forEach(wilaya => {
    const wId = parseInt(wilaya.id);
    wilaya.communes.forEach(commune => {
        const escapedName = commune.replace(/'/g, "''");
        values.push(`(${wId}, '${escapedName}')`);
    });
});

sql += values.join(',\n') + ';\n';

fs.writeFileSync('full_communes_seed.sql', sql);
console.log(`Generated seed for ${values.length} communes in full_communes_seed.sql`);
