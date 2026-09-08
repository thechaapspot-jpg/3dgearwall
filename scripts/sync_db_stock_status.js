const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgres://postgres.ipcutxtnjplptmxjdtax:kt3g7Lh6m3PBe8aK@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=no-verify',
  ssl: { rejectUnauthorized: false }
});

const outOfStockIds = [
  32, 31, 30, 29, 28, 27, 26, 24, 23,
  22, 21, 20,  7,  6,  5,  4,  3,  2,
   1, 18, 17, 16, 15, 14, 13, 12, 11,
  10,  9,  8
];

const inStockIds = [38, 37, 36, 35, 34, 33];

async function run() {
  await client.connect();
  console.log('Connected to Postgres');

  // Set out of stock
  await client.query(`
    UPDATE public.products 
    SET out_of_stock = true 
    WHERE id = ANY($1::bigint[]);
  `, [outOfStockIds]);
  console.log(`Set ${outOfStockIds.length} products to OUT OF STOCK`);

  // Set in stock
  await client.query(`
    UPDATE public.products 
    SET out_of_stock = false 
    WHERE id = ANY($1::bigint[]);
  `, [inStockIds]);
  console.log(`Set ${inStockIds.length} products to IN STOCK`);

  // Verify
  const res = await client.query(`
    SELECT out_of_stock, count(*) FROM public.products GROUP BY out_of_stock;
  `);
  console.log('Stock distribution in Supabase:', res.rows);

  await client.end();
}

run().catch(console.error);
