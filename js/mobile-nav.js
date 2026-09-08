/**
 * 3D Gear Wall - Universal Mobile Navigation Drawer
 * High-performance, luxury monochrome slide-out navigation.
 * Automatically attaches to all mobile hamburger buttons on the page.
 */

(function () {
  'use strict';

  // Prevent double initialization
  if (window.__gwMobileNavInitialized) return;
  window.__gwMobileNavInitialized = true;

  // Insert Styles for Mobile Navigation Drawer
  function injectStyles() {
    if (document.getElementById('gw-mobile-nav-styles')) return;
    const style = document.createElement('style');
    style.id = 'gw-mobile-nav-styles';
    style.textContent = `
      #gw-mobile-nav-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 99998;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      #gw-mobile-nav-backdrop.gw-open {
        opacity: 1;
        pointer-events: auto;
      }

      #gw-mobile-nav-drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 85vw;
        max-width: 360px;
        background: #0d0d11;
        color: #ffffff;
        border-left: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: -15px 0 50px rgba(0, 0, 0, 0.7);
        z-index: 99999;
        transform: translateX(100%);
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #gw-mobile-nav-drawer.gw-open {
        transform: translateX(0);
      }

      .gw-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(13, 13, 17, 0.95);
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .gw-drawer-close-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .gw-drawer-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }
      .gw-drawer-close-btn:active {
        transform: scale(0.95);
      }

      .gw-drawer-body {
        padding: 20px 20px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
      }

      .gw-nav-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        color: rgba(255, 255, 255, 0.75);
        text-decoration: none;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 0.01em;
        border-radius: 8px;
        background: transparent;
        transition: all 0.2s ease;
      }
      .gw-nav-link:hover, .gw-nav-link:active {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.08);
        padding-left: 22px;
      }
      .gw-nav-link.active {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.12);
        font-weight: 700;
      }

      .gw-nav-badge {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 3px 8px;
        background: #ffffff;
        color: #0d0d11;
        border-radius: 999px;
      }

      .gw-nav-arrow {
        opacity: 0.4;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .gw-nav-link:hover .gw-nav-arrow {
        opacity: 1;
        transform: translateX(4px);
      }

      .gw-drawer-footer {
        padding: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: rgba(13, 13, 17, 0.95);
      }

      .gw-crate-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 14px;
        background: #ffffff;
        color: #000000;
        font-size: 15px;
        font-weight: 700;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
      }
      .gw-crate-btn:hover {
        background: #e8e8ea;
      }
      .gw-crate-btn:active {
        transform: scale(0.98);
      }

      .gw-crate-count-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border-radius: 999px;
        background: #000000;
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
      }

      .gw-drawer-subtext {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        text-align: center;
        line-height: 1.5;
        margin: 4px 0 0 0;
      }
    `;
    document.head.appendChild(style);
  }

  // Get total items in cart from localStorage
  function getCartItemCount() {
    try {
      const saved = localStorage.getItem('3dgearwall_cart_v2') || localStorage.getItem('3dgearwall_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
        }
      }
      const nextSaved = localStorage.getItem('wheels-frames-cart');
      if (nextSaved) {
        const parsedNext = JSON.parse(nextSaved);
        const nextItems = parsedNext?.state?.items || (Array.isArray(parsedNext) ? parsedNext : null);
        if (Array.isArray(nextItems) && nextItems.length > 0) {
          return nextItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
        }
      }
    } catch (e) {}
    return 0;
  }

  // Build the Drawer DOM
  function createDrawer() {
    if (document.getElementById('gw-mobile-nav-drawer')) return;

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'gw-mobile-nav-backdrop';
    backdrop.addEventListener('click', closeMobileNav);
    document.body.appendChild(backdrop);

    // Drawer Container
    const drawer = document.createElement('div');
    drawer.id = 'gw-mobile-nav-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Mobile Navigation');

    const currentPath = window.location.pathname.toLowerCase();
    const isHome = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');
    const isCollections = currentPath.includes('collection');
    const isCustom = currentPath.includes('custom');
    const isContact = currentPath.includes('contact');
    const isTrack = currentPath.includes('track');
    const isAbout = currentPath.includes('about');

    const cartCount = getCartItemCount();

    drawer.innerHTML = `
      <div class="gw-drawer-header">
        <a href="/index.html" class="flex items-center" aria-label="3D Gear Wall">
          <img src="/images/logo-footer.png?v=5" alt="3D Gear Wall" style="height: 34px; width: auto; object-fit: contain;" />
        </a>
        <button id="gw-mobile-nav-close" class="gw-drawer-close-btn" aria-label="Close menu">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="gw-drawer-body">
        <a href="/index.html" class="gw-nav-link ${isHome ? 'active' : ''}">
          <span>Home</span>
          <svg class="gw-nav-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>

        <a href="/collections.html" class="gw-nav-link ${isCollections ? 'active' : ''}">
          <div style="display: flex; flex-direction: column;">
            <span>Collections</span>
            <span style="font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500;">36+ Rare 3D Car Frames</span>
          </div>
          <svg class="gw-nav-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>

        <a href="/customize.html" class="gw-nav-link ${isCustom ? 'active' : ''}">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>Custom Studio</span>
            <span class="gw-nav-badge">NEW</span>
          </div>
          <svg class="gw-nav-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>

        <a href="/track.html" class="gw-nav-link ${isTrack ? 'active' : ''}">
          <span>Track Order</span>
          <svg class="gw-nav-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>

        <a href="/contact.html" class="gw-nav-link ${isContact ? 'active' : ''}">
          <span>Contact Us</span>
          <svg class="gw-nav-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>

        <a href="/about.html" class="gw-nav-link ${isAbout ? 'active' : ''}">
          <span>About Us</span>
          <svg class="gw-nav-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>

      <div class="gw-drawer-footer">
        <button id="gw-mobile-crate-btn" class="gw-crate-btn">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          <span>View Crate</span>
          <span id="gw-mobile-crate-count" class="gw-crate-count-pill">${cartCount}</span>
        </button>

        
        <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin: 12px 0 6px 0;">
          <a href="https://www.instagram.com/3dcarframe/" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 9999px; color: #fff; font-size: 12px; font-weight: 600; text-decoration: none; transition: all 0.2s ease;">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
            <span>Instagram @3dcarframe</span>
          </a>
        </div>
        <p class="gw-drawer-subtext">Free Shipping across India • Authentic 3D Collectibles</p>
      </div>
    `;

    document.body.appendChild(drawer);

    // Bind Close Button
    const closeBtn = drawer.querySelector('#gw-mobile-nav-close');
    if (closeBtn) closeBtn.addEventListener('click', closeMobileNav);

    // Bind Crate Button
    const crateBtn = drawer.querySelector('#gw-mobile-crate-btn');
    if (crateBtn) {
      crateBtn.addEventListener('click', function () {
        closeMobileNav();
        if (typeof window.openCartDrawer === 'function') {
          window.openCartDrawer();
        } else {
          window.location.href = 'collections.html';
        }
      });
    }

    // Bind Links to close drawer on navigation
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMobileNav);
    });
  }

  // Open Drawer
  function openMobileNav() {
    createDrawer();
    const backdrop = document.getElementById('gw-mobile-nav-backdrop');
    const drawer = document.getElementById('gw-mobile-nav-drawer');
    const crateCount = document.getElementById('gw-mobile-crate-count');

    if (crateCount) {
      crateCount.textContent = getCartItemCount();
    }

    if (backdrop && drawer) {
      backdrop.classList.add('gw-open');
      drawer.classList.add('gw-open');
      document.body.style.overflow = 'hidden';
    }
  }

  // Close Drawer
  function closeMobileNav() {
    const backdrop = document.getElementById('gw-mobile-nav-backdrop');
    const drawer = document.getElementById('gw-mobile-nav-drawer');
    if (backdrop && drawer) {
      backdrop.classList.remove('gw-open');
      drawer.classList.remove('gw-open');
      document.body.style.overflow = '';
    }
  }

  // Toggle Drawer
  function toggleMobileNav() {
    const drawer = document.getElementById('gw-mobile-nav-drawer');
    if (drawer && drawer.classList.contains('gw-open')) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  }

  // Escape key closes drawer
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMobileNav();
    }
  });

  // Global Event Delegation for ALL Mobile Hamburger Buttons
  document.addEventListener('click', function (e) {
    // Check if clicked element is or is inside a hamburger menu button
    const btn = e.target.closest(
      '#mobile-menu-btn, button.md\\:hidden, [data-mobile-menu-toggle], button[aria-label="menu" i], button[aria-label="Toggle menu" i]'
    );

    // If it's the drawer's internal close or crate button, let their listeners handle it
    if (!btn || btn.closest('#gw-mobile-nav-drawer')) return;

    // Check if it's not a cart button or search button
    const isCartBtn = btn.querySelector('path[d*="M3 3h2"]') || btn.textContent.toLowerCase().includes('crate');
    const isSearchBtn = btn.querySelector('path[d*="M21 21l-6-6"]');
    if (isCartBtn || isSearchBtn) return;

    e.preventDefault();
    e.stopPropagation();
    toggleMobileNav();
  }, true);

  // Expose global methods
  window.openMobileNav = openMobileNav;
  window.closeMobileNav = closeMobileNav;
  window.toggleMobileNav = toggleMobileNav;

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStyles();
      createDrawer();
    });
  } else {
    injectStyles();
    createDrawer();
  }

})();
