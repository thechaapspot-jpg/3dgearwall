// 3D Gear Wall - Supabase Live Client Sync
// Dynamically synchronizes stock availability and live prices from Supabase

(function () {
  'use strict';

  const SUPABASE_URL = 'https://ipcutxtnjplptmxjdtax.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY3V0eHRuanBscHRteGpkdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjUwMTMsImV4cCI6MjEwNDQ0MTAxM30.WHsEzjWwNl8R48b8239RUIOPjuN7xbl-RdEQGLG_1LI';

  // REST fetch helper
  async function fetchProducts(query = '') {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products${query}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('Supabase sync offline:', e);
      return null;
    }
  }

  // Determine current page context
  const path = window.location.pathname;
  const isProductPage = path.includes('/product/') || path.match(/\/product\/\d+/);
  const isCollectionsPage = path.includes('collections') || path === '/' || path.endsWith('index.html');

  // ================= 1. SYNC PRODUCT DETAIL PAGE =================
  async function syncProductDetailPage() {
    const match = path.match(/product\/(\d+)/);
    if (!match) return;

    const productId = parseInt(match[1], 10);
    const products = await fetchProducts(`?id=eq.${productId}&select=*`);
    if (!products || products.length === 0) return;

    const p = products[0];

    // Live Price Update
    if (p.price) {
      const priceElements = document.querySelectorAll('.text-2xl.font-black, [data-testid="product-price"]');
      priceElements.forEach(el => {
        if (el.textContent.includes('₹')) {
          el.textContent = `₹${Number(p.price).toLocaleString('en-IN')}`;
        }
      });
    }

    // Out of Stock Handling
    if (p.out_of_stock) {
      // 1. Add SOLD OUT badge near title
      const titleEl = document.querySelector('h1');
      if (titleEl && !document.getElementById('live-soldout-badge')) {
        const badge = document.createElement('div');
        badge.id = 'live-soldout-badge';
        badge.className = 'inline-block my-2 px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider';
        badge.textContent = 'SOLD OUT / OUT OF STOCK';
        titleEl.parentNode.insertBefore(badge, titleEl.nextSibling);
      }

      // 2. Disable Buy Now & Add to Crate buttons
      const actionButtons = document.querySelectorAll('button, a');
      actionButtons.forEach(btn => {
        const text = (btn.textContent || '').toLowerCase().trim();
        if (
          text.includes('buy now') || 
          text.includes('add to crate') || 
          text.includes('add to cart') || 
          text.includes('buy it now')
        ) {
          btn.disabled = true;
          btn.style.pointerEvents = 'none';
          btn.style.opacity = '0.45';
          btn.style.cursor = 'not-allowed';
          btn.textContent = 'SOLD OUT';
        }
      });
    }
  }

  // ================= 2. SYNC COLLECTIONS & HOME PAGE =================
  async function syncCatalogCards() {
    const products = await fetchProducts('?select=id,price,original_price,out_of_stock');
    if (!products || products.length === 0) return;

    const productMap = new Map();
    products.forEach(p => productMap.set(Number(p.id), p));

    // Find all links to product pages
    const productLinks = document.querySelectorAll('a[href*="/product/"], a[href*="product/"]');
    
    productLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const match = href.match(/product\/(\d+)/);
      if (!match) return;

      const id = parseInt(match[1], 10);
      const p = productMap.get(id);
      if (!p) return;

      // Find the card container
      const card = link.closest('.group') || link.closest('article') || link.parentElement;
      if (!card) return;

      // Update out-of-stock badge
      if (p.out_of_stock && !card.querySelector('.live-card-soldout')) {
        const badge = document.createElement('div');
        badge.className = 'live-card-soldout absolute top-3 right-3 z-20 px-2.5 py-1 bg-black/90 border border-rose-500/60 text-rose-400 font-mono text-[10px] font-bold uppercase tracking-wider shadow-lg';
        badge.innerHTML = '● SOLD OUT';
        card.style.position = 'relative';
        card.appendChild(badge);

        // Dim the product card slightly
        const img = card.querySelector('img');
        if (img) {
          img.style.filter = 'grayscale(60%) contrast(90%)';
          img.style.opacity = '0.75';
        }

        // Disable any Add to Crate button in this card
        const cardBtns = card.querySelectorAll('button, [data-action="add-to-cart"]');
        cardBtns.forEach(btn => {
          btn.disabled = true;
          btn.style.pointerEvents = 'none';
          btn.style.opacity = '0.4';
          btn.textContent = 'Sold Out';
        });
      }

      // Update live price if found
      if (p.price) {
        const priceEls = card.querySelectorAll('.font-mono, .font-bold');
        priceEls.forEach(el => {
          if (el.textContent.includes('₹') && !el.textContent.includes('₹0')) {
            el.textContent = `₹${Number(p.price).toLocaleString('en-IN')}`;
          }
        });
      }
    });
  }

  // Execute sync on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSync);
  } else {
    runSync();
  }

  function runSync() {
    if (isProductPage) {
      syncProductDetailPage();
    }
    if (isCollectionsPage) {
      syncCatalogCards();
    }
  }

})();
