const geo = require('algerian-geo');

try {
    const wilayas = geo.getAllWilayas();
    console.log(`Found ${wilayas.length} wilayas.`);
    
    // Mapping of 48-wilaya source IDs to new 58-wilaya targets for specific communes
    const newWilayaMapping = {
        "El M'Ghair": 49, 'Djamaa': 49, 'Still': 49, 'Mrara': 49,
        'El Meniaa': 50, 'Hassi Gara': 50,
        'Ouled Djellal': 51, 'El Ghrous': 51, 'Doucen': 51, 'Chaiba': 51, 'Sidi Khaled': 51, 'Besbes': 51,
        'Bordj Badji Mokhtar': 52, 'Timiaouine': 52,
        'Béni Abbès': 53, 'Kerzaz': 53, 'Ouled Khodeir': 53, 'Tabelbala': 53, 'Tamtert': 53, 'Ighli': 53, 'El Ouata': 53, 'Ksabi': 53,
        'Timimoun': 54, 'Aougrout': 54, 'Charouine': 54, 'Deldoul': 54, 'Ksar Kaddour': 54, 'Metarfa': 54, 'Ouled Said': 54, 'Talmine': 54, 'Tinerkouk': 54,
        'Touggourt': 55, 'Nezla': 55, 'Tebesbest': 55, 'Zaouia El Abidia': 55, 'Temacine': 55, 'El Hadjira': 55, 'El Taieb El Arbi': 55, 'Blidet Amor': 55, 'Megarine': 55, 'Mnaguer': 55, 'Sidi Slimane': 55,
        'Djanet': 56, 'Bordj El Haouas': 56,
        'In Salah': 57, 'In Ghar': 57, 'Foggaret Ezzaouia': 57,
        'In Guezzam': 58, 'Tin Zaouatine': 58
    };

    const allCommunes = [];
    wilayas.forEach(w => {
        const communes = geo.getCommunesByWilayaCode(w.code);
        communes.forEach(c => {
            const communeName = c.name_en || c.name;
            let targetWilayaId = parseInt(w.code);
            
            // Apply remapping if it's one of the communes that moved to a new wilaya
            if (newWilayaMapping[communeName]) {
                targetWilayaId = newWilayaMapping[communeName];
            }

            allCommunes.push({
                wilaya_id: targetWilayaId,
                name: communeName
            });
        });
    });
    
    console.log(`Total communes: ${allCommunes.length}`);
    
    // Generate SQL
    let sql = `-- Full 58-Wilaya Algerian Communes Seed\n`;
    sql += `TRUNCATE TABLE communes CASCADE;\n`;
    sql += `INSERT INTO communes (wilaya_id, name) VALUES\n`;
    
    const valueStrings = allCommunes.map(c => `(${c.wilaya_id}, '${c.name.replace(/'/g, "''")}')`);
    sql += valueStrings.join(',\n') + ';';
    
    const fs = require('fs');
    fs.writeFileSync('v58_communes_seed.sql', sql);
    console.log('v58_communes_seed.sql generated successfully.');
} catch (e) {
    console.error('Error extracting geo data:', e.message);
}
