// 3D Gear Wall - Supabase Live Client Sync
// Two-way synchronization: Real-time stock status, pricing, and photo overrides

(function () {
  'use strict';

  const SUPABASE_URL = 'https://ipcutxtnjplptmxjdtax.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY3V0eHRuanBscHRteGpkdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjUwMTMsImV4cCI6MjEwNDQ0MTAxM30.WHsEzjWwNl8R48b8239RUIOPjuN7xbl-RdEQGLG_1LI';

  let cachedProducts = null;
  let lastFetchTime = 0;

  // REST fetch helper with short cache to avoid excessive network requests
  async function fetchProducts(query = '', force = false) {
    const now = Date.now();
    if (!force && query === '' && cachedProducts && (now - lastFetchTime < 10000)) {
      return cachedProducts;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products${query}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (query === '') {
        cachedProducts = data;
        lastFetchTime = now;
      }
      return data;
    } catch (e) {
      console.warn('Supabase sync offline:', e);
      return null;
    }
  }

  // Determine current page context
  const path = window.location.pathname;
  const isProductPage = path.includes('/product/') || path.match(/\/product\/\d+/);
  const isCollectionsPage = path.includes('collections') || path === '/' || path.endsWith('index.html') || path === '';

  // ================= 1. SYNC PRODUCT DETAIL PAGE =================
  async function syncProductDetailPage(force = false) {
    const match = path.match(/product\/(\d+)/);
    if (!match) return;

    const productId = parseInt(match[1], 10);
    const products = await fetchProducts(`?id=eq.${productId}&select=*`, force);
    if (!products || products.length === 0) return;

    const p = products[0];

    // 1. Live Price Update
    if (p.price) {
      const priceElements = document.querySelectorAll('.text-2xl.font-black, .text-3xl.font-black, [data-testid="product-price"]');
      priceElements.forEach(el => {
        if (el.textContent.includes('₹')) {
          el.textContent = `₹${Number(p.price).toLocaleString('en-IN')}`;
        }
      });
    }

    // 2. Out of Stock Two-Way Handling
    const titleEl = document.querySelector('h1');
    const existingBadge = document.getElementById('live-soldout-badge');
    const actionButtons = document.querySelectorAll('button, a');

    if (p.out_of_stock) {
      // Show SOLD OUT badge
      if (!existingBadge && titleEl) {
        const badge = document.createElement('div');
        badge.id = 'live-soldout-badge';
        badge.className = 'inline-block my-2 px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider';
        badge.textContent = 'SOLD OUT / OUT OF STOCK';
        titleEl.parentNode.insertBefore(badge, titleEl.nextSibling);
      }

      // Disable buttons
      actionButtons.forEach(btn => {
        const text = (btn.textContent || '').trim().toLowerCase();
        if (
          text.includes('buy now') || 
          text.includes('add to crate') || 
          text.includes('add to cart') || 
          text.includes('buy it now')
        ) {
          btn.dataset.origText = btn.dataset.origText || btn.textContent;
          btn.disabled = true;
          btn.style.pointerEvents = 'none';
          btn.style.opacity = '0.45';
          btn.style.cursor = 'not-allowed';
          btn.textContent = 'SOLD OUT';
        }
      });
    } else {
      // REMOVE SOLD OUT badge if present
      if (existingBadge) {
        existingBadge.remove();
      }

      // Re-enable buttons
      actionButtons.forEach(btn => {
        const text = (btn.textContent || '').trim().toLowerCase();
        if (text === 'sold out' || btn.dataset.origText) {
          btn.disabled = false;
          btn.style.pointerEvents = 'auto';
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
          if (btn.dataset.origText) {
            btn.textContent = btn.dataset.origText;
          }
        }
      });
    }
  }

  // ================= 2. SYNC COLLECTIONS & HOME PAGE =================
  async function syncCatalogCards(force = false) {
    const products = await fetchProducts('?select=id,price,original_price,out_of_stock,photos,image', force);
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
      const card = link.closest('.collection-card') || link.closest('.group') || link.closest('article') || link.parentElement;
      if (!card) return;

      const img = card.querySelector('img');
      const cardButtons = card.querySelectorAll('button');
      const liveBadge = card.querySelector('.live-card-soldout');
      const hardcodedBadge = card.querySelector('.out-of-stock-badge');

      if (p.out_of_stock) {
        // --- ITEM IS OUT OF STOCK ---
        if (!liveBadge && !hardcodedBadge) {
          const badge = document.createElement('div');
          badge.className = 'live-card-soldout absolute top-3 right-3 z-20 px-2.5 py-1 bg-black/90 border border-rose-500/60 text-rose-400 font-mono text-[10px] font-bold uppercase tracking-wider shadow-lg';
          badge.innerHTML = '● SOLD OUT';
          const imgContainer = card.querySelector('.aspect-\\[2\\/3\\]') || card.querySelector('.relative.overflow-hidden') || card;
          imgContainer.style.position = 'relative';
          imgContainer.appendChild(badge);
        } else if (hardcodedBadge) {
          hardcodedBadge.style.display = '';
        }

        if (img) {
          img.style.filter = 'grayscale(60%) contrast(90%)';
          img.style.opacity = '0.75';
        }

        cardButtons.forEach(btn => {
          btn.dataset.origHtml = btn.dataset.origHtml || btn.innerHTML;
          btn.disabled = true;
          btn.style.pointerEvents = 'none';
          btn.style.opacity = '0.4';
          btn.classList.add('cursor-not-allowed');
          btn.innerHTML = '<span class="whitespace-nowrap">Out of Stock</span>';
        });

      } else {
        // --- ITEM IS IN STOCK (CLEAR HARDCODED & LIVE BADGES) ---
        if (liveBadge) liveBadge.remove();
        if (hardcodedBadge) hardcodedBadge.style.display = 'none';

        if (img) {
          img.style.filter = '';
          img.style.opacity = '1';
        }

        cardButtons.forEach(btn => {
          if (!btn.dataset.origHtml) btn.dataset.origHtml = btn.innerHTML;
          if (!btn.dataset.origClass) btn.dataset.origClass = btn.className;

          btn.disabled = false;
          btn.style.pointerEvents = 'auto';
          btn.style.opacity = '1';
          btn.classList.remove('cursor-not-allowed');

          const isDarkCard = Boolean(
            card.closest('section')?.classList.contains('bg-[var(--bg-dark)]') ||
            card.querySelector('.bg-[var(--bg-dark-card)]') ||
            (btn.dataset.origClass && btn.dataset.origClass.includes('bg-white'))
          );

          if (isDarkCard) {
            // Headliners dark section button: Clean, high-contrast white button with black text & icon
            btn.classList.remove('bg-[var(--bg-black)]', 'text-white', 'hover:bg-black', 'bg-black/10', 'text-black/40');
            btn.classList.add('bg-white', 'text-black', 'hover:bg-white/90');
            if (btn.dataset.origHtml && btn.dataset.origHtml.includes('Add to Crate')) {
              btn.innerHTML = btn.dataset.origHtml;
            } else {
              btn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Add to Crate</span>
              `;
            }
          } else {
            // Standard light catalog button: Dark button with white text & icon
            btn.classList.remove('bg-white', 'text-black', 'hover:bg-white/90', 'bg-black/10', 'text-black/40');
            btn.classList.add('bg-[var(--bg-black)]', 'text-white', 'hover:bg-black');
            if (btn.dataset.origHtml && btn.dataset.origHtml.includes('Add to Crate')) {
              btn.innerHTML = btn.dataset.origHtml;
            } else {
              btn.innerHTML = `
                <svg class="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span class="whitespace-nowrap">Add to Crate</span>
              `;
            }
          }
        });
      }

      // Update live price if modified
      if (p.price) {
        const priceEls = card.querySelectorAll('.font-mono, .font-bold');
        priceEls.forEach(el => {
          if (el.textContent.includes('₹') && !el.textContent.includes('₹0') && !el.classList.contains('line-through')) {
            el.textContent = `₹${Number(p.price).toLocaleString('en-IN')}`;
          }
        });
      }
    });
  }

  function runSync(force = false) {
    if (isProductPage) syncProductDetailPage(force);
    if (isCollectionsPage) syncCatalogCards(force);
  }

  // Initial sync
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => runSync(false));
  } else {
    runSync(false);
  }

  // Real-time re-sync when user tabs back or every 10 seconds
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) runSync(true);
  });
  window.addEventListener('focus', () => runSync(true));

})();
