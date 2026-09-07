/**
 * 3D Gear Wall - Collections Client-Side Filter & Interactive Catalog
 * Handles:
 * - Brand filter (via URL ?brand=..., quick pills, or Filter Drawer)
 * - Search filter (via URL ?search=..., desktop input, or mobile dropdown search)
 * - Scale filter (1:18, 1:24, 1:36, 1:64)
 * - Price / Alphabetical sorting
 * - Filter Drawer & Mobile Search Bar open/close
 * - Real-time count & reset functionality
 */

(function () {
  'use strict';

  function initCollections() {
    const grid = document.querySelector('.grid.grid-cols-2') || document.querySelector('.collection-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.collection-card'));
    if (cards.length === 0) return;

    // Parse cards data
    const cardData = cards.map(card => {
      const brandEl = card.querySelector('p.uppercase');
      const titleEl = card.querySelector('h3');
      const priceEls = card.querySelectorAll('p');
      let price = 0;
      priceEls.forEach(p => {
        if (p.textContent.includes('₹') || p.textContent.includes('Rs.')) {
          const match = p.textContent.replace(/,/g, '').match(/\d+/);
          if (match) price = parseInt(match[0], 10);
        }
      });

      const rawBrand = brandEl ? brandEl.textContent.trim() : '';
      const brand = rawBrand.toLowerCase();
      const title = (titleEl ? titleEl.textContent.trim() : '').toLowerCase();
      
      let scale = '';
      const scaleMatch = (titleEl ? titleEl.textContent : '').match(/1:\d+/);
      if (scaleMatch) scale = scaleMatch[0];

      return {
        element: card,
        rawBrand,
        brand,
        title,
        scale,
        price,
        originalIndex: cards.indexOf(card)
      };
    });

    // Brand counts
    const brandCounts = {};
    cardData.forEach(item => {
      if (item.rawBrand) {
        brandCounts[item.rawBrand] = (brandCounts[item.rawBrand] || 0) + 1;
      }
    });

    // State
    let currentBrand = 'all';
    let currentScale = 'all';
    let currentSearch = '';
    let currentSort = 'featured';

    // Elements
    const countContainer = document.querySelector('section div.mb-8') || grid.previousElementSibling;
    const desktopSearchInput = document.getElementById('desktop-search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobileSearchToggle = document.getElementById('mobile-search-toggle');
    const mobileSearchClose = document.getElementById('mobile-search-close');
    const mobileSearchBar = document.getElementById('mobile-search-bar');
    const openFilterBtn = document.getElementById('open-filter-btn');
    const closeFilterBtn = document.getElementById('close-filter-btn');
    const filterDrawer = document.getElementById('filter-drawer');
    const filterBackdrop = document.getElementById('filter-drawer-backdrop');
    const drawerBrandList = document.getElementById('drawer-brand-list');
    const drawerScaleBtns = document.querySelectorAll('.filter-scale-btn');
    const drawerSortSelect = document.getElementById('drawer-sort-select');
    const drawerResetBtn = document.getElementById('drawer-reset-btn');
    const drawerApplyBtn = document.getElementById('drawer-apply-btn');

    // Setup Mobile Search Toggle
    if (mobileSearchToggle && mobileSearchBar) {
      mobileSearchToggle.addEventListener('click', () => {
        mobileSearchBar.classList.toggle('open');
        if (mobileSearchBar.classList.contains('open') && mobileSearchInput) {
          mobileSearchInput.focus();
        }
      });
    }
    if (mobileSearchClose && mobileSearchBar) {
      mobileSearchClose.addEventListener('click', () => {
        mobileSearchBar.classList.remove('open');
      });
    }

    // Setup Filter Drawer Open/Close
    function openDrawer() {
      if (filterDrawer) filterDrawer.classList.add('open');
      if (filterBackdrop) filterBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
      if (filterDrawer) filterDrawer.classList.remove('open');
      if (filterBackdrop) filterBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (openFilterBtn) openFilterBtn.addEventListener('click', openDrawer);
    if (closeFilterBtn) closeFilterBtn.addEventListener('click', closeDrawer);
    if (filterBackdrop) filterBackdrop.addEventListener('click', closeDrawer);

    // Populate Drawer Brands
    if (drawerBrandList) {
      const topBrands = ['All', 'Ferrari', 'Lamborghini', 'Porsche', 'Mercedes-AMG', 'McLaren', 'BMW', 'Defender', 'Batman', 'Nissan'];
      Object.keys(brandCounts).forEach(b => {
        if (!topBrands.includes(b)) topBrands.push(b);
      });

      drawerBrandList.innerHTML = topBrands.map(b => {
        const count = b === 'All' ? cardData.length : (brandCounts[b] || 0);
        if (count === 0 && b !== 'All') return '';
        const bKey = b.toLowerCase();
        return `<button type="button" class="filter-brand-btn px-3 py-1.5 text-xs font-semibold border border-black/15 rounded-md transition-all ${bKey === currentBrand ? 'active-brand' : ''}" data-brand="${bKey}">
          ${b} (${count})
        </button>`;
      }).join('');

      drawerBrandList.addEventListener('click', e => {
        const btn = e.target.closest('.filter-brand-btn');
        if (!btn) return;
        currentBrand = btn.getAttribute('data-brand');
        drawerBrandList.querySelectorAll('.filter-brand-btn').forEach(b => {
          b.classList.toggle('active-brand', b.getAttribute('data-brand') === currentBrand);
        });
        applyAllFilters(true);
      });
    }

    // Drawer Scale Selection
    drawerScaleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentScale = btn.getAttribute('data-scale');
        drawerScaleBtns.forEach(b => b.classList.toggle('active-scale', b.getAttribute('data-scale') === currentScale));
        applyAllFilters(true);
      });
    });

    // Drawer Sort Selection
    if (drawerSortSelect) {
      drawerSortSelect.addEventListener('change', () => {
        currentSort = drawerSortSelect.value;
        applyAllFilters(true);
      });
    }

    // Drawer Buttons
    if (drawerResetBtn) {
      drawerResetBtn.addEventListener('click', () => {
        resetAllFilters();
        closeDrawer();
      });
    }
    if (drawerApplyBtn) {
      drawerApplyBtn.addEventListener('click', () => {
        closeDrawer();
      });
    }

    // Build Top Brand Pills Bar
    let filterPillsBar = document.getElementById('brand-pills-bar');
    if (!filterPillsBar && countContainer) {
      filterPillsBar = document.createElement('div');
      filterPillsBar.id = 'brand-pills-bar';
      filterPillsBar.className = 'filter-pills-bar mb-6';

      const topBrands = ['All', 'Ferrari', 'Lamborghini', 'Porsche', 'Mercedes-AMG', 'McLaren', 'BMW', 'Defender', 'Batman', 'Nissan'];
      Object.keys(brandCounts).forEach(b => {
        if (!topBrands.includes(b)) topBrands.push(b);
      });

      filterPillsBar.innerHTML = topBrands.map(b => {
        const count = b === 'All' ? cardData.length : (brandCounts[b] || 0);
        if (count === 0 && b !== 'All') return '';
        const bKey = b.toLowerCase();
        return `<button type="button" class="filter-pill ${bKey === currentBrand ? 'active' : ''}" data-brand="${bKey}">
          ${b} <span style="font-size:11px;opacity:0.65;font-weight:normal;">(${count})</span>
        </button>`;
      }).join('');

      countContainer.parentNode.insertBefore(filterPillsBar, countContainer);

      filterPillsBar.addEventListener('click', e => {
        const btn = e.target.closest('.filter-pill');
        if (!btn) return;
        currentBrand = btn.getAttribute('data-brand') || 'all';
        applyAllFilters(true);
      });
    }

    // Real-time Search Input Listeners
    function handleSearchInput(e) {
      currentSearch = (e.target.value || '').toLowerCase().trim();
      if (desktopSearchInput && desktopSearchInput !== e.target) desktopSearchInput.value = e.target.value;
      if (mobileSearchInput && mobileSearchInput !== e.target) mobileSearchInput.value = e.target.value;
      applyAllFilters(true);
    }

    if (desktopSearchInput) desktopSearchInput.addEventListener('input', handleSearchInput);
    if (mobileSearchInput) mobileSearchInput.addEventListener('input', handleSearchInput);

    // Apply All Filters
    function applyAllFilters(updateUrl = true) {
      let visibleCount = 0;

      // Filter
      cardData.forEach(item => {
        let matchBrand = currentBrand === 'all' || item.brand.includes(currentBrand) || item.title.includes(currentBrand);
        let matchScale = currentScale === 'all' || item.scale === currentScale;
        let matchSearch = !currentSearch || item.title.includes(currentSearch) || item.brand.includes(currentSearch);

        if (matchBrand && matchScale && matchSearch) {
          item.element.style.display = '';
          visibleCount++;
        } else {
          item.element.style.display = 'none';
        }
      });

      // Sort visible cards
      if (currentSort !== 'featured') {
        const sorted = [...cardData].sort((a, b) => {
          if (currentSort === 'price-asc') return a.price - b.price;
          if (currentSort === 'price-desc') return b.price - a.price;
          if (currentSort === 'name-asc') return a.title.localeCompare(b.title);
          return a.originalIndex - b.originalIndex;
        });
        sorted.forEach(item => grid.appendChild(item.element));
      }

      // Update pills
      if (filterPillsBar) {
        filterPillsBar.querySelectorAll('.filter-pill').forEach(pill => {
          const pillBrand = pill.getAttribute('data-brand');
          pill.classList.toggle('active', pillBrand === currentBrand || (currentBrand === 'all' && pillBrand === 'all'));
        });
      }

      // Update drawer brand buttons
      if (drawerBrandList) {
        drawerBrandList.querySelectorAll('.filter-brand-btn').forEach(btn => {
          btn.classList.toggle('active-brand', btn.getAttribute('data-brand') === currentBrand);
        });
      }

      // Update Count Display
      if (countContainer) {
        let activeTags = [];
        if (currentBrand !== 'all') activeTags.push(currentBrand.toUpperCase());
        if (currentScale !== 'all') activeTags.push(currentScale);
        if (currentSearch) activeTags.push(`"${currentSearch}"`);

        countContainer.innerHTML = `
          <div class="flex items-center justify-between flex-wrap gap-3">
            <p class="text-sm text-black/60">
              Showing <span class="font-bold text-black">${visibleCount}</span> of ${cardData.length} models
              ${activeTags.length ? `<span class="text-xs text-black/40 ml-1">(${activeTags.join(', ')})</span>` : ''}
            </p>
            ${(currentBrand !== 'all' || currentScale !== 'all' || currentSearch) ? `
              <button id="reset-filter-btn" class="text-xs font-bold text-[var(--brand-orange)] hover:underline flex items-center gap-1 cursor-pointer">
                ✕ Clear all filters
              </button>
            ` : ''}
          </div>
        `;

        const resetBtn = document.getElementById('reset-filter-btn');
        if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
      }

      // URL Sync
      if (updateUrl) {
        const url = new URL(window.location);
        if (currentBrand && currentBrand !== 'all') url.searchParams.set('brand', currentBrand);
        else url.searchParams.delete('brand');

        if (currentSearch) url.searchParams.set('search', currentSearch);
        else url.searchParams.delete('search');

        window.history.replaceState({}, '', url.toString());
      }
    }

    function resetAllFilters() {
      currentBrand = 'all';
      currentScale = 'all';
      currentSearch = '';
      currentSort = 'featured';
      if (desktopSearchInput) desktopSearchInput.value = '';
      if (mobileSearchInput) mobileSearchInput.value = '';
      if (drawerSortSelect) drawerSortSelect.value = 'featured';
      drawerScaleBtns.forEach(b => b.classList.toggle('active-scale', b.getAttribute('data-scale') === 'all'));
      applyAllFilters(true);
    }

    // Initial load from URL params
    const initialParams = new URLSearchParams(window.location.search);
    const initialBrand = initialParams.get('brand');
    const initialSearch = initialParams.get('search');
    if (initialBrand) currentBrand = initialBrand.toLowerCase();
    if (initialSearch) {
      currentSearch = initialSearch.toLowerCase();
      if (desktopSearchInput) desktopSearchInput.value = initialSearch;
      if (mobileSearchInput) mobileSearchInput.value = initialSearch;
    }
    applyAllFilters(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCollections);
  } else {
    initCollections();
  }
})();

