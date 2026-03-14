
const geo = require('algerian-geo');
const fs = require('fs');

async function generateSeed() {
  console.log('Generating seed for 1541 communes...');
  const wilayas = geo.getWilayas();
  let sql = '-- Full Algerian Communes Seed\n';
  sql += 'TRUNCATE TABLE communes CASCADE;\n';
  sql += 'INSERT INTO communes (wilaya_id, name) VALUES\n';

  const values = [];
  for (const wilaya of wilayas) {
    const wilayaNumber = parseInt(wilaya.id);
    const communes = geo.getCommunes(wilaya.id);
    for (const commune of communes) {
        // Escape single quotes for SQL
        const escapedName = commune.name.replace(/'/g, "''");
        values.push(`(${wilayaNumber}, '${escapedName}')`);
    }
  }

  sql += values.join(',\n') + ';\n';

  fs.writeFileSync('full_communes_seed.sql', sql);
  console.log('Seed file generated: full_communes_seed.sql');
}

generateSeed();
