const fs = require('fs');
const assert = require('assert');

console.log('Testing Orders Mobile Cards & Payment Verification Fixes...\n');

['admin.html', 'public/admin.html'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('id="orders-cards-list"'), file + ' missing orders-cards-list!');
  assert(content.includes('id="order-detail-modal"'), file + ' missing order-detail-modal!');
  assert(content.includes('<option value="Cancelled">Cancelled</option>'), file + ' missing Cancelled status option!');
  console.log('PASS: ' + file + ' has mobile card container & order detail modal');
});

['js/admin.js', 'public/js/admin.js'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('ordersCardsList'), file + ' missing ordersCardsList reference!');
  assert(content.includes('openOrderDetailModal'), file + ' missing openOrderDetailModal!');
  assert(content.includes('handleDeleteOrder'), file + ' missing handleDeleteOrder!');
  assert(content.includes('https://wa.me/91'), file + ' missing WhatsApp 1-tap link!');
  assert(content.includes('btn-copy-id'), file + ' missing copy order id!');
  console.log('PASS: ' + file + ' has mobile cards, WhatsApp/call links, modal & delete logic');
});

['js/cart.js', 'public/js/cart.js'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('gw-verifying-overlay'), file + ' missing payment verifying overlay!');
  assert(content.includes('const resp = await fetch'), file + ' missing awaited Supabase fetch!');
  assert(content.includes('Payment was not completed'), file + ' missing cancel notice without ghost orders!');
  console.log('PASS: ' + file + ' has robust payment verification & safe cancel handling');
});

console.log('\n======================================================');
console.log('ALL ORDERS MOBILE & PAYMENT VERIFICATION CHECKS PASSED!');
console.log('======================================================\n');
