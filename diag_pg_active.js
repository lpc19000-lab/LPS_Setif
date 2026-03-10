const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres.agdnzwfdlahbgecgdeyw:Ll123456..123123@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" // DIRECT_URL
});

async function test() {
    try {
        await client.connect();
        console.log('Connected to DB via raw PG');

        const countRes = await client.query("SELECT count(*) FROM products WHERE status = 'ACTIVE'");
        console.log('ACTIVE products count:', countRes.rows[0].count);

        const sampleRes = await client.query("SELECT id, name, status FROM products WHERE status = 'ACTIVE' LIMIT 1");
        if (sampleRes.rows.length > 0) {
            console.log('Sample ACTIVE product:', sampleRes.rows[0]);
        } else {
            console.log('No ACTIVE products found!');
            const anyRes = await client.query("SELECT id, name, status FROM products LIMIT 5");
            console.log('Any products found:', anyRes.rows);
        }

    } catch (e) {
        console.error('PG test error:', e);
    } finally {
        await client.end();
    }
}

test();
