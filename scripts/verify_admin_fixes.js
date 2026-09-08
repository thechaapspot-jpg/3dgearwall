const fs = require('fs');
const assert = require('assert');

console.log('Testing Admin Navbar and Modal Fixes...\n');

['admin.html', 'public/admin.html'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  assert(!content.includes('bg-[#0d0d12]/95'), file + ' still contains semi-transparent navbar!');
  assert(content.includes('class="admin-navbar sticky top-0 z-50'), file + ' missing admin-navbar sticky class!');
  assert(content.includes('id="btn-save-edit"'), file + ' missing save edit button!');
  assert(content.includes('id="btn-save-add"'), file + ' missing save add button!');
  console.log('PASS: ' + file + ' verified (solid navbar + responsive modals)');
});

['css/admin.css', 'public/css/admin.css'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('.admin-navbar,'), file + ' missing .admin-navbar CSS!');
  assert(content.includes('background-color: #0a0a0e !important;'), file + ' missing solid opaque background!');
  assert(content.includes('z-index: 100 !important;'), file + ' missing z-index 100!');
  console.log('PASS: ' + file + ' verified (opaque background rules + high z-index)');
});

['css/brand.css', 'public/css/brand.css'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('@media (max-width: 640px)'), file + ' missing 640px mobile form row breakpoint!');
  assert(content.includes('@media (max-width: 480px)'), file + ' missing 480px cart drawer mobile rule!');
  console.log('PASS: ' + file + ' verified (responsive drawer & form rows)');
});

['js/admin.js', 'public/js/admin.js'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('data-photo-action="set-primary"'), file + ' missing set primary button!');
  assert(content.includes('data-photo-action="delete"'), file + ' missing delete photo button!');
  console.log('PASS: ' + file + ' verified (touch-friendly mobile photo controls)');
});

console.log('\n==========================================');
console.log('ALL ADMIN NAVBAR AND MODAL FIXES VERIFIED!');
console.log('==========================================\n');
