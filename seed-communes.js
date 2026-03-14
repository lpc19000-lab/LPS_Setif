
const { createClient } = require('@supabase/supabase-js');
const { algeriaLocations } = require('./data/algeria-locations');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedCommunes() {
  console.log('Seeding communes...');
  for (const wilaya of algeriaLocations) {
    const wilayaNumber = parseInt(wilaya.id);
    const communes = wilaya.communes.map(name => ({
      wilaya_id: wilayaNumber,
      name: name
    }));
    
    const { error } = await supabase.from('communes').insert(communes);
    if (error) {
      console.error(`Error inserting communes for wilaya ${wilayaNumber}:`, error);
    } else {
      console.log(`Successfully inserted ${communes.length} communes for wilaya ${wilayaNumber}`);
    }
  }
}

seedCommunes();
