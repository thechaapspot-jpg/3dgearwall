const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const syncScriptTag = '<script src="/js/supabase-sync.js" defer></script>';

// 1. Update product HTML files
const productDirs = [path.join(ROOT, 'product'), path.join(ROOT, 'public', 'product')];

let updatedCount = 0;
for (const pDir of productDirs) {
  if (!fs.existsSync(pDir)) continue;
  const files = fs.readdirSync(pDir).filter(f => f.endsWith('.html'));
  for (const file of files) {
    const fullPath = path.join(pDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('supabase-sync.js')) {
      if (content.includes('<script src="/js/product-detail.js" defer></script>')) {
        content = content.replace(
          '<script src="/js/product-detail.js" defer></script>',
          '<script src="/js/product-detail.js" defer></script>\n<script src="/js/supabase-sync.js" defer></script>'
        );
      } else if (content.includes('</body>')) {
        content = content.replace('</body>', `${syncScriptTag}\n</body>`);
      }
      fs.writeFileSync(fullPath, content, 'utf8');
      updatedCount++;
    }
  }
}

console.log(`Updated ${updatedCount} product pages with supabase-sync.js`);

// 2. Update index.html and public/index.html
const indexFiles = [path.join(ROOT, 'index.html'), path.join(ROOT, 'public', 'index.html')];
for (const idxPath of indexFiles) {
  if (fs.existsSync(idxPath)) {
    let content = fs.readFileSync(idxPath, 'utf8');
    if (!content.includes('supabase-sync.js')) {
      content = content.replace('</body>', `${syncScriptTag}\n</body>`);
      fs.writeFileSync(idxPath, content, 'utf8');
      console.log(`Updated ${path.relative(ROOT, idxPath)}`);
    }
  }
}

// 3. Update public/collections.html
const pubColl = path.join(ROOT, 'public', 'collections.html');
if (fs.existsSync(pubColl)) {
  let content = fs.readFileSync(pubColl, 'utf8');
  if (!content.includes('supabase-sync.js')) {
    if (content.includes('<script src="js/collections-filter.js" defer></script>')) {
      content = content.replace(
        '<script src="js/collections-filter.js" defer></script>',
        '<script src="js/collections-filter.js" defer></script>\n<script src="/js/supabase-sync.js" defer></script>'
      );
    } else {
      content = content.replace('</body>', `${syncScriptTag}\n</body>`);
    }
    fs.writeFileSync(pubColl, content, 'utf8');
    console.log(`Updated public/collections.html`);
  }
}
