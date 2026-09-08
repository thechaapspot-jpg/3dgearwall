/**
 * 3D Gear Wall - Supabase Database Initializer and Seeder
 * Connects directly to Supabase via Postgres client, creates tables, RLS policies,
 * seeds all 36 products, and provisions the initial Admin user.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const SUPABASE_URL = 'https://ipcutxtnjplptmxjdtax.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY3V0eHRuanBscHRteGpkdGF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODg2NTAxMywiZXhwIjoyMTA0NDQxMDEzfQ.zFU3xygYAe3rkN7ln8g9tPSEFj1MUuTvWvQ7JhLdyqA';
const POSTGRES_URL = 'postgres://postgres.ipcutxtnjplptmxjdtax:kt3g7Lh6m3PBe8aK@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=no-verify';

const ADMIN_EMAIL = 'Vermasahhab@gmail.com';
const ADMIN_PASSWORD = 'Admin@3dcarframe2026';

async function main() {
  console.log('🚀 Connecting to Supabase PostgreSQL...');
  const pgClient = new Client({
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  await pgClient.connect();
  console.log('✅ Connected to Postgres database!');

  // 1. Run Schema SQL
  console.log('📜 Executing schema.sql...');
  const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');
  await pgClient.query(schemaSql);
  console.log('✅ Tables, indexes, triggers, and RLS policies established!');

  // 2. Load extracted products
  console.log('🔍 Loading products from scripts/initial_products.json...');
  const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'initial_products.json'), 'utf8'));
  console.log(`📦 Loaded ${products.length} products!`);

  // 3. Upsert products into public.products
  console.log('💾 Seeding products into Supabase public.products table...');
  for (const p of products) {
    const query = `
      INSERT INTO public.products (
        id, name, brand, price, original_price, scale, frame_size, 
        image, images, description, features, specifications, 
        stock, out_of_stock, featured, is_active, is_customizable, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        brand = EXCLUDED.brand,
        price = EXCLUDED.price,
        original_price = EXCLUDED.original_price,
        scale = EXCLUDED.scale,
        frame_size = EXCLUDED.frame_size,
        image = EXCLUDED.image,
        images = EXCLUDED.images,
        description = EXCLUDED.description,
        features = EXCLUDED.features,
        stock = EXCLUDED.stock,
        out_of_stock = EXCLUDED.out_of_stock,
        featured = EXCLUDED.featured,
        is_active = EXCLUDED.is_active,
        updated_at = now();
    `;

    // Ensure Cloudinary URLs are clean https://
    const mainImg = p.image.startsWith('../') ? 'https://' + p.image.replace(/^\.\.\//, '') : p.image;
    const allImgs = (p.images || [p.image]).map(img => img.startsWith('../') ? 'https://' + img.replace(/^\.\.\//, '') : img);

    await pgClient.query(query, [
      p.id,
      p.name,
      p.brand,
      p.price,
      p.original_price,
      p.scale || '1:36',
      p.frame_size || '15x20',
      mainImg,
      allImgs,
      p.description || '',
      JSON.stringify(p.features || []),
      p.specifications ? JSON.stringify(p.specifications) : null,
      p.stock !== undefined ? p.stock : 5,
      p.out_of_stock || false,
      p.featured !== false,
      p.is_active !== false,
      p.is_customizable || false,
      p.created_at || new Date().toISOString(),
      p.updated_at || new Date().toISOString()
    ]);
  }
  console.log(`✅ Successfully seeded all ${products.length} products!`);
  await pgClient.end();

  // 4. Provision Admin User in Supabase Auth
  console.log('👤 Provisioning initial Admin user in Supabase Auth...');
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Error checking users:', listError.message);
  } else {
    const existing = users.users.find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (existing) {
      console.log(`ℹ️ Admin user ${ADMIN_EMAIL} already exists (ID: ${existing.id}). Updating password...`);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: ADMIN_PASSWORD,
        email_confirm: true
      });
      if (updateError) console.error('Password update error:', updateError.message);
      else console.log('✅ Admin password updated successfully!');
    } else {
      console.log(`Creating new Admin user: ${ADMIN_EMAIL}...`);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'admin', name: 'Store Owner' }
      });
      if (createError) console.error('Admin create error:', createError.message);
      else console.log(`✅ Admin user created successfully (ID: ${newUser.user.id})!`);
    }
  }

  console.log('\n======================================================');
  console.log('🎉 Supabase Setup & Seeding Complete!');
  console.log(`🌐 Supabase URL:    ${SUPABASE_URL}`);
  console.log(`🔑 Admin Email:       ${ADMIN_EMAIL}`);
  console.log(`🔑 Admin Password:    ${ADMIN_PASSWORD}`);
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
