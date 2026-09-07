/**
 * 3D Gear Wall - Collections Client-Side Filter & Interactive Catalog
 * Handles URL query parameter ?brand=..., quick brand pills, count updates, and instant filtering.
 */

(function () {
  'use strict';

  function initCollectionsFilter() {
    const grid = document.querySelector('.grid.grid-cols-2') || document.querySelector('.collection-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.collection-card'));
    if (cards.length === 0) return;

    // Parse card data: brand, title, scale, price
    const cardData = cards.map(card => {
      const brandEl = card.querySelector('p.uppercase');
      const titleEl = card.querySelector('h3');
      const brand = (brandEl ? brandEl.textContent.trim() : '').toLowerCase();
      const rawBrand = brandEl ? brandEl.textContent.trim() : '';
      const title = (titleEl ? titleEl.textContent.trim() : '').toLowerCase();
      
      // Also look for scale badge
      const scaleEl = card.querySelector('span');
      const scale = scaleEl ? scaleEl.textContent.trim() : '';

      return {
        element: card,
        brand: brand,
        rawBrand: rawBrand,
        title: title,
        scale: scale
      };
    });

    // Count products per brand
    const brandCounts = {};
    cardData.forEach(item => {
      if (item.rawBrand) {
        brandCounts[item.rawBrand] = (brandCounts[item.rawBrand] || 0) + 1;
      }
    });

    // Locate the count display element (e.g. "Showing 36 models")
    const countContainer = document.querySelector('section div.mb-8') || grid.previousElementSibling;
    let countSpan = countContainer ? countContainer.querySelector('span.font-semibold') : null;

    // Build the Brand Filter Pills Bar
    let filterPillsBar = document.getElementById('brand-pills-bar');
    if (!filterPillsBar && countContainer) {
      filterPillsBar = document.createElement('div');
      filterPillsBar.id = 'brand-pills-bar';
      filterPillsBar.className = 'filter-pills-bar mb-6';
      
      // Top featured brands
      const topBrands = ['All', 'Ferrari', 'Lamborghini', 'Porsche', 'Mercedes-AMG', 'McLaren', 'BMW', 'Defender', 'Batman', 'Nissan'];
      
      // Add any remaining brands
      Object.keys(brandCounts).forEach(b => {
        if (!topBrands.includes(b)) topBrands.push(b);
      });

      filterPillsBar.innerHTML = topBrands.map(b => {
        const count = b === 'All' ? cardData.length : (brandCounts[b] || 0);
        if (count === 0 && b !== 'All') return '';
        return `<button type="button" class="filter-pill" data-brand="${b.toLowerCase()}">
          ${b} <span style="font-size:11px;opacity:0.65;font-weight:normal;">(${count})</span>
        </button>`;
      }).join('');

      countContainer.parentNode.insertBefore(filterPillsBar, countContainer);
    }

    // Filter execution function
    function applyFilter(targetBrand, pushState = true) {
      const normalized = (targetBrand || 'all').toLowerCase().trim();
      let visibleCount = 0;

      cardData.forEach(item => {
        let match = false;
        if (normalized === 'all' || normalized === '') {
          match = true;
        } else {
          match = item.brand.includes(normalized) || item.title.includes(normalized);
        }

        if (match) {
          item.element.style.display = '';
          visibleCount++;
        } else {
          item.element.style.display = 'none';
        }
      });

      // Update pills active state
      if (filterPillsBar) {
        const pills = filterPillsBar.querySelectorAll('.filter-pill');
        pills.forEach(pill => {
          const pillBrand = pill.getAttribute('data-brand');
          if (pillBrand === normalized || (normalized === 'all' && pillBrand === 'all')) {
            pill.classList.add('active');
          } else {
            pill.classList.remove('active');
          }
        });
      }

      // Update count text
      if (countContainer) {
        const brandNameCapitalized = normalized === 'all' ? '' : (targetBrand.charAt(0).toUpperCase() + targetBrand.slice(1));
        countContainer.innerHTML = `
          <div class="flex items-center justify-between flex-wrap gap-3">
            <p class="text-sm text-black/60">
              Showing <span class="font-bold text-black">${visibleCount}</span> ${brandNameCapitalized} models
            </p>
            ${normalized !== 'all' ? `
              <button id="reset-filter-btn" style="font-size:12px;font-weight:600;color:#FF6B35;background:transparent;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                ✕ Clear brand filter
              </button>
            ` : ''}
          </div>
        `;

        const resetBtn = document.getElementById('reset-filter-btn');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => applyFilter('all', true));
        }
      }

      // Update browser URL
      if (pushState) {
        const url = new URL(window.location);
        if (normalized === 'all') {
          url.searchParams.delete('brand');
        } else {
          url.searchParams.set('brand', targetBrand);
        }
        window.history.pushState({}, '', url.toString());
      }
    }

    // Attach click listeners to filter pills
    if (filterPillsBar) {
      filterPillsBar.addEventListener('click', e => {
        const btn = e.target.closest('.filter-pill');
        if (!btn) return;
        const brand = btn.getAttribute('data-brand');
        applyFilter(brand, true);
      });
    }

    // Read brand from current URL query
    const currentParams = new URLSearchParams(window.location.search);
    const initialBrand = currentParams.get('brand');
    if (initialBrand) {
      applyFilter(initialBrand, false);
    } else {
      applyFilter('all', false);
    }

    // Listen to browser back/forward buttons
    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(window.location.search);
      applyFilter(p.get('brand') || 'all', false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCollectionsFilter);
  } else {
    initCollectionsFilter();
  }
})();
