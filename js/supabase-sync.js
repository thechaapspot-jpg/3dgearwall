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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Determine current page context
  const path = window.location.pathname;
  const isProductPage = path.includes('/product/') || Boolean(path.match(/\/product\/\d+/));
  const isCollectionsPage = path.includes('collections') || path === '/' || path.endsWith('index.html') || path === '';

  function resolveProductImageUrl(url) {
    if (!url) return '/images/products/placeholder.jpg';
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/');
      const filename = parts[parts.length - 1].split('?')[0];
      return `/images/products/${filename}`;
    }
    return url;
  }

  // ================= 1. SYNC PRODUCT DETAIL PAGE =================
  async function syncProductDetailPage(force = false) {
    const match = path.match(/product\/(\d+)/);
    if (!match) return;

    const productId = parseInt(match[1], 10);
    const products = await fetchProducts(`?id=eq.${productId}&select=*`, force);
    if (!products || products.length === 0) return;

    const p = products[0];
    const title = p.title || p.name || '';
    const photos = (Array.isArray(p.photos) && p.photos.length > 0) ? p.photos : ((Array.isArray(p.images) && p.images.length > 0) ? p.images : []);
    const rawPrimaryImg = photos[0] || p.image || '';
    const primaryImg = resolveProductImageUrl(rawPrimaryImg);

    // 1. Live Title & Meta Updates (only if custom/new product)
    if (title) {
      const h1 = document.querySelector('h1');
      if (h1 && (h1.dataset.synced !== 'true' && h1.textContent.trim() !== title.trim())) {
        h1.textContent = title;
        h1.dataset.synced = 'true';
      }
      document.title = `${title} - 3D Die-Cast Car Frame Wall Art | 3D Gear Wall`;

      // Breadcrumb last span
      const breadcrumbs = document.querySelectorAll('nav a, nav span');
      if (breadcrumbs.length > 0) {
        const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        if (lastBreadcrumb && lastBreadcrumb.tagName.toLowerCase() === 'span') {
          lastBreadcrumb.textContent = title;
        }
      }
    }

    // 2. Brand & Scale Updates
    if (p.brand) {
      const brandEl = document.querySelector('p.uppercase, [class*="tracking-[0.2em]"]');
      if (brandEl) brandEl.textContent = p.brand;
    }
    if (p.scale) {
      const scaleEl = document.querySelector('[class*="bg-black text-white text-xs font-bold"]');
      if (scaleEl) scaleEl.textContent = `Scale ${p.scale}`;
    }

    // 3. Description Update
    if (p.description) {
      const descEl = document.querySelector('main p.text-black\\/60');
      if (descEl) descEl.textContent = p.description;
    }

    // 4. Hero & Gallery Images (only override if custom uploaded photo in Supabase Storage or data URL)
    if (rawPrimaryImg && (rawPrimaryImg.includes('supabase.co/storage') || rawPrimaryImg.startsWith('data:'))) {
      const mainImg = document.querySelector('main .aspect-square img, main [class*="aspect-"] img');
      if (mainImg && mainImg.getAttribute('src') !== rawPrimaryImg) {
        mainImg.src = rawPrimaryImg;
        if (mainImg.hasAttribute('srcset')) mainImg.removeAttribute('srcset');
        if (mainImg.hasAttribute('imagesrcset')) mainImg.removeAttribute('imagesrcset');
        mainImg.alt = title;
      }
    }

    // 5. Live Price Update
    if (p.price) {
      const priceElements = document.querySelectorAll('.text-2xl.font-black, .text-3xl.font-black, [data-testid="product-price"]');
      priceElements.forEach(el => {
        if (el.textContent.includes('₹')) {
          el.textContent = `₹${Number(p.price).toLocaleString('en-IN')}`;
        }
      });
    }

    // 6. Out of Stock Two-Way Handling
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

  // Helper to construct a catalog card element matching collections.html markup
  function createCatalogCardElement(p) {
    const card = document.createElement('div');
    card.className = 'collection-card';
    card.dataset.productId = String(p.id);

    const title = p.title || p.name || `Model #${p.id}`;
    const brand = p.brand || 'Luxury';
    const price = Number(p.price) || 599;
    const origPrice = p.original_price ? Number(p.original_price) : null;
    const rawPrimaryImg = photos[0] || p.image || '/images/products/placeholder.jpg';
    const primaryImg = resolveProductImageUrl(rawPrimaryImg);

    const outOfStockBadgeHtml = p.out_of_stock ?
      `<span class="out-of-stock-badge absolute top-3 right-3 z-10 bg-black/85 backdrop-blur-sm text-white border border-white/20 text-[10px] font-black px-2.5 py-1 tracking-wider uppercase">OUT OF STOCK</span>` : '';

    const origPriceHtml = origPrice ?
      `<p class="text-xs text-black/40 line-through">₹${origPrice.toLocaleString('en-IN')}</p>` : '';

    const buttonHtml = p.out_of_stock ?
      `<button disabled="" class="w-full flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm font-semibold transition-all bg-black/10 text-black/40 cursor-not-allowed"><span class="whitespace-nowrap">Out of Stock</span></button>` :
      `<button class="w-full flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm font-semibold transition-all bg-[var(--bg-black)] text-white hover:bg-black">
        <svg class="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <span class="whitespace-nowrap">Add to Crate</span>
      </button>`;

    card.innerHTML = `
      <div class="relative overflow-hidden transition-all duration-300">
        <a class="block cursor-pointer group" href="/product/${p.id}.html">
          <div class="relative aspect-[2/3] md:aspect-[4/5] overflow-hidden bg-[var(--bg-light)]">
            ${outOfStockBadgeHtml}
            <img alt="${escapeHtml(title)}" loading="lazy" decoding="async" class="object-cover transition-transform duration-500 group-hover:scale-105" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" src="${escapeHtml(primaryImg)}" />
          </div>
          <div class="p-4">
            <p class="text-[10px] text-black/40 tracking-[0.1em] uppercase mb-1">${escapeHtml(brand)}</p>
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
              <h3 class="text-sm md:text-base font-semibold text-black line-clamp-2 md:line-clamp-1 flex-1 group-hover:text-black/70 transition-colors">${escapeHtml(title)}</h3>
              <div class="flex items-baseline gap-2 flex-shrink-0">
                ${origPriceHtml}
                <p class="text-base font-bold text-black">₹${price.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </a>
        <div class="px-4 pb-4">
          ${buttonHtml}
        </div>
      </div>
    `;

    return card;
  }

  // ================= 2. SYNC COLLECTIONS & HOME PAGE =================
  async function syncCatalogCards(force = false) {
    const products = await fetchProducts('?order=id.desc', force);
    if (!products || products.length === 0) return;

    const productMap = new Map();
    products.forEach(p => productMap.set(Number(p.id), p));

    // Dynamic catalog card creation & removal on collections page
    const grid = document.querySelector('.grid.grid-cols-2') || document.querySelector('.collection-grid');
    let hasCardChanges = false;

    if (grid && (path.includes('collections') || !path.includes('/product/'))) {
      const existingCards = Array.from(grid.querySelectorAll('.collection-card'));
      const existingIds = new Set();

      existingCards.forEach(card => {
        const link = card.querySelector('a[href*="product/"]');
        if (link) {
          const href = link.getAttribute('href') || '';
          const match = href.match(/product\/(\d+)/);
          if (match) {
            const id = parseInt(match[1], 10);
            const p = productMap.get(id);
            // If product was deleted from DB or marked inactive, remove card immediately!
            if (!p || p.is_active === false) {
              card.remove();
              hasCardChanges = true;
            } else {
              existingIds.add(id);

              // Update title, brand, primary photo if changed in admin
              const titleEl = card.querySelector('h3');
              const newTitle = p.title || p.name;
              if (titleEl && newTitle && titleEl.textContent.trim() !== newTitle.trim()) {
                titleEl.textContent = newTitle;
                hasCardChanges = true;
              }
              const brandEl = card.querySelector('p.uppercase');
              if (brandEl && p.brand && brandEl.textContent.trim().toLowerCase() !== p.brand.trim().toLowerCase()) {
                brandEl.textContent = p.brand;
                hasCardChanges = true;
              }
              const photos = (Array.isArray(p.photos) && p.photos.length > 0) ? p.photos : ((Array.isArray(p.images) && p.images.length > 0) ? p.images : []);
              const rawImg = photos[0] || p.image;
              // Only override image if a custom uploaded photo from Supabase Storage or data URL is present
              if (rawImg && (rawImg.includes('supabase.co/storage') || rawImg.startsWith('data:'))) {
                const imgEl = card.querySelector('img');
                if (imgEl && imgEl.getAttribute('src') !== rawImg) {
                  imgEl.src = rawImg;
                  if (imgEl.hasAttribute('srcset')) imgEl.removeAttribute('srcset');
                }
              }
            }
          }
        }
      });

      // Insert any active products that don't yet exist in the DOM grid
      products.forEach(p => {
        const id = Number(p.id);
        if (p.is_active !== false && !existingIds.has(id)) {
          const newCard = createCatalogCardElement(p);
          
          // Insert in descending ID order
          let inserted = false;
          const currentCards = Array.from(grid.querySelectorAll('.collection-card'));
          for (const c of currentCards) {
            const cLink = c.querySelector('a[href*="product/"]');
            if (cLink) {
              const cMatch = (cLink.getAttribute('href') || '').match(/product\/(\d+)/);
              if (cMatch && parseInt(cMatch[1], 10) < id) {
                grid.insertBefore(newCard, c);
                inserted = true;
                break;
              }
            }
          }

          if (!inserted) {
            grid.appendChild(newCard);
          }

          existingIds.add(id);
          hasCardChanges = true;
        }
      });

      // If cards were added or removed, re-index collections filter immediately
      if (hasCardChanges && window.reindexCollections) {
        window.reindexCollections();
      }
    }

    // Find all links to product pages to sync prices, out-of-stock badges, and button states
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
            // Headliners dark section button
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
            // Standard light catalog button
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

  // Real-time inter-tab sync via BroadcastChannel & localStorage
  try {
    if (window.BroadcastChannel) {
      const bc = new BroadcastChannel('gw_catalog_sync');
      bc.onmessage = (ev) => {
        if (ev && ev.data && ev.data.type === 'CATALOG_UPDATED') {
          runSync(true);
        }
      };
    }
    window.addEventListener('storage', (e) => {
      if (e.key === 'gw_catalog_updated') {
        runSync(true);
      }
    });
  } catch (e) {}

  // Real-time re-sync when user tabs back
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) runSync(true);
  });
  window.addEventListener('focus', () => runSync(true));

  // Active polling every 4 seconds so external/mobile adds and deletes sync in real-time
  setInterval(() => {
    if (!document.hidden) runSync(true);
  }, 4000);

})();
