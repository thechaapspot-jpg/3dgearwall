/**
 * 3D Gear Wall - Product Detail Page Interactive Engine
 * Handles:
 * - High-res photo preview gallery with smooth transitions & active highlights
 * - Mobile horizontal scrolling for thumbnail strip
 * - Filter out missing or broken thumbnail previews
 * - Synchronized Quantity Steppers (desktop & mobile sticky bar)
 * - "Add to Crate" & "Buy Now" one-click checkout integration
 * - Header Search & Mobile Nav triggers
 * - Cleanup of empty skeleton placeholder gaps
 */

(function () {
  'use strict';

  let currentQty = 1;

  function initProductPage() {
    setupHeaderSearch();
    setupGallery();
    setupQuantitySteppers();
    setupCartButtons();
    cleanupBlankGaps();
  }

  // 1. Header Search Setup
  function setupHeaderSearch() {
    const desktopSearch = document.getElementById('desktop-search-input');
    const mobileSearch = document.getElementById('mobile-search-input');
    const mobileToggle = document.getElementById('mobile-search-toggle');
    const mobileClose = document.getElementById('mobile-search-close');
    const mobileBar = document.getElementById('mobile-search-bar');

    function performSearch(query) {
      const q = (query || '').trim();
      if (q) {
        window.location.href = '/collections.html?search=' + encodeURIComponent(q);
      }
    }

    if (desktopSearch) {
      desktopSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch(desktopSearch.value);
      });
    }

    if (mobileSearch) {
      mobileSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch(mobileSearch.value);
      });
    }

    if (mobileToggle && mobileBar) {
      mobileToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = mobileBar.style.transform === 'translateY(0px)' || mobileBar.classList.contains('open');
        if (isOpen) {
          mobileBar.style.transform = 'translateY(-100%)';
          mobileBar.style.opacity = '0';
          mobileBar.style.pointerEvents = 'none';
          mobileBar.classList.remove('open');
        } else {
          mobileBar.style.transform = 'translateY(0px)';
          mobileBar.style.opacity = '1';
          mobileBar.style.pointerEvents = 'auto';
          mobileBar.classList.add('open');
          if (mobileSearch) setTimeout(() => mobileSearch.focus(), 100);
        }
      });
    }

    if (mobileClose && mobileBar) {
      mobileClose.addEventListener('click', (e) => {
        e.preventDefault();
        mobileBar.style.transform = 'translateY(-100%)';
        mobileBar.style.opacity = '0';
        mobileBar.style.pointerEvents = 'none';
        mobileBar.classList.remove('open');
      });
    }
  }

  // 2. Photo Gallery Preview & Thumbnail Selection
  function setupGallery() {
    // Select the main hero image
    const mainImg = document.querySelector('main .aspect-\\[4\\/3\\] img, main .aspect-square img, main [class*="aspect-"] img');
    
    // Find all thumbnail container rows
    const thumbContainers = document.querySelectorAll('main .flex.gap-3, main [class*="gap-3"]');
    let thumbContainer = null;
    for (const c of thumbContainers) {
      if (c.querySelector('button img')) {
        thumbContainer = c;
        break;
      }
    }

    if (!thumbContainer) return;

    // Enable smooth horizontal touch scrolling on mobile
    thumbContainer.classList.add('overflow-x-auto', 'pb-2');
    thumbContainer.style.overflowX = 'auto';
    thumbContainer.style.webkitOverflowScrolling = 'touch';
    thumbContainer.style.scrollbarWidth = 'none';
    thumbContainer.style.msOverflowStyle = 'none';

    const thumbButtons = thumbContainer.querySelectorAll('button');

    thumbButtons.forEach((btn, idx) => {
      const img = btn.querySelector('img');
      if (!img) return;

      // Filter out any broken or missing image thumbnail dynamically
      img.addEventListener('error', () => {
        console.warn('[Gallery] Removed broken thumbnail:', img.src);
        btn.remove();
      });

      // Also check if image has already errored
      if (img.complete && img.naturalWidth === 0) {
        btn.remove();
        return;
      }

      btn.style.cursor = 'pointer';
      btn.style.flexShrink = '0';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!mainImg) return;

        const newSrc = img.src || img.getAttribute('src');
        if (!newSrc) return;

        // Smooth image switch with subtle crossfade
        mainImg.style.transition = 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        mainImg.style.opacity = '0.3';

        setTimeout(() => {
          mainImg.src = newSrc;
          if (mainImg.srcset) mainImg.srcset = newSrc;
          mainImg.style.opacity = '1';
        }, 120);

        // Update active thumbnail border
        thumbButtons.forEach(b => {
          b.classList.remove('border-black');
          b.classList.add('border-transparent');
          b.style.borderColor = 'transparent';
        });

        btn.classList.remove('border-transparent');
        btn.classList.add('border-black');
        btn.style.borderColor = '#000000';
      });
    });
  }

  // 3. Synchronized Quantity Stepper System
  // Out-of-stock is determined dynamically by supabase-sync.js badges in the DOM
  function isCurrentProductOutOfStock() {
    const heroSection = document.querySelector('main .space-y-6') || document.querySelector('main');
    if (heroSection && heroSection.querySelector('#live-soldout-badge, .gw-stock-badge, .out-of-stock-badge')) {
      return true;
    }
    return false;
  }

  function setupQuantitySteppers() {
    if (isCurrentProductOutOfStock()) {
      // Keep steppers disabled for Out of Stock
      document.querySelectorAll('button[data-qty-action], .gw-qty-val').forEach(el => {
        if (el.tagName === 'BUTTON') {
          el.setAttribute('disabled', 'true');
          el.style.opacity = '0.4';
          el.style.cursor = 'not-allowed';
          el.style.pointerEvents = 'none';
        }
      });
      return;
    }

    const displays = document.querySelectorAll('.gw-qty-val, [data-qty-display]');

    function updateDisplays() {
      displays.forEach(d => {
        d.textContent = currentQty;
      });
    }

    // Bind all Minus and Plus buttons in the page
    document.querySelectorAll('button').forEach(btn => {
      const txt = (btn.textContent || '').trim();
      if (txt === '−' || txt === '-' || btn.getAttribute('data-qty-action') === 'minus') {
        btn.removeAttribute('disabled');
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (currentQty > 1) {
            currentQty--;
            updateDisplays();
          }
        });
      } else if (txt === '+' || btn.getAttribute('data-qty-action') === 'plus') {
        btn.removeAttribute('disabled');
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (currentQty < 10) {
            currentQty++;
            updateDisplays();
          }
        });
      }
    });

    updateDisplays();
  }

  // 4. "Add to Crate" and "Buy Now" Action Integration
  function getCurrentProductInfo() {
    const titleEl = document.querySelector('h1');
    const name = titleEl ? titleEl.textContent.trim() : document.title.split('|')[0].trim();

    // Price: find price that is NOT inside .line-through
    let price = 599;
    const priceCandidates = Array.from(document.querySelectorAll('main .text-3xl, main .text-4xl, main [class*="text-3xl"], main .font-black'));
    for (const el of priceCandidates) {
      if (el.closest('.line-through') || el.classList.contains('line-through')) continue;
      const match = el.textContent.match(/₹\s*([0-9,]+)/);
      if (match) {
        price = Number(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Original Price
    const origPriceEl = document.querySelector('main .line-through');
    let originalPrice = null;
    if (origPriceEl) {
      const match = origPriceEl.textContent.match(/₹\s*([0-9,]+)/);
      if (match) originalPrice = Number(match[1].replace(/,/g, ''));
    }

    // Scale
    const scaleEl = document.querySelector('main .inline-block.bg-black.text-white, main [class*="bg-black"][class*="text-white"]');
    let scale = '1:36';
    if (scaleEl) {
      const match = scaleEl.textContent.match(/1:(18|24|36|43|64)/);
      if (match) scale = match[0];
    }

    // Main Image
    const mainImg = document.querySelector('main .aspect-\\[4\\/3\\] img, main .aspect-square img, main [class*="aspect-"] img');
    const image = mainImg ? (mainImg.src || mainImg.getAttribute('src')) : '/images/products/twoofvu6src3z5foyd8h.jpg';

    // Product ID from URL
    const idMatch = window.location.pathname.match(/product\/(\d+)/);
    const productId = idMatch ? idMatch[1] : ('GW-' + name.substring(0, 10));

    return { id: productId, name, price, originalPrice, scale, image };
  }

  function setupCartButtons() {
    // Handle Add To Crate
    function handleAddToCartAction(e) {
      if (e) {
        e.__cartHandled = true;
        e.preventDefault();
        e.stopPropagation();
      }

      const info = getCurrentProductInfo();
      if (typeof window.addToCart === 'function') {
        window.addToCart({
          id: info.id,
          name: info.name,
          price: info.price,
          originalPrice: info.originalPrice,
          scale: info.scale,
          image: info.image,
          quantity: currentQty
        });
      }
    }

    // Handle Buy Now Action
    function handleBuyNowAction(e) {
      if (e) {
        e.__cartHandled = true;
        e.preventDefault();
        e.stopPropagation();
      }

      const info = getCurrentProductInfo();
      if (typeof window.addToCart === 'function') {
        window.addToCart({
          id: info.id,
          name: info.name,
          price: info.price,
          originalPrice: info.originalPrice,
          scale: info.scale,
          image: info.image,
          quantity: currentQty
        }, { silent: true });
      }

      setTimeout(() => {
        if (typeof window.closeCartDrawer === 'function') window.closeCartDrawer();
        if (typeof window.openCheckoutModal === 'function') window.openCheckoutModal();
      }, 100);
    }

    // If product is out of stock, enforce disabled state on action buttons
    if (isCurrentProductOutOfStock()) {
      document.querySelectorAll('button').forEach(btn => {
        if (btn.closest('#gw-cart-drawer') || btn.closest('#gw-checkout-modal-root') || btn.closest('#gw-toast-container')) return;
        const text = (btn.textContent || '').trim().toLowerCase();
        if (text.includes('add to') || text.includes('buy now') || text.includes('out of stock')) {
          btn.setAttribute('disabled', 'true');
          btn.style.cursor = 'not-allowed';
          btn.style.pointerEvents = 'none';
          btn.style.opacity = '0.5';
        }
      });
      return;
    }

    // Find all "Add to Cart" / "Add to Crate" & "Buy Now" buttons in page
    document.querySelectorAll('button').forEach(btn => {
      if (btn.closest('#gw-cart-drawer') || btn.closest('#gw-checkout-modal-root') || btn.closest('#gw-toast-container')) return;

      const text = (btn.textContent || '').trim().toLowerCase();

      if (text.includes('add to cart') || text.includes('add to crate')) {
        btn.removeAttribute('disabled');
        btn.style.cursor = 'pointer';
        btn.setAttribute('data-cart-handled', 'true');

        // Update button text to "Add to Crate"
        const span = btn.querySelector('span');
        if (span && span.textContent.toLowerCase().includes('cart')) {
          span.textContent = 'Add to Crate';
        } else if (!span && btn.textContent.toLowerCase().includes('cart')) {
          btn.innerHTML = btn.innerHTML.replace(/add to cart/gi, 'Add to Crate');
        }

        btn.addEventListener('click', handleAddToCartAction);
      } else if (text === 'buy now' || text.includes('buy now')) {
        btn.removeAttribute('disabled');
        btn.style.cursor = 'pointer';
        btn.setAttribute('data-cart-handled', 'true');
        btn.addEventListener('click', handleBuyNowAction);
      }
    });
  }

  // 5. Cleanup Empty Skeleton Pulse Gaps
  function cleanupBlankGaps() {
    document.querySelectorAll('.animate-pulse').forEach(el => {
      const parent = el.closest('.py-8, .space-y-4, .py-12');
      if (parent) {
        parent.remove();
      } else {
        el.remove();
      }
    });
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductPage);
  } else {
    initProductPage();
  }

  // Re-check OOS status after supabase-sync.js has hydrated the page
  // supabase-sync.js loads after product-detail.js and injects sold-out badges
  function recheckOOSStatus() {
    if (isCurrentProductOutOfStock()) {
      // Disable all action buttons
      document.querySelectorAll('button').forEach(btn => {
        if (btn.closest('#gw-cart-drawer') || btn.closest('#gw-checkout-modal-root') || btn.closest('#gw-toast-container')) return;
        const text = (btn.textContent || '').trim().toLowerCase();
        if (text.includes('add to') || text.includes('buy now') || text.includes('out of stock')) {
          btn.setAttribute('disabled', 'true');
          btn.style.cursor = 'not-allowed';
          btn.style.pointerEvents = 'none';
          btn.style.opacity = '0.5';
        }
      });
      // Disable qty steppers
      document.querySelectorAll('button[data-qty-action], .gw-qty-val').forEach(el => {
        if (el.tagName === 'BUTTON') {
          el.setAttribute('disabled', 'true');
          el.style.opacity = '0.4';
          el.style.cursor = 'not-allowed';
          el.style.pointerEvents = 'none';
        }
      });
    }
  }

  // Delayed re-check to allow supabase-sync.js to run
  setTimeout(recheckOOSStatus, 1500);
  setTimeout(recheckOOSStatus, 4000);

  // Also watch for badge injection via MutationObserver
  const mainSection = document.querySelector('main');
  if (mainSection) {
    const observer = new MutationObserver(() => {
      recheckOOSStatus();
    });
    observer.observe(mainSection, { childList: true, subtree: true });
    // Stop observing after 10 seconds to avoid unnecessary overhead
    setTimeout(() => observer.disconnect(), 10000);
  }
})();
