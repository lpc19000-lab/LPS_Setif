import postgres from 'postgres';

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

const sqlClient = postgres(dbUrl, { ssl: 'require' });

async function main() {
  try {
    console.log('Adding foreign keys...');

    try {
      await sqlClient`ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;`;
      console.log('Added category FK');
    } catch(e) { console.log('Category FK might already exist:', e.message); }

    try {
      await sqlClient`ALTER TABLE public.products ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;`;
      console.log('Added brand FK');
    } catch(e) { console.log('Brand FK might already exist:', e.message); }

    // Notify PostgREST to reload schema
    await sqlClient`NOTIFY pgrst, 'reload schema';`
    console.log('Reloaded PostgREST schema cache');

  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    await sqlClient.end();
  }
}

main();
