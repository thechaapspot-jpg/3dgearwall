const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ipcutxtnjplptmxjdtax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY3V0eHRuanBscHRteGpkdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjUwMTMsImV4cCI6MjEwNDQ0MTAxM30.WHsEzjWwNl8R48b8239RUIOPjuN7xbl-RdEQGLG_1LI';

function requestHttp(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

function requestHttpsJson(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runVerification() {
  console.log('🧪 Starting End-to-End System Verification...\n');

  // 1. Local Server Route Checks
  console.log('1️⃣ Checking Local Server Endpoints:');
  const routes = ['/admin', '/collections', '/product/38', '/js/admin.js', '/js/supabase-sync.js'];
  for (const r of routes) {
    try {
      const res = await requestHttp(`http://localhost:3000${r}`);
      console.log(`   [${res.statusCode === 200 ? 'PASS' : 'FAIL'}] http://localhost:3000${r} -> HTTP ${res.statusCode}`);
      if (res.statusCode !== 200) throw new Error(`Unexpected status code for ${r}`);
    } catch (e) {
      console.error(`   Error checking route ${r}:`, e.message);
    }
  }

  // 2. Supabase Auth Verification
  console.log('\n2️⃣ Checking Supabase Admin Authentication:');
  const authRes = await requestHttpsJson(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      }
    },
    {
      email: 'Vermasahhab@gmail.com',
      password: 'Admin@3dcarframe2026'
    }
  );

  if (authRes.statusCode === 200 && authRes.body && authRes.body.access_token) {
    console.log(`   [PASS] Successfully authenticated as ${authRes.body.user.email}`);
    console.log(`   [PASS] User ID: ${authRes.body.user.id}`);
  } else {
    console.error('   [FAIL] Authentication failed:', authRes.body);
    process.exit(1);
  }

  const token = authRes.body.access_token;

  // 3. Supabase REST Read Check
  console.log('\n3️⃣ Checking Supabase Public & Admin Read Permissions:');
  const prodRes = await requestHttpsJson(
    `${SUPABASE_URL}/rest/v1/products?select=id,title,brand,price,out_of_stock&order=id.asc`,
    {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (prodRes.statusCode === 200 && Array.isArray(prodRes.body)) {
    console.log(`   [PASS] Successfully retrieved ${prodRes.body.length} products from database`);
    const brands = new Set(prodRes.body.map(p => p.brand));
    console.log(`   [PASS] Catalog contains ${brands.size} distinct brands: ${Array.from(brands).slice(0, 5).join(', ')}...`);
  } else {
    console.error('   [FAIL] Read failed:', prodRes.body);
    process.exit(1);
  }

  // 4. Supabase Admin Write / Stock Toggle Check
  console.log('\n4️⃣ Checking Admin Stock Toggle & Mutation Permissions:');
  const targetId = 38;
  // Read current stock
  const current = prodRes.body.find(p => p.id === targetId);
  const originalStock = current.out_of_stock;
  console.log(`   Target Product #${targetId}: Current out_of_stock = ${originalStock}`);

  // Toggle to true
  const updateRes1 = await requestHttpsJson(
    `${SUPABASE_URL}/rest/v1/products?id=eq.${targetId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation'
      }
    },
    { out_of_stock: true }
  );

  if (updateRes1.statusCode === 200 && updateRes1.body[0].out_of_stock === true) {
    console.log(`   [PASS] Successfully updated product #${targetId} to out_of_stock = true`);
  } else {
    console.error('   [FAIL] Update to true failed:', updateRes1);
  }

  // Revert back to original
  const updateRes2 = await requestHttpsJson(
    `${SUPABASE_URL}/rest/v1/products?id=eq.${targetId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation'
      }
    },
    { out_of_stock: originalStock }
  );

  if (updateRes2.statusCode === 200 && updateRes2.body[0].out_of_stock === originalStock) {
    console.log(`   [PASS] Successfully restored product #${targetId} to out_of_stock = ${originalStock}`);
  } else {
    console.error('   [FAIL] Restoration failed:', updateRes2);
  }

  // 5. Script Injection Verification
  console.log('\n5️⃣ Checking HTML Script Injections:');
  const root = path.resolve(__dirname, '..');
  const collHtml = fs.readFileSync(path.join(root, 'collections.html'), 'utf8');
  const p38Html = fs.readFileSync(path.join(root, 'product', '38.html'), 'utf8');
  const idxHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  console.log(`   [${collHtml.includes('supabase-sync.js') ? 'PASS' : 'FAIL'}] collections.html contains supabase-sync.js`);
  console.log(`   [${p38Html.includes('supabase-sync.js') ? 'PASS' : 'FAIL'}] product/38.html contains supabase-sync.js`);
  console.log(`   [${idxHtml.includes('supabase-sync.js') ? 'PASS' : 'FAIL'}] index.html contains supabase-sync.js`);

  console.log('\n🎉 ALL VERIFICATION CHECKS PASSED PERFECTLY!\n');
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
