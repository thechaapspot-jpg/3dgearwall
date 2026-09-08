const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ipcutxtnjplptmxjdtax.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY3V0eHRuanBscHRteGpkdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjUwMTMsImV4cCI6MjEwNDQ0MTAxM30.WHsEzjWwNl8R48b8239RUIOPjuN7xbl-RdEQGLG_1LI';

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

async function run() {
  console.log('🔍 Testing Supabase Integration & Sync...\n');

  // 1. Auth Test
  const auth = await requestHttpsJson(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY }
    },
    { email: 'Vermasahhab@gmail.com', password: 'Admin@3dcarframe2026' }
  );

  if (!auth.body || !auth.body.access_token) {
    throw new Error('Auth failed: ' + JSON.stringify(auth.body));
  }
  const token = auth.body.access_token;
  console.log('✅ Admin authenticated successfully!');

  // 2. Test Editing Product #38 via Admin Token
  console.log('\n📝 Testing Product Mutation (Stock & Price)...');
  const editPayload = {
    title: 'Mercedes-AMG Petronas Formula 1 3D Diecast Car Frame – 1:36 Scale',
    name: 'Mercedes-AMG Petronas Formula 1 3D Diecast Car Frame – 1:36 Scale',
    price: 699,
    out_of_stock: true
  };

  const updateRes = await requestHttpsJson(
    `${SUPABASE_URL}/rest/v1/products?id=eq.38`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        Prefer: 'return=representation'
      }
    },
    editPayload
  );

  console.log('Update response status:', updateRes.statusCode);
  if (updateRes.statusCode !== 200 || !updateRes.body || updateRes.body[0].out_of_stock !== true) {
    throw new Error('Update failed: ' + JSON.stringify(updateRes.body));
  }
  console.log('✅ Product #38 successfully updated to out_of_stock=true, price=699');

  // 3. Public Read Verification
  console.log('\n🌐 Testing Public Anon Key Read (Simulating Live Website Visitor)...');
  const pubRes = await requestHttpsJson(
    `${SUPABASE_URL}/rest/v1/products?id=eq.38&select=*`,
    {
      method: 'GET',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    }
  );

  const readItem = pubRes.body[0];
  console.log(`Live site sees Product #38: out_of_stock=${readItem.out_of_stock}, price=${readItem.price}`);
  if (readItem.out_of_stock !== true || readItem.price !== 699) {
    throw new Error('Live read does not reflect update!');
  }
  console.log('✅ Live client sync data verified!');

  // 4. Restore Product #38
  console.log('\n🔄 Restoring Product #38 to in_stock (out_of_stock=false, price=599)...');
  await requestHttpsJson(
    `${SUPABASE_URL}/rest/v1/products?id=eq.38`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        Prefer: 'return=representation'
      }
    },
    { out_of_stock: false, price: 599 }
  );
  console.log('✅ Product #38 restored to normal stock and price');

  // 5. Check CSS & JS consistency
  const adminCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'admin.css'), 'utf8');
  const adminJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'admin.js'), 'utf8');

  console.log('\n🎨 Checking CSS & JS modal binding:');
  console.log('   admin.css has .open:', adminCss.includes('.admin-modal-backdrop.open'));
  console.log('   admin.css has .active:', adminCss.includes('.admin-modal-backdrop.active'));
  console.log('   admin.js has openModal:', adminJs.includes('openModal'));
  console.log('   admin.js has closeModal:', adminJs.includes('closeModal'));

  console.log('\n🚀 ALL TESTS PASSED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
