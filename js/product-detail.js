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

  // 3. Quantity Steppers (Synchronized across Desktop & Mobile Sticky Bar)
  function setupQuantitySteppers() {
    function updateDisplays() {
      // Find all quantity number spans
      document.querySelectorAll('.gw-qty-val, main .flex.items-center.gap-2 span.font-bold, .fixed.bottom-0 span.font-bold').forEach(el => {
        el.textContent = currentQty;
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
  function setupCartButtons() {
    // Extract product details from page
    const titleEl = document.querySelector('h1');
    const name = titleEl ? titleEl.textContent.trim() : document.title.split('|')[0].trim();

    // Price
    const priceEl = document.querySelector('main .text-3xl, main .text-4xl, main [class*="text-3xl"]');
    let price = 599;
    if (priceEl) {
      const match = priceEl.textContent.match(/₹\s*([0-9,]+)/);
      if (match) price = Number(match[1].replace(/,/g, ''));
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

    // Handle Add To Crate
    function handleAddToCartAction(e) {
      if (e) {
        e.__cartHandled = true;
        e.preventDefault();
        e.stopPropagation();
      }

      if (typeof window.addToCart === 'function') {
        window.addToCart({
          id: productId,
          name: name,
          price: price,
          originalPrice: originalPrice,
          scale: scale,
          image: mainImg ? mainImg.src : image,
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

      if (typeof window.addToCart === 'function') {
        window.addToCart({
          id: productId,
          name: name,
          price: price,
          originalPrice: originalPrice,
          scale: scale,
          image: mainImg ? mainImg.src : image,
          quantity: currentQty
        }, { silent: true });
      }

      setTimeout(() => {
        if (typeof window.closeCartDrawer === 'function') window.closeCartDrawer();
        if (typeof window.openCheckoutModal === 'function') window.openCheckoutModal();
      }, 100);
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
})();
