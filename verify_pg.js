import { Client } from 'pg';

const connectionString = "postgresql://postgres.agdnzwfdlahbgecgdeyw:Ll123456..123123@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

console.log('Connecting with pg to:', connectionString.replace(/:Ll[^@]+@/, ':***@'));

const client = new Client({
    connectionString,
});

async function main() {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL successfully!');
        const res = await client.query('SELECT current_database(), current_user, version()');
        console.log(res.rows[0]);
        const counts = await client.query('SELECT count(*) FROM products');
        console.log('Products count:', counts.rows[0].count);
    } catch (err) {
        console.error('Connection error', err.stack);
    } finally {
        await client.end();
    }
}

main();
