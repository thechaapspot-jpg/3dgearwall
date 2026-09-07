/**
 * 3D Gear Wall - Local Development Server
 * Ultra-fast native Node.js HTTP server supporting clean URLs and static assets.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');
  
  if (safePath === '/' || safePath === '' || safePath === '/index.html') {
    safePath = '/index.html';
  }

  let filePath = path.join(ROOT, safePath);

  // 0. Handle Next.js Image requests: /_next/image?url=...
  if (urlPath === '/_next/image') {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const targetUrl = parsedUrl.searchParams.get('url');
      if (targetUrl) {
        const decoded = decodeURIComponent(targetUrl);
        // If it's a category icon: e.g. /category/bmw.png
        if (decoded.includes('/category/')) {
          const catFile = path.join(ROOT, 'category', path.basename(decoded.split('?')[0]));
          if (fs.existsSync(catFile)) return serveFile(catFile, res);
        }
        // Product image: e.g. https://res.cloudinary.com/.../products/lz1vc2oln1mxzjrohy2w.jpg
        const base = path.basename(decoded.split('?')[0]);
        // 1. Direct match in images/products/
        const prodFile = path.join(ROOT, 'images', 'products', base);
        if (fs.existsSync(prodFile) && fs.statSync(prodFile).isFile()) {
          return serveFile(prodFile, res);
        }

        // 2. Prefix match in _next/
        const prefix = base.replace(/\.[a-z0-9]+$/i, '');
        const nextDir = path.join(ROOT, '_next');
        if (fs.existsSync(nextDir)) {
          const matched = fs.readdirSync(nextDir).find(f => f.startsWith(prefix) && /\.(jpg|png|webp|jpeg)$/i.test(f));
          if (matched) {
            return serveFile(path.join(nextDir, matched), res);
          }
        }
      }
    } catch (e) {
      console.error('Error in /_next/image handler:', e.message);
    }
  }

  // 1. Check direct file
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(filePath, res);
  }

  // 2. Check clean URL: /collections -> /collections.html
  if (fs.existsSync(filePath + '.html') && fs.statSync(filePath + '.html').isFile()) {
    return serveFile(filePath + '.html', res);
  }

  // 3. Check /product/38 -> /product/38.html
  if (safePath.startsWith('/product/') && !safePath.endsWith('.html')) {
    const pHtml = filePath + '.html';
    if (fs.existsSync(pHtml) && fs.statSync(pHtml).isFile()) {
      return serveFile(pHtml, res);
    }
  }

  // 4. Legacy collections fallback: e.g. /collections3e8d.html -> /collections.html
  if (safePath.startsWith('/collections') && safePath.endsWith('.html')) {
    return serveFile(path.join(ROOT, 'collections.html'), res);
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <div style="font-family:sans-serif;text-align:center;padding:50px;background:#0d0d11;color:#fff;min-height:100vh;">
      <h1 style="color:#FF6B35;font-size:48px;margin-bottom:10px;">404</h1>
      <p style="font-size:18px;color:#aaa;">Page Not Found</p>
      <a href="/" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#FF6B35;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Return to 3D Gear Wall</a>
    </div>
  `);
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });

  fs.createReadStream(filePath).pipe(res);
}

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 3D Gear Wall Dev Server is running!`);
  console.log(`🌐 Local URL:   http://localhost:${PORT}`);
  console.log(`🛍️ Collections: http://localhost:${PORT}/collections`);
  console.log(`==================================================\n`);
});
