/**
 * 3D Gear Wall - Cart & Checkout System (v3)
 * Clean boxy monochrome design. Two-step checkout with Razorpay integration.
 * Features:
 * - Persistent multi-tab state via localStorage (3dgearwall_cart_v2)
 * - Clean empty state with quick-add recommendations
 * - Rich populated cart items with custom options
 * - Anti-duplicate / debounce protection
 * - Two-step checkout: Details → Payment (Razorpay / COD unavailable)
 * - Order success celebration modal
 * - Monochrome floating toast notifications
 */

(function () {
  'use strict';

  if (window.__3DGEARWALL_CART_INITIALIZED__) {
    return;
  }
  window.__3DGEARWALL_CART_INITIALIZED__ = true;

  const STORAGE_KEY = '3dgearwall_cart_v2';
  const LEGACY_STORAGE_KEY = '3dgearwall_cart';
  const RAZORPAY_KEY = 'rzp_live_TZY82TryPMFHto';

  // Dynamic storage loader & syncer
  function getCart() {
    let items = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) items = parsed;
      }
    } catch (e) { items = []; }

    return items;
  }

  // State
  let cart = getCart();

  let lastAddSignature = '';
  let lastAddTime = 0;

  // Checkout state for two-step flow
  let checkoutStep = 1;
  let checkoutData = {};

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(cart));
      // Also synchronize with Next.js cart store
      const nextCartState = {
        state: {
          items: cart.map(it => ({
            id: it.id,
            name: it.name,
            brand: it.brand || '',
            price: it.price,
            originalPrice: it.originalPrice,
            scale: it.scale || '1:36',
            image: it.image,
            quantity: it.quantity,
            type: it.customDetails ? 'custom-poster' : 'product'
          })),
          isDrawerOpen: false
        },
        version: 0
      };
      localStorage.setItem('wheels-frames-cart', JSON.stringify(nextCartState));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
    updateCartUI();
    window.dispatchEvent(new CustomEvent('gearwall:cart-updated', { detail: { cart } }));
  }

  // Cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === LEGACY_STORAGE_KEY || e.key === 'wheels-frames-cart') {
      try {
        cart = getCart();
        updateCartUI();
      } catch (err) { /* ignore */ }
    }
  });

  // Helpers
  function formatINR(num) {
    return '₹' + Number(num || 0).toLocaleString('en-IN');
  }

  function getTotalItems() {
    return cart.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
  }

  function getSubtotal() {
    return cart.reduce((acc, item) => acc + (Number(item.price || 0) * (Number(item.quantity) || 1)), 0);
  }

  // ─── Toast Notification (Monochrome) ───
  function showToast(title, subtitle = '', image = '') {
    let container = document.getElementById('gw-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gw-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'gw-toast-card';
    toast.innerHTML = `
      ${image ? `<img src="${image}" alt="${title}" style="width:40px;height:40px;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,0.1);">` : `<span style="font-size:18px;line-height:1;flex-shrink:0;">✓</span>`}
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;font-weight:700;color:#fff;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
        ${subtitle ? `<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${subtitle}</div>` : ''}
      </div>
      <button onclick="window.openCartDrawer && window.openCartDrawer(); this.closest('.gw-toast-card').remove();" style="padding:5px 10px;background:#fff;border:none;color:#000;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;text-transform:uppercase;letter-spacing:0.04em;">
        View Crate
      </button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }

  // ─── Inject Drawer, Checkout Modal & Success Modal ───
  function injectCartDrawer() {
    if (document.getElementById('gw-cart-drawer-root')) return;

    const root = document.createElement('div');
    root.id = 'gw-cart-drawer-root';
    root.innerHTML = `
      <!-- Backdrop -->
      <div id="gw-cart-backdrop" onclick="window.closeCartDrawer && window.closeCartDrawer()"></div>

      <!-- Drawer Panel -->
      <aside id="gw-cart-drawer" aria-label="Shopping Crate">
        
        <!-- Drawer Header -->
        <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:800;letter-spacing:0.02em;color:#fff;text-transform:uppercase;">Your Crate</h3>
            <p style="margin:2px 0 0;font-size:10px;color:rgba(255,255,255,0.35);font-weight:500;letter-spacing:0.06em;text-transform:uppercase;">3D Gear Wall</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button id="gw-clear-cart-btn" style="background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;cursor:pointer;padding:4px 10px;text-transform:uppercase;letter-spacing:0.04em;transition:all 0.2s;" title="Clear all">Clear</button>
            <button id="gw-close-cart-btn" style="background:#fff;border:none;color:#000;cursor:pointer;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1;font-weight:700;" aria-label="Close Crate">✕</button>
          </div>
        </div>

        <!-- Free Shipping Bar -->
        <div id="gw-free-shipping-bar" style="padding:8px 20px;background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:8px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.6);">
          <span style="font-size:13px;line-height:1;">📦</span>
          <span><strong style="color:#fff;">FREE Delivery</strong> across India</span>
        </div>

        <!-- Cart Items / Empty Container -->
        <div id="gw-cart-items-container" style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain;">
          <!-- Dynamically rendered -->
        </div>

        <!-- Drawer Footer -->
        <div id="gw-cart-footer" style="padding:16px 20px;border-top:1px solid rgba(255,255,255,0.08);background:#09090c;display:flex;flex-direction:column;gap:10px;">
          
          <!-- Pricing Summary -->
          <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,0.5);">
              <span>Subtotal</span>
              <span id="gw-cart-subtotal" style="color:#fff;font-weight:700;">₹0</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,0.5);">
              <span>Delivery</span>
              <span style="color:#22c55e;font-weight:700;">FREE</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,0.5);">
              <span>Premium Packaging</span>
              <span style="color:#22c55e;font-weight:700;">FREE</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);">
              <div>
                <span style="font-size:14px;font-weight:800;color:#fff;">Total</span>
                <span style="display:block;font-size:9px;color:rgba(255,255,255,0.35);font-weight:500;text-transform:uppercase;letter-spacing:0.04em;">All taxes included</span>
              </div>
              <span id="gw-cart-total" style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.02em;">₹0</span>
            </div>
          </div>

          <!-- Single Checkout CTA -->
          <button id="gw-drawer-checkout-btn" style="width:100%;padding:14px;background:#fff;color:#000;border:none;font-weight:800;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;text-transform:uppercase;letter-spacing:0.04em;transition:opacity 0.15s;">
            <span>Proceed to Checkout</span>
            <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>

          <!-- Trust Badges -->
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;padding-top:2px;font-size:9px;color:rgba(255,255,255,0.35);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">
            <span>🔒 Secure</span>
            <span>•</span>
            <span>⚡ Fast Dispatch</span>
            <span>•</span>
            <span>✓ Genuine</span>
          </div>

        </div>

      </aside>

      <!-- Two-Step Checkout Modal -->
      <div id="gw-checkout-modal-root" role="dialog" aria-modal="true">
        <div style="background:#111116;border:1px solid rgba(255,255,255,0.1);width:100%;max-width:520px;max-height:92vh;overflow-y:auto;box-shadow:0 30px 60px rgba(0,0,0,0.95);color:#fff;font-family:inherit;">
          
          <!-- Modal Header -->
          <div style="padding:18px 22px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;">
            <div>
              <h3 id="gw-checkout-title" style="margin:0;font-size:16px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.02em;">Checkout</h3>
              <p id="gw-checkout-subtitle" style="margin:2px 0 0;font-size:11px;color:rgba(255,255,255,0.4);">Step 1 of 2 — Shipping Details</p>
            </div>
            <button id="gw-close-checkout-modal" style="background:#fff;border:none;color:#000;font-size:14px;cursor:pointer;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;">✕</button>
          </div>

          <!-- Step 1: Shipping Details -->
          <div id="gw-checkout-step1" style="padding:20px 22px;display:flex;flex-direction:column;gap:14px;">
            
            <!-- Order Preview -->
            <div id="gw-checkout-items-preview" style="padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);font-size:12px;color:#fff;">
              <!-- Populated dynamically -->
            </div>

            <!-- Full Name -->
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.06em;">Full Name *</label>
              <input type="text" id="gw-cust-name" required placeholder="Your full name" style="background:#09090d;border:1px solid rgba(255,255,255,0.12);padding:10px 12px;color:#fff;font-size:13px;outline:none;font-family:inherit;">
            </div>

            <!-- Phone & Email -->
            <div class="gw-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div style="display:flex;flex-direction:column;gap:4px;">
                <label style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.06em;">Phone *</label>
                <input type="tel" id="gw-cust-phone" required placeholder="9876543210" maxlength="10" pattern="[0-9]{10}" style="background:#09090d;border:1px solid rgba(255,255,255,0.12);padding:10px 12px;color:#fff;font-size:13px;outline:none;font-family:inherit;">
              </div>
              <div style="display:flex;flex-direction:column;gap:4px;">
                <label style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.06em;">Email *</label>
                <input type="email" id="gw-cust-email" required placeholder="name@email.com" style="background:#09090d;border:1px solid rgba(255,255,255,0.12);padding:10px 12px;color:#fff;font-size:13px;outline:none;font-family:inherit;">
              </div>
            </div>

            <!-- Address -->
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.06em;">Shipping Address *</label>
              <textarea id="gw-cust-address" required rows="2" placeholder="House / Flat, Street, Landmark" style="background:#09090d;border:1px solid rgba(255,255,255,0.12);padding:10px 12px;color:#fff;font-size:13px;outline:none;resize:vertical;font-family:inherit;"></textarea>
            </div>

            <!-- City & Pincode -->
            <div class="gw-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div style="display:flex;flex-direction:column;gap:4px;">
                <label style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.06em;">City & State *</label>
                <input type="text" id="gw-cust-city" required placeholder="Mumbai, Maharashtra" style="background:#09090d;border:1px solid rgba(255,255,255,0.12);padding:10px 12px;color:#fff;font-size:13px;outline:none;font-family:inherit;">
              </div>
              <div style="display:flex;flex-direction:column;gap:4px;">
                <label style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.06em;">Pincode *</label>
                <input type="text" id="gw-cust-pincode" required placeholder="400001" maxlength="6" pattern="[0-9]{6}" style="background:#09090d;border:1px solid rgba(255,255,255,0.12);padding:10px 12px;color:#fff;font-size:13px;outline:none;font-family:inherit;">
              </div>
            </div>

            <!-- Continue Button -->
            <button id="gw-continue-to-payment" type="button" style="width:100%;padding:14px;background:#fff;color:#000;border:none;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;text-transform:uppercase;letter-spacing:0.04em;">
              <span>Continue to Payment</span>
              <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>

          <!-- Step 2: Payment -->
          <div id="gw-checkout-step2" style="padding:20px 22px;display:none;flex-direction:column;gap:14px;">
            
            <!-- Order + Address Summary -->
            <div id="gw-payment-summary" style="padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);font-size:12px;color:#fff;">
              <!-- Populated dynamically -->
            </div>

            <!-- Payment Options -->
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Payment Method</label>
              
              <!-- Razorpay -->
              <label id="gw-pay-razorpay-label" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.06);border:2px solid #fff;cursor:pointer;">
                <input type="radio" checked name="gwPayMethod" value="razorpay" id="gw-pay-razorpay" style="accent-color:#fff;width:16px;height:16px;">
                <div style="flex:1;">
                  <div style="font-size:12px;font-weight:700;color:#fff;display:flex;align-items:center;gap:6px;">
                    <span>Pay Online</span>
                    <span style="background:#fff;color:#000;font-size:8px;font-weight:800;padding:2px 6px;text-transform:uppercase;letter-spacing:0.04em;">Recommended</span>
                  </div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px;">UPI · Cards · Net Banking · Wallets via Razorpay</div>
                </div>
              </label>

              <!-- COD -->
              <label id="gw-pay-cod-label" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.1);cursor:pointer;">
                <input type="radio" name="gwPayMethod" value="cod" id="gw-pay-cod" style="accent-color:#fff;width:16px;height:16px;">
                <div style="flex:1;">
                  <div style="font-size:12px;font-weight:700;color:#fff;">Cash on Delivery</div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px;">Pay when you receive your order</div>
                </div>
              </label>
            </div>

            <!-- Amount Payable -->
            <div style="padding:12px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:13px;font-weight:700;color:#fff;">Amount Payable</span>
              <span id="gw-modal-total-amount" style="font-size:18px;font-weight:900;color:#fff;">₹0</span>
            </div>

            <!-- Action Buttons -->
            <div style="display:flex;flex-direction:column;gap:8px;">
              <button id="gw-confirm-order-btn" type="button" style="width:100%;padding:14px;background:#fff;color:#000;border:none;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;text-transform:uppercase;letter-spacing:0.04em;">
                <span>Confirm & Pay</span>
                <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              </button>
              <button id="gw-back-to-details" type="button" style="width:100%;padding:10px;background:transparent;color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.1);font-weight:600;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                <svg style="width:12px;height:12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                <span>Back to Details</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- COD Unavailable Popup -->
      <div id="gw-cod-popup" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:1000010;display:none;align-items:center;justify-content:center;padding:20px;">
        <div style="background:#111116;border:1px solid rgba(255,255,255,0.1);width:100%;max-width:380px;padding:28px 24px;text-align:center;color:#fff;">
          <div style="width:56px;height:56px;margin:0 auto 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:24px;">✕</div>
          <h3 style="margin:0 0 8px;font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;">COD Not Available</h3>
          <p style="margin:0 0 20px;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5;">Sorry, Cash on Delivery is currently not available for your location. Please use online payment to complete your order.</p>
          <button id="gw-cod-popup-close" style="width:100%;padding:12px;background:#fff;color:#000;border:none;font-weight:800;font-size:12px;cursor:pointer;text-transform:uppercase;letter-spacing:0.04em;">Use Online Payment</button>
        </div>
      </div>

      <!-- Order Success Modal -->
      <div id="gw-order-success-modal" role="dialog" aria-modal="true">
        <div style="background:#111116;border:1px solid rgba(255,255,255,0.1);width:100%;max-width:460px;box-shadow:0 30px 70px rgba(0,0,0,0.95);color:#fff;font-family:inherit;text-align:center;padding:30px 24px;">
          
          <div style="width:60px;height:60px;margin:0 auto 14px;background:rgba(255,255,255,0.06);border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:28px;">✓</div>

          <span style="background:rgba(255,255,255,0.08);color:#fff;font-size:10px;font-weight:800;padding:4px 12px;text-transform:uppercase;letter-spacing:0.1em;border:1px solid rgba(255,255,255,0.15);">
            Order Confirmed
          </span>

          <h2 style="font-size:22px;font-weight:900;color:#fff;margin:12px 0 6px;letter-spacing:-0.02em;">Thank You For Your Order!</h2>
          <p style="font-size:12px;color:rgba(255,255,255,0.5);margin:0 0 18px;line-height:1.5;">Your 3D display frame order has been placed successfully.</p>

          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:14px;text-align:left;margin-bottom:20px;display:flex;flex-direction:column;gap:8px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:rgba(255,255,255,0.5);">Order Number:</span>
              <strong id="gw-success-order-id" style="color:#fff;font-family:monospace;font-size:12px;">GW-000000</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:rgba(255,255,255,0.5);">Estimated Delivery:</span>
              <strong style="color:#fff;">3 – 5 Business Days</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:rgba(255,255,255,0.5);">Packaging:</span>
              <strong style="color:#22c55e;">Premium Shockproof Box</strong>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;">
            <a href="/track.html" style="padding:12px;background:#fff;color:#000;text-decoration:none;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;text-transform:uppercase;letter-spacing:0.04em;">
              Track Your Order
            </a>
            <button onclick="window.closeSuccessModal && window.closeSuccessModal(); window.location.href='/collections.html';" style="padding:10px;background:transparent;border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);font-weight:700;font-size:12px;cursor:pointer;">
              Continue Shopping
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(root);

    // ─── Event Listeners ───
    const closeBtn = document.getElementById('gw-close-cart-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);

    const clearBtn = document.getElementById('gw-clear-cart-btn');
    if (clearBtn) {
      clearBtn.onclick = () => {
        cart = getCart();
        if (cart.length === 0) return;
        cart = [];
        saveCart();
        showToast('Crate cleared');
      };
    }

    const checkoutBtn = document.getElementById('gw-drawer-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        cart = getCart();
        if (!cart || cart.length === 0) {
          showToast('Your crate is empty', 'Add products first');
          return;
        }
        closeCartDrawer();
        openCheckoutModal();
      };
    }

    const closeCheckoutBtn = document.getElementById('gw-close-checkout-modal');
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);

    // Step navigation
    const continueBtn = document.getElementById('gw-continue-to-payment');
    if (continueBtn) continueBtn.addEventListener('click', goToPaymentStep);

    const backBtn = document.getElementById('gw-back-to-details');
    if (backBtn) backBtn.addEventListener('click', goToDetailsStep);

    // Confirm order
    const confirmBtn = document.getElementById('gw-confirm-order-btn');
    if (confirmBtn) confirmBtn.addEventListener('click', handleConfirmOrder);

    // COD selection → popup
    const codRadio = document.getElementById('gw-pay-cod');
    const razorpayRadio = document.getElementById('gw-pay-razorpay');
    if (codRadio) {
      codRadio.addEventListener('change', () => {
        if (codRadio.checked) {
          showCodPopup();
        }
      });
    }

    // COD popup close
    const codPopupClose = document.getElementById('gw-cod-popup-close');
    if (codPopupClose) {
      codPopupClose.addEventListener('click', () => {
        closeCodPopup();
        if (razorpayRadio) razorpayRadio.checked = true;
        updatePaymentLabels();
      });
    }

    // Payment label styling on change
    if (razorpayRadio) {
      razorpayRadio.addEventListener('change', updatePaymentLabels);
    }
    if (codRadio) {
      codRadio.addEventListener('change', updatePaymentLabels);
    }
  }

  function updatePaymentLabels() {
    const razorpayLabel = document.getElementById('gw-pay-razorpay-label');
    const codLabel = document.getElementById('gw-pay-cod-label');
    const razorpayRadio = document.getElementById('gw-pay-razorpay');

    if (razorpayRadio && razorpayRadio.checked) {
      if (razorpayLabel) { razorpayLabel.style.borderColor = '#fff'; razorpayLabel.style.background = 'rgba(255,255,255,0.06)'; }
      if (codLabel) { codLabel.style.borderColor = 'rgba(255,255,255,0.1)'; codLabel.style.background = 'rgba(255,255,255,0.02)'; }
    } else {
      if (razorpayLabel) { razorpayLabel.style.borderColor = 'rgba(255,255,255,0.1)'; razorpayLabel.style.background = 'rgba(255,255,255,0.02)'; }
      if (codLabel) { codLabel.style.borderColor = '#fff'; codLabel.style.background = 'rgba(255,255,255,0.06)'; }
    }
  }

  function showCodPopup() {
    const popup = document.getElementById('gw-cod-popup');
    if (popup) { popup.style.display = 'flex'; }
  }

  function closeCodPopup() {
    const popup = document.getElementById('gw-cod-popup');
    if (popup) { popup.style.display = 'none'; }
  }

  // ─── Two-Step Checkout Navigation ───
  function goToPaymentStep() {
    // Validate step 1 fields
    const name = document.getElementById('gw-cust-name');
    const phone = document.getElementById('gw-cust-phone');
    const email = document.getElementById('gw-cust-email');
    const address = document.getElementById('gw-cust-address');
    const city = document.getElementById('gw-cust-city');
    const pincode = document.getElementById('gw-cust-pincode');

    const fields = [name, phone, email, address, city, pincode];
    let valid = true;
    fields.forEach(f => {
      if (!f || !f.value.trim()) {
        valid = false;
        if (f) { f.style.borderColor = '#ef4444'; setTimeout(() => f.style.borderColor = 'rgba(255,255,255,0.12)', 2000); }
      }
    });

    if (!valid) {
      showToast('Please fill all required fields');
      return;
    }

    // Phone validation
    if (phone && !/^\d{10}$/.test(phone.value.trim())) {
      phone.style.borderColor = '#ef4444';
      showToast('Enter a valid 10-digit phone number');
      return;
    }

    // Pincode validation
    if (pincode && !/^\d{6}$/.test(pincode.value.trim())) {
      pincode.style.borderColor = '#ef4444';
      showToast('Enter a valid 6-digit pincode');
      return;
    }

    // Save checkout data
    checkoutData = {
      name: name.value.trim(),
      phone: phone.value.trim(),
      email: email.value.trim(),
      address: address.value.trim(),
      city: city.value.trim(),
      pincode: pincode.value.trim()
    };

    // Switch to step 2
    checkoutStep = 2;
    const step1 = document.getElementById('gw-checkout-step1');
    const step2 = document.getElementById('gw-checkout-step2');
    const title = document.getElementById('gw-checkout-title');
    const subtitle = document.getElementById('gw-checkout-subtitle');

    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'flex';
    if (title) title.textContent = 'Payment';
    if (subtitle) subtitle.textContent = 'Step 2 of 2 — Select Payment Method';

    // Populate payment summary
    const summary = document.getElementById('gw-payment-summary');
    if (summary) {
      summary.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;display:flex;justify-content:space-between;">
          <span>Order (${getTotalItems()} items)</span>
          <span>${formatINR(getSubtotal())}</span>
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,0.45);border-top:1px solid rgba(255,255,255,0.06);padding-top:6px;margin-top:4px;">
          <div>${checkoutData.name} · ${checkoutData.phone}</div>
          <div>${checkoutData.address}, ${checkoutData.city} – ${checkoutData.pincode}</div>
        </div>
      `;
    }

    const totalSpan = document.getElementById('gw-modal-total-amount');
    if (totalSpan) totalSpan.textContent = formatINR(getSubtotal());

    // Reset payment to Razorpay
    const razorpayRadio = document.getElementById('gw-pay-razorpay');
    if (razorpayRadio) razorpayRadio.checked = true;
    updatePaymentLabels();
  }

  function goToDetailsStep() {
    checkoutStep = 1;
    const step1 = document.getElementById('gw-checkout-step1');
    const step2 = document.getElementById('gw-checkout-step2');
    const title = document.getElementById('gw-checkout-title');
    const subtitle = document.getElementById('gw-checkout-subtitle');

    if (step1) step1.style.display = 'flex';
    if (step2) step2.style.display = 'none';
    if (title) title.textContent = 'Checkout';
    if (subtitle) subtitle.textContent = 'Step 1 of 2 — Shipping Details';
  }

  // ─── Confirm Order ───
  function handleConfirmOrder() {
    const payMethod = document.querySelector('input[name="gwPayMethod"]:checked');
    if (!payMethod) return;

    if (payMethod.value === 'cod') {
      showCodPopup();
      return;
    }

    // Razorpay flow
    const subtotal = getSubtotal();
    const d = new Date();
    const yr = String(d.getFullYear()).slice(-2);
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const orderId = `GW-${yr}${mo}${day}-${randCode}`;

    // Load Razorpay if not loaded
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => openRazorpayCheckout(subtotal, orderId);
      script.onerror = () => {
        showToast('Payment gateway could not be loaded', 'Please try again');
      };
      document.head.appendChild(script);
    } else {
      openRazorpayCheckout(subtotal, orderId);
    }
  }

  function openRazorpayCheckout(amount, orderId) {
    const options = {
      key: RAZORPAY_KEY,
      amount: amount * 100, // Razorpay expects paise
      currency: 'INR',
      name: '3D Gear Wall',
      description: `Order ${orderId} — ${getTotalItems()} items`,
      image: '/images/logo-dark.png',
      prefill: {
        name: checkoutData.name,
        email: checkoutData.email,
        contact: checkoutData.phone
      },
      theme: {
        color: '#000000'
      },
      handler: function (response) {
        // Genuine payment success callback from Razorpay
        handlePaymentSuccess(orderId, response.razorpay_payment_id);
      },
      modal: {
        ondismiss: function () {
          showToast('Payment was not completed', 'Your crate items have been safely saved');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay error:', err);
      showToast('Payment error', 'Please try again');
    }
  }

  async function handlePaymentSuccess(orderId, paymentId) {
    // 1. Display modern full-screen payment verification loader
    let verifyOverlay = document.getElementById('gw-verifying-overlay');
    if (!verifyOverlay) {
      verifyOverlay = document.createElement('div');
      verifyOverlay.id = 'gw-verifying-overlay';
      verifyOverlay.style.cssText = 'position:fixed;inset:0;background:#09090d;z-index:9999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:24px;';
      verifyOverlay.innerHTML = `
        <div style="width:52px;height:52px;border:3px solid rgba(255,255,255,0.15);border-top-color:#fff;border-radius:50%;animation:gwSpin 0.75s linear infinite;margin-bottom:20px;"></div>
        <span style="font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#34d399;margin-bottom:6px;">✓ Payment Received</span>
        <h3 id="gw-verify-msg" style="font-size:20px;font-weight:900;text-transform:uppercase;letter-spacing:0.02em;margin:0 0 8px;">Verifying Payment with Bank...</h3>
        <p style="font-size:12px;color:rgba(255,255,255,0.5);margin:0 0 18px;max-width:320px;">Securing Order <strong style="color:#fff;font-family:monospace;">${escapeHtml(orderId)}</strong> and allocating handcrafted models.</p>
        <div style="font-size:10px;font-family:monospace;color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.04);padding:6px 14px;border:1px solid rgba(255,255,255,0.08);">
          Ref: ${escapeHtml(paymentId)} • Please do not close or reload
        </div>
      `;
      document.body.appendChild(verifyOverlay);
    }

    const subtotal = getSubtotal();
    const purchasedItems = cart.map(i => ({
      id: i.id,
      name: i.name,
      brand: i.brand,
      price: i.price,
      quantity: i.quantity,
      scale: i.scale || '1:36',
      image: i.image
    }));

    const orderPayload = {
      order_id: orderId,
      customer_name: checkoutData.name || 'Valued Collector',
      customer_email: checkoutData.email || '',
      customer_phone: checkoutData.phone || '',
      shipping_address: checkoutData.address || '',
      city: checkoutData.city || '',
      state: checkoutData.state || '',
      pincode: checkoutData.pincode || '',
      items: purchasedItems,
      subtotal: subtotal,
      payment_method: 'razorpay',
      payment_id: paymentId || ('PAY-' + Date.now()),
      payment_status: 'PAID',
      order_status: 'Order Confirmed',
      courier_partner: 'Bluedart Express',
      tracking_number: null,
      created_at: new Date().toISOString()
    };

    // 2. Cache to localStorage and sessionStorage immediately
    try {
      localStorage.setItem('gw_last_order', JSON.stringify(orderPayload));
      sessionStorage.setItem('gw_last_order', JSON.stringify(orderPayload));
    } catch (e) {}

    // 3. Persist to Supabase public.orders with await confirmation
    try {
      const resp = await fetch('https://ipcutxtnjplptmxjdtax.supabase.co/rest/v1/orders', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY3V0eHRuanBscHRteGpkdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjUwMTMsImV4cCI6MjEwNDQ0MTAxM30.WHsEzjWwNl8R48b8239RUIOPjuN7xbl-RdEQGLG_1LI',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY3V0eHRuanBscHRteGpkdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjUwMTMsImV4cCI6MjEwNDQ0MTAxM30.WHsEzjWwNl8R48b8239RUIOPjuN7xbl-RdEQGLG_1LI',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(orderPayload)
      });
      if (resp.ok) {
        const verifyMsg = document.getElementById('gw-verify-msg');
        if (verifyMsg) verifyMsg.textContent = 'Order Verified! Generating Receipt...';
      }
    } catch (err) {
      console.warn('Order sync note:', err);
    }

    // Small delay so user sees smooth verified state
    await new Promise(r => setTimeout(r, 600));

    closeCheckoutModal();

    // 4. Clear cart only after verified payment
    cart = [];
    saveCart();
    checkoutData = {};
    checkoutStep = 1;

    // 5. Direct redirect to dedicated Thank You Page
    window.location.href = '/thank-you.html?order_id=' + encodeURIComponent(orderId);
  }

  function openSuccessModal(orderId) {
    injectCartDrawer();
    const modal = document.getElementById('gw-order-success-modal');
    const orderIdEl = document.getElementById('gw-success-order-id');

    if (orderIdEl) orderIdEl.textContent = orderId;
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeSuccessModal() {
    const modal = document.getElementById('gw-order-success-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  // ─── Open / Close Drawer ───
  function openCartDrawer() {
    cart = getCart();
    injectCartDrawer();
    updateCartUI();
    const drawer = document.getElementById('gw-cart-drawer');
    const backdrop = document.getElementById('gw-cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('open');
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('gw-cart-drawer');
    const backdrop = document.getElementById('gw-cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function openCheckoutModal() {
    cart = getCart();
    if (!cart || cart.length === 0) {
      showToast('Your crate is empty', 'Add products first');
      return;
    }
    injectCartDrawer();
    checkoutStep = 1;

    // Reset to step 1
    goToDetailsStep();

    const modal = document.getElementById('gw-checkout-modal-root');
    const previewBox = document.getElementById('gw-checkout-items-preview');

    if (previewBox) {
      previewBox.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;display:flex;justify-content:space-between;">
          <span>Crate Summary (${getTotalItems()} items)</span>
          <span>${formatINR(getSubtotal())}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">
          ${cart.map(i => `
            <span style="background:rgba(255,255,255,0.06);padding:3px 8px;font-size:10px;">
              ${i.name.length > 28 ? i.name.substring(0, 28) + '…' : i.name} × ${i.quantity}
            </span>
          `).join('')}
        </div>
      `;
    }

    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCheckoutModal() {
    const modal = document.getElementById('gw-checkout-modal-root');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  // ─── Update Cart UI ───
  function updateCartUI() {
    cart = getCart();
    injectCartDrawer();
    const container = document.getElementById('gw-cart-items-container');
    const subtotalEl = document.getElementById('gw-cart-subtotal');
    const totalEl = document.getElementById('gw-cart-total');
    const footerEl = document.getElementById('gw-cart-footer');
    const shippingBarEl = document.getElementById('gw-free-shipping-bar');

    const totalCount = getTotalItems();
    const subtotal = getSubtotal();

    if (subtotalEl) subtotalEl.textContent = formatINR(subtotal);
    if (totalEl) totalEl.textContent = formatINR(subtotal);

    // Sync all site-wide badges
    document.querySelectorAll('.cart-count, [data-cart-count], .cart-count-badge').forEach(el => {
      el.textContent = totalCount;
      if (totalCount > 0) {
        el.classList.remove('hidden');
        el.style.display = 'inline-flex';
      } else {
        el.classList.add('hidden');
        el.style.display = 'none';
      }
    });

    if (!container) return;

    // 1. EMPTY STATE
    if (cart.length === 0) {
      if (footerEl) footerEl.style.display = 'none';
      if (shippingBarEl) shippingBarEl.style.display = 'none';

      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:32px 16px;color:rgba(255,255,255,0.7);">
          
          <div style="width:64px;height:64px;margin-bottom:18px;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.1);">
            <svg style="width:28px;height:28px;color:rgba(255,255,255,0.25);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          </div>

          <span style="font-size:9px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:8px;">Empty</span>
          <h4 style="font-size:18px;font-weight:900;color:#ffffff;margin:0 0 6px;letter-spacing:-0.01em;">Your Crate Is Empty</h4>
          <p style="font-size:12px;color:rgba(255,255,255,0.45);margin:0 auto 22px;max-width:260px;line-height:1.5;">
            Browse our collection of premium handcrafted 3D display frames.
          </p>

          <div style="display:flex;flex-direction:column;gap:8px;width:100%;max-width:260px;margin-bottom:28px;">
            <a href="/collections.html" onclick="window.closeCartDrawer && window.closeCartDrawer()" style="padding:12px 20px;background:#fff;color:#000;text-decoration:none;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;text-transform:uppercase;letter-spacing:0.04em;">
              <span>Explore Collections</span>
              <svg style="width:12px;height:12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
            <a href="/customize.html" onclick="window.closeCartDrawer && window.closeCartDrawer()" style="padding:10px 20px;background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);text-decoration:none;font-size:12px;font-weight:700;text-align:center;">
              Build Custom Frame
            </a>
          </div>

          <!-- Quick Recommendations -->
          <div style="width:100%;text-align:left;border-top:1px solid rgba(255,255,255,0.06);padding-top:18px;">
            <span style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);display:block;margin-bottom:10px;">Popular Picks</span>

            <div style="display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
                <img src="/images/products/twoofvu6src3z5foyd8h.jpg" alt="Mercedes-AMG F1" style="width:40px;height:40px;object-fit:cover;background:#000;">
                <div style="flex:1;min-width:0;">
                  <div style="font-size:11px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Mercedes-AMG Petronas F1</div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.5);font-weight:700;">₹599</div>
                </div>
                <button type="button" onclick="window.addToCart({ id:'38', name:'Mercedes-AMG Petronas Formula 1 3D Diecast Car Frame – 1:36 Scale', price:599, scale:'1:36', image:'/images/products/twoofvu6src3z5foyd8h.jpg' });" style="padding:5px 10px;background:#fff;color:#000;border:none;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;text-transform:uppercase;">
                  + Add
                </button>
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
                <img src="/images/products/s1jgictjue8oevd5qiua.jpg" alt="Ferrari SF-24" style="width:40px;height:40px;object-fit:cover;background:#000;">
                <div style="flex:1;min-width:0;">
                  <div style="font-size:11px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Ferrari SF-24 Formula 1</div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.5);font-weight:700;">₹599</div>
                </div>
                <button type="button" onclick="window.addToCart({ id:'36', name:'Ferrari SF-24 Formula 1 3D Diecast Car Frame – 1:64 Scale', price:599, scale:'1:64', image:'/images/products/s1jgictjue8oevd5qiua.jpg' });" style="padding:5px 10px;background:#fff;color:#000;border:none;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;text-transform:uppercase;">
                  + Add
                </button>
              </div>
            </div>
          </div>

        </div>
      `;
      return;
    }

    // 2. POPULATED STATE
    if (footerEl) footerEl.style.display = 'flex';
    if (shippingBarEl) shippingBarEl.style.display = 'flex';

    container.innerHTML = cart.map((item, idx) => `
      <div style="display:flex;gap:12px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);align-items:flex-start;">
        
        <!-- Thumbnail -->
        <div style="position:relative;width:64px;height:64px;flex-shrink:0;overflow:hidden;background:#09090c;border:1px solid rgba(255,255,255,0.08);">
          <img src="${item.image || '/images/products/twoofvu6src3z5foyd8h.jpg'}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">
        </div>

        <!-- Info -->
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:4px;">
            <h4 style="margin:0;font-size:12px;font-weight:700;color:#fff;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;" title="${item.name}">${item.name}</h4>
            <button onclick="window.removeCartItem(${idx})" style="background:transparent;border:none;color:rgba(255,255,255,0.3);font-size:12px;cursor:pointer;padding:0 2px;line-height:1;" title="Remove">✕</button>
          </div>

          <!-- Badges -->
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-bottom:6px;">
            <span style="font-size:9px;font-weight:800;color:#fff;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);padding:1px 5px;text-transform:uppercase;">${item.scale || '1:36'}</span>
            ${item.customDetails && item.customDetails.bgTheme ? `<span style="font-size:9px;color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.05);padding:1px 5px;">${item.customDetails.bgTheme}</span>` : ''}
          </div>
          ${item.customDetails && item.customDetails.plaqueText ? `
            <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:6px;font-family:monospace;background:rgba(255,255,255,0.03);padding:2px 5px;">
              Plaque: "${item.customDetails.plaqueText}"
            </div>
          ` : ''}

          <!-- Price & Qty -->
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
            <div style="display:flex;align-items:baseline;gap:4px;">
              <span style="font-size:13px;font-weight:800;color:#fff;">${formatINR(item.price)}</span>
              ${item.originalPrice && item.originalPrice > item.price ? `<span style="font-size:10px;color:rgba(255,255,255,0.3);text-decoration:line-through;">${formatINR(item.originalPrice)}</span>` : ''}
            </div>

            <!-- Stepper -->
            <div style="display:inline-flex;align-items:center;background:#09090c;border:1px solid rgba(255,255,255,0.12);overflow:hidden;">
              <button onclick="window.updateCartQty(${idx}, -1)" style="background:transparent;border:none;color:#fff;width:24px;height:24px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;" aria-label="Decrease">−</button>
              <span style="font-size:11px;font-weight:700;color:#fff;min-width:20px;text-align:center;">${item.quantity || 1}</span>
              <button onclick="window.updateCartQty(${idx}, 1)" style="background:transparent;border:none;color:#fff;width:24px;height:24px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;" aria-label="Increase">+</button>
            </div>
          </div>

        </div>
      </div>
    `).join('');
  }

  // Out-of-stock is determined dynamically by supabase data (product.out_of_stock flag)

  // ─── Core Cart Operations ───
  window.addToCart = function (product, options = {}) {
    if (!product || !product.name) return;

    // Refresh cart from storage first
    cart = getCart();

    // Check if product is out of stock (via live Supabase flag)
    if (product.out_of_stock === true) {
      showToast(product.name, 'Item is OUT OF STOCK and cannot be purchased', product.image);
      return;
    }

    const signature = (product.id || product.name) + '_' + (product.price || 0) + '_' + (product.scale || '') + '_' + JSON.stringify(product.customDetails || '');
    const now = Date.now();
    if (signature === lastAddSignature && (now - lastAddTime) < 400) {
      return;
    }
    lastAddSignature = signature;
    lastAddTime = now;

    const existing = cart.find(item => {
      const matchId = item.id && product.id && String(item.id) === String(product.id);
      const matchName = item.name === product.name;
      const matchScale = item.scale === product.scale;
      const matchCustom = JSON.stringify(item.customDetails || {}) === JSON.stringify(product.customDetails || {});
      // If custom poster, match on customDetails
      if (product.customDetails) {
        return matchName && matchScale && matchCustom;
      }
      // For standard products, both ID (or name) AND matching name must agree to avoid ghost/deleted product collision
      return ((matchId && matchName) || (!product.id && matchName)) && matchScale;
    });

    const qtyToAdd = Math.max(1, Number(product.quantity) || 1);

    if (existing) {
      // Synchronize latest live price & image
      existing.name = product.name;
      existing.price = Number(product.price) || existing.price;
      existing.originalPrice = product.originalPrice ? Number(product.originalPrice) : existing.originalPrice;
      if (product.image) existing.image = product.image;
      existing.quantity = (Number(existing.quantity) || 1) + qtyToAdd;
    } else {
      // Purge any stale/ghost cart item that might share this product.id with a different name (e.g. deleted old product)
      if (product.id) {
        const staleIdx = cart.findIndex(it => String(it.id) === String(product.id) && it.name !== product.name);
        if (staleIdx !== -1) {
          cart.splice(staleIdx, 1);
        }
      }

      cart.push({
        id: product.id || ('GW-' + Date.now()),
        name: product.name,
        price: Number(product.price) || 599,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        scale: product.scale || '1:36',
        image: product.image || '/images/products/twoofvu6src3z5foyd8h.jpg',
        quantity: qtyToAdd,
        customDetails: product.customDetails || null
      });
    }

    saveCart();
    const qtyText = qtyToAdd > 1 ? ` (${qtyToAdd} items)` : '';
    showToast(product.name, `Added to Crate${qtyText}`, product.image);
    
    if (!options.silent) {
      openCartDrawer();
    }
  };

  window.updateCartQty = function (index, delta) {
    cart = getCart();
    if (!cart[index]) return;
    const newQty = (Number(cart[index].quantity) || 1) + delta;
    if (newQty <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = newQty;
    }
    saveCart();
  };

  window.removeCartItem = function (index) {
    cart = getCart();
    if (!cart[index]) return;
    cart.splice(index, 1);
    saveCart();
  };

  // Global Helpers
  window.openCartDrawer = openCartDrawer;
  window.closeCartDrawer = closeCartDrawer;
  window.openCheckoutModal = openCheckoutModal;
  window.closeCheckoutModal = closeCheckoutModal;
  window.closeSuccessModal = closeSuccessModal;
  window.showGearwallToast = showToast;

  // Delegated Document Click Listener
  document.addEventListener('click', function (e) {
    if (e.__cartHandled) return;

    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.hasAttribute('data-cart-handled') || btn.closest('#gw-cart-drawer') || btn.closest('#gw-checkout-modal-root') || btn.closest('#gw-cod-popup')) {
      return;
    }

    const btnText = (btn.textContent || '').toLowerCase();
    const isAddButton = btnText.includes('add to crate') || btnText.includes('add to cart');
    const isBuyNowButton = btnText.includes('buy now');

    if (isAddButton || isBuyNowButton) {
      e.__cartHandled = true;
      e.preventDefault();
      e.stopPropagation();

      const card = btn.closest('.collection-card') || btn.closest('.group') || btn.closest('main') || document.body;
      const titleEl = card.querySelector('h1, h2, h3, .product-title');
      const name = titleEl ? titleEl.textContent.trim() : document.title.split('|')[0].trim();

      // Extract ID accurately from page URL (on detail page) or card link/data attribute
      let productId = null;
      if (window.location.pathname.includes('/product/')) {
        const pathMatch = window.location.pathname.match(/product\/(\d+)/);
        if (pathMatch) productId = pathMatch[1];
      }
      if (!productId) {
        if (card.dataset && card.dataset.productId) {
          productId = card.dataset.productId;
        } else {
          const link = card.querySelector('a[href*="product/"]');
          if (link) {
            const m = (link.getAttribute('href') || '').match(/product\/(\d+)/);
            if (m) productId = m[1];
          }
        }
      }
      if (!productId) productId = name;

      // Price: find price that is NOT line-through
      let price = 599;
      let originalPrice = null;
      const origEl = card.querySelector('.line-through');
      if (origEl) {
        const m = origEl.textContent.match(/₹\s*([0-9,]+)/);
        if (m) originalPrice = Number(m[1].replace(/,/g, ''));
      }
      const priceCandidates = Array.from(card.querySelectorAll('.font-bold, .text-base, .text-xl, .text-2xl, .text-3xl, [data-testid="product-price"]'));
      for (const pel of priceCandidates) {
        if (pel.closest('.line-through') || pel.classList.contains('line-through')) continue;
        const m = pel.textContent.match(/₹\s*([0-9,]+)/);
        if (m) {
          price = Number(m[1].replace(/,/g, ''));
          break;
        }
      }

      // Quantity from stepper if present
      let quantity = 1;
      const qtyEl = document.querySelector('.gw-qty-val');
      if (qtyEl) {
        const q = parseInt(qtyEl.textContent.trim(), 10);
        if (!isNaN(q) && q > 0) quantity = q;
      }

      const imgEl = card.querySelector('#gw-detail-main-img, .aspect-square img, img');
      const image = imgEl ? (imgEl.src || imgEl.getAttribute('src')) : '/images/products/twoofvu6src3z5foyd8h.jpg';

      const scaleMatch = (name + ' ' + card.textContent).match(/1:(18|24|36|43|64)/);
      const scale = scaleMatch ? scaleMatch[0] : '1:36';

      window.addToCart({
        id: productId,
        name: name,
        price: price,
        originalPrice: originalPrice,
        scale: scale,
        image: image,
        quantity: quantity
      });

      if (isBuyNowButton) {
        setTimeout(() => {
          closeCartDrawer();
          openCheckoutModal();
        }, 150);
      }
    }
  });

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectCartDrawer();
      updateCartUI();
    });
  } else {
    injectCartDrawer();
    updateCartUI();
  }
})();
