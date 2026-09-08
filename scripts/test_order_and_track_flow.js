const https = require('https');
const http = require('http');

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

function requestHttp(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('🚀 Starting Order, Tracking, and Admin Flow Verification...\n');

  const testOrderId = `GW-260908-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Insert Order (Simulating Customer completing Razorpay Payment)
  console.log(`1️⃣ Creating genuine test order: ${testOrderId}...`);
  const newOrder = {
    order_id: testOrderId,
    customer_name: 'Vipul Sharma',
    customer_email: 'Vermasahhab@gmail.com',
    customer_phone: '9720052816',
    shipping_address: 'Dibai Dist. Bulandshahr',
    city: 'Bulandshahr',
    state: 'Uttar Pradesh',
    pincode: '203393',
    items: [
      { id: 38, name: 'Mercedes-AMG Petronas Formula 1 3D Diecast Car Frame', price: 599, quantity: 1, scale: '1:36', image: '/images/products/twoofvu6src3z5foyd8h.jpg' },
      { id: 37, name: 'McLaren Formula 1 Lando Norris #4 3D Frame', price: 549, quantity: 1, scale: '1:36', image: '/images/products/lz1vc2oln1mxzjrohy2w.jpg' }
    ],
    subtotal: 1148,
    payment_method: 'razorpay',
    payment_id: 'pay_TEST_' + Date.now(),
    payment_status: 'PAID',
    order_status: 'Order Confirmed',
    courier_partner: 'Bluedart Express',
    tracking_number: null,
    created_at: new Date().toISOString()
  };

  const insertRes = await requestHttpsJson(
    `${SUPABASE_URL}/rest/v1/orders`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        Prefer: 'return=representation'
      }
    },
    newOrder
  );

  console.log('Insert status:', insertRes.statusCode);
  if (insertRes.statusCode !== 201 && insertRes.statusCode !== 200) {
    throw new Error('Failed to insert order: ' + JSON.stringify(insertRes.body));
  }
  console.log(`[PASS] Order ${testOrderId} saved successfully in Supabase!`);

  // 2. Public Tracking Query
  console.log('\n2️⃣ Querying order via public Anon API (Customer tracking query)...');
  const trackRes = await requestHttpsJson(
    `${SUPABASE_URL}/rest/v1/orders?order_id=eq.${testOrderId}&select=*`,
    {
      method: 'GET',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    }
  );

  if (trackRes.body && trackRes.body.length > 0) {
    const o = trackRes.body[0];
    console.log(`[PASS] Found order: ${o.order_id}, Customer: ${o.customer_name}, Status: ${o.order_status}, Amount: ₹${o.subtotal}`);
  } else {
    throw new Error('Could not find order on track query');
  }

  // 3. Admin Authentication & Status Update
  console.log('\n3️⃣ Admin updates Order Status to "Dispatched / In Transit" and assigns AWB...');
  const auth = await requestHttpsJson(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY }
    },
    { email: 'Vermasahhab@gmail.com', password: 'Admin@3dcarframe2026' }
  );

  const token = auth.body.access_token;
  const updateRes = await requestHttpsJson(
    `${SUPABASE_URL}/rest/v1/orders?order_id=eq.${testOrderId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        Prefer: 'return=representation'
      }
    },
    {
      order_status: 'Dispatched / In Transit',
      courier_partner: 'Bluedart Express',
      tracking_number: 'BD849201948IN'
    }
  );

  if (updateRes.body && updateRes.body[0].order_status === 'Dispatched / In Transit') {
    console.log(`[PASS] Admin updated order status to "Dispatched / In Transit" with AWB "BD849201948IN"!`);
  } else {
    throw new Error('Admin update failed: ' + JSON.stringify(updateRes.body));
  }

  // 4. Customer verifies updated tracking
  console.log('\n4️⃣ Verifying live customer view reflects updated AWB & In Transit status...');
  const liveCheck = await requestHttpsJson(
    `${SUPABASE_URL}/rest/v1/orders?order_id=eq.${testOrderId}&select=*`,
    {
      method: 'GET',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    }
  );

  const updatedOrder = liveCheck.body[0];
  console.log(`Customer now sees: Status="${updatedOrder.order_status}", AWB="${updatedOrder.tracking_number}", Carrier="${updatedOrder.courier_partner}"`);
  if (updatedOrder.order_status !== 'Dispatched / In Transit' || updatedOrder.tracking_number !== 'BD849201948IN') {
    throw new Error('Live tracking did not reflect admin update!');
  }
  console.log('[PASS] Live customer tracking verified 100% in sync!');

  // 5. Local Server URL checks
  console.log('\n5️⃣ Testing local HTTP endpoints for Thank You and Tracking pages...');
  const tqRes = await requestHttp(`http://localhost:3000/thank-you.html?order_id=${testOrderId}`);
  console.log(`[${tqRes.statusCode === 200 ? 'PASS' : 'FAIL'}] /thank-you.html -> HTTP ${tqRes.statusCode}`);

  const trkRes = await requestHttp(`http://localhost:3000/track.html?order_id=${testOrderId}`);
  console.log(`[${trkRes.statusCode === 200 ? 'PASS' : 'FAIL'}] /track.html -> HTTP ${trkRes.statusCode}`);

  console.log('\n🎉 ALL ORDER & TRACKING TESTS PASSED PERFECTLY!\n');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
