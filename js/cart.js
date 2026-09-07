/**
 * 3D Gear Wall - Ultimate Interactive Cart & Checkout System (v2)
 * High-performance, luxury automotive cart engine.
 * Features:
 * - Persistent multi-tab state via localStorage (3dgearwall_cart_v2)
 * - Atmospheric Empty Garage State with quick-add recommendations
 * - Rich populated cart items with custom options (frame size, backdrop, plaque text)
 * - Anti-duplicate / debounce protection eliminating double-add bugs
 * - Dual checkout: WhatsApp 1-Click Order + In-App Secure Checkout Modal
 * - Custom Celebration Order Placed Modal (no browser alerts)
 * - Site-wide luxury floating toast notifications
 */

(function () {
  'use strict';

  const STORAGE_KEY = '3dgearwall_cart_v2';
  const LEGACY_STORAGE_KEY = '3dgearwall_cart';
  const STORE_WHATSAPP = '919110420650';

  // State
  let cart = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      cart = JSON.parse(saved);
    } else {
      // Migrate from legacy key if present
      const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacySaved) {
        cart = JSON.parse(legacySaved);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      }
    }
  } catch (e) {
    cart = [];
  }

  // Double-add debounce tracker
  let lastAddSignature = '';
  let lastAddTime = 0;

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
    updateCartUI();
    window.dispatchEvent(new CustomEvent('gearwall:cart-updated', { detail: { cart } }));
  }

  // Cross-tab synchronization
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) {
      try {
        cart = e.newValue ? JSON.parse(e.newValue) : [];
        updateCartUI();
      } catch (err) {
        // ignore
      }
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

  // Luxury Site-Wide Floating Toast Notification
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
      ${image ? `<img src="${image}" alt="${title}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;background:#000;border:1px solid rgba(255,255,255,0.1);flex-shrink:0;">` : `<span style="font-size:24px;line-height:1;color:#FF6B35;flex-shrink:0;">🏁</span>`}
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:700;color:#fff;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
        ${subtitle ? `<div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${subtitle}</div>` : ''}
      </div>
      <button onclick="window.openCartDrawer && window.openCartDrawer(); this.closest('.gw-toast-card').remove();" style="padding:6px 12px;background:rgba(255,107,53,0.15);border:1px solid rgba(255,107,53,0.4);border-radius:6px;color:#FF6B35;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;transition:background 0.2s;">
        View Crate
      </button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }

  // Injection of Drawer, Checkout Modal & Celebration Modal
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
        <div style="padding:18px 22px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.02);">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;line-height:1;">🏎️</span>
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:800;letter-spacing:-0.02em;color:#fff;">Your Garage Crate</h3>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);font-weight:500;">3D Gear Wall Handcrafted Displays</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <button id="gw-clear-cart-btn" style="background:transparent;border:none;color:rgba(255,255,255,0.4);font-size:11px;font-weight:600;cursor:pointer;padding:4px 8px;border-radius:4px;transition:color 0.2s;" title="Empty all items">Clear</button>
            <button id="gw-close-cart-btn" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;transition:all 0.2s;" aria-label="Close Crate">✕</button>
          </div>
        </div>

        <!-- Checkered Free Shipping Status Bar -->
        <div id="gw-free-shipping-bar" style="padding:10px 20px;background:linear-gradient(90deg, rgba(255,107,53,0.12), rgba(224,26,79,0.12));border-bottom:1px solid rgba(255,107,53,0.2);display:flex;align-items:center;gap:10px;font-size:12px;font-weight:600;color:#FF8C5A;">
          <span style="font-size:15px;line-height:1;">🏁</span>
          <span><strong>FREE Insured Express Shipping</strong> unlocked across India!</span>
        </div>

        <!-- Cart Items List / Empty Container -->
        <div id="gw-cart-items-container" style="flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:14px;overscroll-behavior:contain;">
          <!-- Dynamically rendered -->
        </div>

        <!-- Drawer Footer / Pricing & Actions -->
        <div id="gw-cart-footer" style="padding:18px 22px;border-top:1px solid rgba(255,255,255,0.08);background:#09090c;display:flex;flex-direction:column;gap:12px;">
          
          <!-- Pricing Summary -->
          <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
            <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,0.55);">
              <span>Subtotal</span>
              <span id="gw-cart-subtotal" style="color:#fff;font-weight:700;">₹0</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,0.55);">
              <span>Express Delivery (Air Cargo)</span>
              <span style="color:#22c55e;font-weight:700;">FREE</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,0.55);">
              <span>Armored Shockproof Box</span>
              <span style="color:#22c55e;font-weight:700;">INCLUDED</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);">
              <div>
                <span style="font-size:15px;font-weight:800;color:#fff;">Grand Total</span>
                <span style="display:block;font-size:10px;color:rgba(255,255,255,0.4);font-weight:500;">All Indian taxes & duties included</span>
              </div>
              <span id="gw-cart-total" style="font-size:22px;font-weight:900;color:#FF6B35;letter-spacing:-0.02em;">₹0</span>
            </div>
          </div>

          <!-- Checkout Action Buttons -->
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px;">
            
            <!-- Primary Checkout Button -->
            <button id="gw-drawer-checkout-btn" style="width:100%;padding:14px;background:linear-gradient(135deg, #FF6B35 0%, #FF3366 100%);color:#fff;border:none;border-radius:8px;font-weight:800;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 8px 25px rgba(255,107,53,0.35);transition:transform 0.15s ease, opacity 0.2s;">
              <span>Proceed to Secure Checkout</span>
              <svg style="width:16px;height:16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>

            <!-- WhatsApp Instant Checkout Option -->
            <button id="gw-whatsapp-checkout-btn" style="width:100%;padding:12px;background:#25D366;color:#ffffff;border:none;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.2s;box-shadow:0 6px 18px rgba(37,211,102,0.25);">
              <svg style="width:18px;height:18px;" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.96.541 1.77.828 2.796.828 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.814-5.77-5.814zm3.424 8.243c-.145.409-.838.774-1.174.82-.338.046-.777.065-2.254-.546-1.89-1.042-3.111-2.955-3.206-3.08-.095-.126-.772-1.028-.772-1.959 0-.932.489-1.39.664-1.58.175-.19.382-.237.51-.237.127 0 .254.002.366.007.119.006.278-.045.435.333.161.388.549 1.341.597 1.439.048.098.08.213.016.34-.064.127-.096.206-.191.317-.095.111-.2.247-.286.333-.095.095-.195.198-.084.388.111.19.493.814 1.058 1.318.728.648 1.342.848 1.532.943.191.095.302.079.413-.048.111-.127.476-.556.603-.746.127-.19.254-.159.429-.095.175.063 1.111.524 1.302.619.19.095.317.143.365.222.048.079.048.46-.097.869z"></path></svg>
              <span>Instant Order via WhatsApp</span>
            </button>

          </div>

          <!-- Trust Badges -->
          <div style="display:flex;align-items:center;justify-content:center;gap:14px;padding-top:4px;font-size:10px;color:rgba(255,255,255,0.4);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">
            <span>🔒 256-Bit SSL</span>
            <span>•</span>
            <span>⚡ Same-Day Dispatch</span>
            <span>•</span>
            <span>🛡️ 100% Genuine</span>
          </div>

        </div>

      </aside>

      <!-- In-App Checkout Modal -->
      <div id="gw-checkout-modal-root" role="dialog" aria-modal="true">
        <div style="background:#111116;border:1px solid rgba(255,255,255,0.12);border-radius:14px;width:100%;max-width:540px;max-height:92vh;overflow-y:auto;box-shadow:0 30px 60px rgba(0,0,0,0.95);color:#fff;font-family:inherit;">
          
          <!-- Modal Header -->
          <div style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.02);">
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">🏁</span>
                <h3 style="margin:0;font-size:18px;font-weight:800;color:#fff;">Complete Your Order</h3>
              </div>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);">Instant confirmation & insured express dispatch</p>
            </div>
            <button id="gw-close-checkout-modal" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:16px;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;">✕</button>
          </div>

          <!-- Checkout Form -->
          <form id="gw-checkout-form" style="padding:22px 24px;display:flex;flex-direction:column;gap:16px;">
            
            <!-- Order Items Preview Banner -->
            <div id="gw-checkout-items-preview" style="padding:12px 14px;background:rgba(255,107,53,0.08);border:1px solid rgba(255,107,53,0.25);border-radius:8px;font-size:12px;color:#fff;">
              <!-- Populated dynamically -->
            </div>

            <!-- Full Name -->
            <div style="display:flex;flex-direction:column;gap:6px;">
              <label style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.06em;">Full Name *</label>
              <input type="text" id="gw-cust-name" required placeholder="e.g. Kabir Malhotra" style="background:#09090d;border:1px solid rgba(255,255,255,0.15);padding:11px 14px;border-radius:8px;color:#fff;font-size:14px;outline:none;">
            </div>

            <!-- Phone & Email -->
            <div class="gw-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.06em;">WhatsApp Phone *</label>
                <input type="tel" id="gw-cust-phone" required placeholder="9876543210" maxlength="10" pattern="[0-9]{10}" style="background:#09090d;border:1px solid rgba(255,255,255,0.15);padding:11px 14px;border-radius:8px;color:#fff;font-size:14px;outline:none;">
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.06em;">Email Address *</label>
                <input type="email" id="gw-cust-email" required placeholder="name@domain.com" style="background:#09090d;border:1px solid rgba(255,255,255,0.15);padding:11px 14px;border-radius:8px;color:#fff;font-size:14px;outline:none;">
              </div>
            </div>

            <!-- Address -->
            <div style="display:flex;flex-direction:column;gap:6px;">
              <label style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.06em;">Shipping Address (Flat, Street, Landmark) *</label>
              <textarea id="gw-cust-address" required rows="2" placeholder="House / Flat No, Tower, Street, Landmark" style="background:#09090d;border:1px solid rgba(255,255,255,0.15);padding:11px 14px;border-radius:8px;color:#fff;font-size:14px;outline:none;resize:vertical;"></textarea>
            </div>

            <!-- City & Pincode -->
            <div class="gw-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.06em;">City & State *</label>
                <input type="text" id="gw-cust-city" required placeholder="e.g. Mumbai, Maharashtra" style="background:#09090d;border:1px solid rgba(255,255,255,0.15);padding:11px 14px;border-radius:8px;color:#fff;font-size:14px;outline:none;">
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.06em;">Pincode *</label>
                <input type="text" id="gw-cust-pincode" required placeholder="400001" maxlength="6" pattern="[0-9]{6}" style="background:#09090d;border:1px solid rgba(255,255,255,0.15);padding:11px 14px;border-radius:8px;color:#fff;font-size:14px;outline:none;">
              </div>
            </div>

            <!-- Payment Method Radio -->
            <div style="display:flex;flex-direction:column;gap:8px;">
              <label style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.06em;">Select Payment Mode</label>
              
              <label style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,107,53,0.1);border:1px solid #FF6B35;border-radius:8px;cursor:pointer;">
                <input type="radio" checked name="gwPaymentMode" value="upi_online" style="accent-color:#FF6B35;">
                <div style="flex:1;">
                  <div style="font-size:13px;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px;">
                    <span>Online / UPI / Google Pay / Cards</span>
                    <span style="background:#FF6B35;color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;text-transform:uppercase;">Zero Extra Fee</span>
                  </div>
                  <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">Fastest priority dispatch via Bluedart / Delhivery</div>
                </div>
              </label>

              <label style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:8px;cursor:pointer;">
                <input type="radio" name="gwPaymentMode" value="cod_whatsapp" style="accent-color:#FF6B35;">
                <div style="flex:1;">
                  <div style="font-size:13px;font-weight:700;color:#fff;">WhatsApp / COD Verification</div>
                  <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">Our team confirms frame details on WhatsApp before shipping</div>
                </div>
              </label>
            </div>

            <!-- Total Bar -->
            <div style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:14px;font-weight:700;color:#fff;">Amount Payable</span>
              <span id="gw-modal-total-amount" style="font-size:20px;font-weight:900;color:#FF6B35;">₹0</span>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="gw-submit-order-btn" style="padding:15px;background:linear-gradient(135deg, #FF6B35 0%, #FF3366 100%);color:#fff;border:none;border-radius:8px;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 8px 25px rgba(255,107,53,0.35);transition:opacity 0.2s;">
              Confirm & Place Order
            </button>

          </form>

        </div>
      </div>

      <!-- Luxury Celebration Order Placed Modal (Replaces browser alert) -->
      <div id="gw-order-success-modal" role="dialog" aria-modal="true">
        <div style="background:#111116;border:1px solid rgba(255,107,53,0.4);border-radius:16px;width:100%;max-width:500px;box-shadow:0 30px 70px rgba(0,0,0,0.95), 0 0 40px rgba(255,107,53,0.2);color:#fff;font-family:inherit;text-align:center;padding:32px 26px;position:relative;">
          
          <div style="width:72px;height:72px;margin:0 auto 16px;background:linear-gradient(135deg, rgba(255,107,53,0.2), rgba(224,26,79,0.2));border:2px solid #FF6B35;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;">
            🏁
          </div>

          <span style="background:rgba(255,107,53,0.15);color:#FF6B35;font-size:11px;font-weight:800;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.1em;border:1px solid rgba(255,107,53,0.3);">
            Order Confirmed
          </span>

          <h2 style="font-size:24px;font-weight:900;color:#fff;margin:12px 0 6px;letter-spacing:-0.02em;">Welcome To The Collector's Circle!</h2>
          <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0 0 20px;line-height:1.5;">Your bespoke 3D die-cast display is entered into our studio production queue.</p>

          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;text-align:left;margin-bottom:22px;display:flex;flex-direction:column;gap:8px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:rgba(255,255,255,0.5);">Order Number:</span>
              <strong id="gw-success-order-id" style="color:#FF6B35;font-family:monospace;font-size:13px;">GW-2026-0000</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:rgba(255,255,255,0.5);">Delivery Estimated:</span>
              <strong style="color:#fff;">3 - 5 Business Days (Air Express)</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:rgba(255,255,255,0.5);">Packaging:</span>
              <strong style="color:#22c55e;">Armored Shockproof Wooden Frame Box</strong>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;">
            <a id="gw-success-whatsapp-link" href="#" target="_blank" style="padding:14px;background:#25D366;color:#fff;border-radius:8px;font-weight:800;font-size:14px;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 20px rgba(37,211,102,0.3);">
              <span>💬 Track & Chat on WhatsApp</span>
            </a>
            <button onclick="window.closeSuccessModal && window.closeSuccessModal(); window.location.href='collections.html';" style="padding:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;">
              Continue Browsing Garage
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(root);

    // Event listeners
    const closeBtn = document.getElementById('gw-close-cart-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);

    const clearBtn = document.getElementById('gw-clear-cart-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        cart = [];
        saveCart();
        showToast('Garage crate cleared');
      });
    }

    const checkoutBtn = document.getElementById('gw-drawer-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
          showToast('Your crate is empty', 'Add models first!');
          return;
        }
        closeCartDrawer();
        openCheckoutModal();
      });
    }

    const whatsappBtn = document.getElementById('gw-whatsapp-checkout-btn');
    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', handleWhatsAppCheckout);
    }

    const closeCheckoutBtn = document.getElementById('gw-close-checkout-modal');
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);

    const checkoutForm = document.getElementById('gw-checkout-form');
    if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // Handle WhatsApp Checkout
  function handleWhatsAppCheckout() {
    if (cart.length === 0) {
      showToast('Your crate is empty', 'Select models first');
      return;
    }

    let text = `🏎️ *NEW ORDER INQUIRY - 3D GEAR WALL*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    cart.forEach((item, i) => {
      text += `${i + 1}. *${item.name}*\n`;
      text += `   • Scale/Size: ${item.scale || '1:36'}\n`;
      if (item.customDetails) {
        if (item.customDetails.bgTheme) text += `   • Theme: ${item.customDetails.bgTheme}\n`;
        if (item.customDetails.plaqueText) text += `   • Plaque: "${item.customDetails.plaqueText}"\n`;
      }
      text += `   • Qty: ${item.quantity || 1} × ${formatINR(item.price)}\n\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *Grand Total:* ${formatINR(getSubtotal())}\n`;
    text += `🚚 *Shipping:* FREE Express Nationwide\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Please confirm availability and dispatch timeline!`;

    const url = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  // Handle In-App Checkout Form Submit
  function handleCheckoutSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('gw-cust-name').value.trim();
    const phone = document.getElementById('gw-cust-phone').value.trim();
    const email = document.getElementById('gw-cust-email').value.trim();
    const address = document.getElementById('gw-cust-address').value.trim();
    const city = document.getElementById('gw-cust-city').value.trim();
    const pincode = document.getElementById('gw-cust-pincode').value.trim();
    const subtotal = getSubtotal();

    const orderId = 'GW-' + Date.now().toString().slice(-6);

    // Prepare WhatsApp Confirmation Link
    let text = `🏁 *ORDER PLACED - ${orderId}*\n`;
    text += `Name: ${name}\nPhone: ${phone}\nAddress: ${address}, ${city} - ${pincode}\nTotal: ${formatINR(subtotal)}\nItems (${getTotalItems()}): \n`;
    cart.forEach(item => {
      text += `• ${item.name} (${item.quantity}x)\n`;
    });
    const waUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(text)}`;

    // Show celebration modal
    closeCheckoutModal();
    openSuccessModal(orderId, waUrl);

    // Clear cart
    cart = [];
    saveCart();
  }

  function openSuccessModal(orderId, waUrl) {
    injectCartDrawer();
    const modal = document.getElementById('gw-order-success-modal');
    const orderIdEl = document.getElementById('gw-success-order-id');
    const waLink = document.getElementById('gw-success-whatsapp-link');

    if (orderIdEl) orderIdEl.textContent = orderId;
    if (waLink) waLink.href = waUrl;

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

  // Open / Close Drawer
  function openCartDrawer() {
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
    injectCartDrawer();
    const modal = document.getElementById('gw-checkout-modal-root');
    const totalSpan = document.getElementById('gw-modal-total-amount');
    const previewBox = document.getElementById('gw-checkout-items-preview');

    if (totalSpan) totalSpan.textContent = formatINR(getSubtotal());

    if (previewBox) {
      previewBox.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;display:flex;justify-content:space-between;">
          <span>Crate Summary (${getTotalItems()} models)</span>
          <span style="color:#FF6B35;">${formatINR(getSubtotal())}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${cart.map(i => `
            <span style="background:rgba(255,255,255,0.06);padding:3px 8px;border-radius:4px;font-size:11px;">
              ${i.name.length > 25 ? i.name.substring(0, 25) + '...' : i.name} × ${i.quantity}
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

  // Update Drawer Content & Badges
  function updateCartUI() {
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

    // 1. EMPTY STATE - Atmospheric Dark Garage
    if (cart.length === 0) {
      if (footerEl) footerEl.style.display = 'none';
      if (shippingBarEl) shippingBarEl.style.display = 'none';

      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:32px 16px;color:rgba(255,255,255,0.7);">
          
          <!-- Empty Garage Animated Icon -->
          <div style="position:relative;width:90px;height:90px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;background:radial-gradient(circle, rgba(255,107,53,0.2) 0%, transparent 70%);border-radius:50%;"></div>
            <div style="font-size:52px;line-height:1;position:relative;z-index:2;filter:drop-shadow(0 6px 14px rgba(255,107,53,0.3));">🏎️</div>
          </div>

          <!-- Empty Kicker & Title -->
          <span style="font-size:10px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#FF6B35;margin-bottom:8px;">Garage Idle • 0 RPM</span>
          <h4 style="font-size:20px;font-weight:900;color:#ffffff;margin:0 0 8px;letter-spacing:-0.02em;">Your Crate Is Empty</h4>
          <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 auto 24px;max-width:280px;line-height:1.5;">
            No precision machines parked in your garage yet. Upgrade your wall with iconic handcrafted motorsport frames.
          </p>

          <!-- Primary CTAs -->
          <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:280px;margin-bottom:30px;">
            <a href="collections.html" onclick="window.closeCartDrawer && window.closeCartDrawer()" style="padding:12px 20px;background:linear-gradient(135deg, #FF6B35 0%, #FF3366 100%);color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 18px rgba(255,107,53,0.35);">
              <span>Explore All Collections</span>
              <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
            <a href="customize.html" onclick="window.closeCartDrawer && window.closeCartDrawer()" style="padding:11px 20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700;">
              ⚙️ Build Custom Frame
            </a>
          </div>

          <!-- Quick Recommendations (1-Click Add) -->
          <div style="width:100%;text-align:left;border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <span style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Trending In The Pit Lane</span>
            </div>

            <div style="display:flex;flex-direction:column;gap:10px;">
              
              <!-- Rec 1: Mercedes-AMG F1 -->
              <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;">
                <img src="/images/products/twoofvu6src3z5foyd8h.jpg" alt="Mercedes-AMG F1" style="width:48px;height:48px;object-fit:cover;border-radius:6px;background:#000;">
                <div style="flex:1;min-width:0;">
                  <div style="font-size:12px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Mercedes-AMG Petronas F1</div>
                  <div style="font-size:11px;color:#FF6B35;font-weight:700;">₹599 <span style="font-size:10px;color:rgba(255,255,255,0.3);text-decoration:line-through;">₹999</span></div>
                </div>
                <button type="button" onclick="window.addToCart({ id:'38', name:'Mercedes-AMG Petronas Formula 1 3D Diecast Car Frame – 1:36 Scale', price:599, originalPrice:999, scale:'1:36', image:'/images/products/twoofvu6src3z5foyd8h.jpg' });" style="padding:6px 12px;background:#FF6B35;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;">
                  + Add
                </button>
              </div>

              <!-- Rec 2: Ferrari SF-24 -->
              <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;">
                <img src="/images/products/s1jgictjue8oevd5qiua.jpg" alt="Ferrari SF-24" style="width:48px;height:48px;object-fit:cover;border-radius:6px;background:#000;">
                <div style="flex:1;min-width:0;">
                  <div style="font-size:12px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Ferrari SF-24 Formula 1</div>
                  <div style="font-size:11px;color:#FF6B35;font-weight:700;">₹599 <span style="font-size:10px;color:rgba(255,255,255,0.3);text-decoration:line-through;">₹1,399</span></div>
                </div>
                <button type="button" onclick="window.addToCart({ id:'36', name:'Ferrari SF-24 Formula 1 3D Diecast Car Frame – 1:64 Scale', price:599, originalPrice:1399, scale:'1:64', image:'/images/products/s1jgictjue8oevd5qiua.jpg' });" style="padding:6px 12px;background:#FF6B35;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;">
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
      <div style="display:flex;gap:14px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;align-items:flex-start;">
        
        <!-- Thumbnail -->
        <div style="position:relative;width:72px;height:72px;flex-shrink:0;border-radius:8px;overflow:hidden;background:#09090c;border:1px solid rgba(255,255,255,0.1);">
          <img src="${item.image || '/images/products/twoofvu6src3z5foyd8h.jpg'}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">
        </div>

        <!-- Info & Controls -->
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px;">
            <h4 style="margin:0;font-size:13px;font-weight:700;color:#fff;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;" title="${item.name}">${item.name}</h4>
            <button onclick="window.removeCartItem(${idx})" style="background:transparent;border:none;color:rgba(255,255,255,0.3);font-size:14px;cursor:pointer;padding:2px 4px;line-height:1;transition:color 0.2s;" title="Remove">✕</button>
          </div>

          <!-- Badges & Custom Options -->
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:8px;">
            <span style="font-size:10px;font-weight:800;color:#FF6B35;background:rgba(255,107,53,0.12);border:1px solid rgba(255,107,53,0.25);padding:1px 6px;border-radius:4px;text-transform:uppercase;">${item.scale || '1:36'}</span>
            ${item.customDetails && item.customDetails.bgTheme ? `<span style="font-size:10px;color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px;">${item.customDetails.bgTheme}</span>` : ''}
          </div>
          ${item.customDetails && item.customDetails.plaqueText ? `
            <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:8px;font-family:monospace;background:rgba(255,255,255,0.03);padding:3px 6px;border-radius:4px;">
              Plaque: "${item.customDetails.plaqueText}"
            </div>
          ` : ''}

          <!-- Price & Quantity Row -->
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="display:flex;align-items:baseline;gap:6px;">
              <span style="font-size:14px;font-weight:800;color:#fff;">${formatINR(item.price)}</span>
              ${item.originalPrice ? `<span style="font-size:11px;color:rgba(255,255,255,0.35);text-decoration:line-through;">${formatINR(item.originalPrice)}</span>` : ''}
            </div>

            <!-- Stepper -->
            <div style="display:inline-flex;align-items:center;background:#09090c;border:1px solid rgba(255,255,255,0.15);border-radius:6px;overflow:hidden;">
              <button onclick="window.updateCartQty(${idx}, -1)" style="background:transparent;border:none;color:#fff;width:26px;height:26px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;" aria-label="Decrease quantity">-</button>
              <span style="font-size:12px;font-weight:700;color:#fff;min-width:22px;text-align:center;">${item.quantity || 1}</span>
              <button onclick="window.updateCartQty(${idx}, 1)" style="background:transparent;border:none;color:#fff;width:26px;height:26px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;" aria-label="Increase quantity">+</button>
            </div>
          </div>

        </div>
      </div>
    `).join('');
  }

  // Core Cart Operations
  window.addToCart = function (product, options = {}) {
    if (!product || !product.name) return;

    // Debounce guard to prevent rapid duplicate addition
    const signature = (product.id || product.name) + '_' + (product.price || 0) + '_' + (product.scale || '') + '_' + JSON.stringify(product.customDetails || '');
    const now = Date.now();
    if (signature === lastAddSignature && (now - lastAddTime) < 400) {
      console.warn('[Cart] Duplicate addToCart suppressed by debounce guard');
      return;
    }
    lastAddSignature = signature;
    lastAddTime = now;

    const existing = cart.find(item => {
      const matchId = item.id && product.id && item.id === product.id;
      const matchName = item.name === product.name;
      const matchScale = item.scale === product.scale;
      const matchCustom = JSON.stringify(item.customDetails || {}) === JSON.stringify(product.customDetails || {});
      return (matchId || matchName) && matchScale && matchCustom;
    });

    if (existing) {
      existing.quantity = (Number(existing.quantity) || 1) + 1;
    } else {
      cart.push({
        id: product.id || ('GW-' + Date.now()),
        name: product.name,
        price: Number(product.price) || 599,
        originalPrice: Number(product.originalPrice) || 999,
        scale: product.scale || '1:36',
        image: product.image || '/images/products/twoofvu6src3z5foyd8h.jpg',
        quantity: 1,
        customDetails: product.customDetails || null
      });
    }

    saveCart();
    showToast(product.name, `Added to Crate (${product.scale || 'Standard'})`, product.image);
    
    if (!options.silent) {
      openCartDrawer();
    }
  };

  window.updateCartQty = function (index, delta) {
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

  // Single-Delegated Document Click Listener with Anti-Duplication Contract
  document.addEventListener('click', function (e) {
    // If an event was already processed by component logic, abort immediately
    if (e.__cartHandled) return;

    const btn = e.target.closest('button');
    if (!btn) return;

    // Skip if button has data-cart-handled attribute or is a cart internal button
    if (btn.hasAttribute('data-cart-handled') || btn.closest('#gw-cart-drawer') || btn.closest('#gw-checkout-modal-root')) {
      return;
    }

    const btnText = (btn.textContent || '').toLowerCase();
    const isAddButton = btnText.includes('add to crate') || btnText.includes('add to cart');
    const isBuyNowButton = btnText.includes('buy now');

    if (isAddButton || isBuyNowButton) {
      // Mark event as handled to prevent bubbling duplicates
      e.__cartHandled = true;
      e.preventDefault();
      e.stopPropagation();

      // Look up parent card or product container
      const card = btn.closest('.collection-card') || btn.closest('.group') || btn.closest('main') || document.body;
      const titleEl = card.querySelector('h1, h2, h3, .product-title');
      const name = titleEl ? titleEl.textContent.trim() : document.title.split('|')[0].trim();

      // Find price
      const priceText = card.textContent.match(/₹\s*([0-9,]+)/);
      const price = priceText ? Number(priceText[1].replace(/,/g, '')) : 599;

      // Find image
      const imgEl = card.querySelector('img');
      const image = imgEl ? (imgEl.src || imgEl.getAttribute('src')) : '/images/products/twoofvu6src3z5foyd8h.jpg';

      // Find scale
      const scaleMatch = (name + ' ' + card.textContent).match(/1:(18|24|36|43|64)/);
      const scale = scaleMatch ? scaleMatch[0] : '1:36';

      window.addToCart({
        id: name,
        name: name,
        price: price,
        scale: scale,
        image: image
      });

      if (isBuyNowButton) {
        setTimeout(() => {
          closeCartDrawer();
          openCheckoutModal();
        }, 150);
      }
    }
  });

  // Initialize on page load
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
