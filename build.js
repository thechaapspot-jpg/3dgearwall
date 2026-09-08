/**
 * 3D Gear Wall - Deployment Build Script
 * Prepares and syncs static assets to both root and public/ for seamless Vercel / Netlify / static deployments.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');

console.log('🚀 Starting 3D Gear Wall build process...');

// Ensure public directory exists
if (!fs.existsSync(PUBLIC)) {
  fs.mkdirSync(PUBLIC, { recursive: true });
}

// Helper to copy directory recursively
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'public' || entry.name === 'scratch') continue;
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper to copy a single file if it exists
function copyFileSafe(src, dest) {
  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

// 1. Copy critical directories to public/
const dirsToSync = ['images', 'category', 'product', 'css', 'js', '_next'];
for (const dir of dirsToSync) {
  const src = path.join(ROOT, dir);
  const dest = path.join(PUBLIC, dir);
  if (fs.existsSync(src)) {
    console.log(`📦 Syncing ${dir}/ -> public/${dir}/`);
    copyDirRecursive(src, dest);
  }
}

// 2. Copy root static files to public/
const filesToSync = [
  'index.html',
  'customize.html',
  'contact.html',
  'about.html',
  'collections.html',
  'track.html',
  'admin.html',
  '404.html',
  'free_bmw_m3_e30.glb',
  'shadow.png',
  'logo.png',
  'favicon.ico',
  'favicon.png',
  'favicon.svg',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'apple-touch-icon.png',
  'site.webmanifest',
  'og-image.png'
];

for (const file of filesToSync) {
  const src = path.join(ROOT, file);
  const dest = path.join(PUBLIC, file);
  if (fs.existsSync(src)) {
    copyFileSafe(src, dest);
  }
}

// Also ensure logo-dark.png and logo-footer.png are directly in public/ and public/images/
copyFileSafe(path.join(ROOT, 'images', 'logo-dark.png'), path.join(PUBLIC, 'images', 'logo-dark.png'));
copyFileSafe(path.join(ROOT, 'images', 'logo-footer.png'), path.join(PUBLIC, 'images', 'logo-footer.png'));
copyFileSafe(path.join(ROOT, 'images', 'logo-dark.png'), path.join(PUBLIC, 'logo-dark.png'));
copyFileSafe(path.join(ROOT, 'images', 'logo-footer.png'), path.join(PUBLIC, 'logo-footer.png'));
copyFileSafe(path.join(ROOT, 'images', 'logo-dark.png'), path.join(ROOT, 'logo-dark.png'));
copyFileSafe(path.join(ROOT, 'images', 'logo-footer.png'), path.join(ROOT, 'logo-footer.png'));

console.log('✅ Build complete! All assets synchronized for Vercel deployment.');
