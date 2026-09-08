const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgres://postgres.ipcutxtnjplptmxjdtax:kt3g7Lh6m3PBe8aK@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=no-verify',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to Postgres');

  await client.query(`
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title TEXT;
    UPDATE public.products SET title = name WHERE title IS NULL;
    
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS photos TEXT[];
    UPDATE public.products SET photos = images WHERE photos IS NULL;
  `);

  console.log('Added title and photos columns and synced data');
  await client.end();
}

run().catch(console.error);
