const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgres://postgres.ipcutxtnjplptmxjdtax:kt3g7Lh6m3PBe8aK@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=no-verify',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to Postgres database');

  const sql = `
    CREATE TABLE IF NOT EXISTS public.orders (
        order_id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT NOT NULL,
        shipping_address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT,
        pincode TEXT NOT NULL,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        subtotal INTEGER NOT NULL,
        payment_method TEXT DEFAULT 'razorpay',
        payment_id TEXT,
        payment_status TEXT DEFAULT 'PAID',
        order_status TEXT DEFAULT 'Order Confirmed',
        courier_partner TEXT DEFAULT 'Bluedart Express',
        tracking_number TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(customer_phone);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
    CREATE POLICY "Anyone can insert orders" 
    ON public.orders 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

    DROP POLICY IF EXISTS "Public can track order by id" ON public.orders;
    CREATE POLICY "Public can track order by id" 
    ON public.orders 
    FOR SELECT 
    TO anon, authenticated 
    USING (true);

    DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
    CREATE POLICY "Admins can manage orders" 
    ON public.orders 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
  `;

  await client.query(sql);
  console.log('✅ public.orders table, indexes, and RLS policies created successfully!');

  // Check table count
  const res = await client.query('SELECT count(*) FROM public.orders;');
  console.log('Current orders count:', res.rows[0].count);

  await client.end();
}

run().catch(console.error);
