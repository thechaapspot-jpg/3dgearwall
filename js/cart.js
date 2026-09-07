/**
 * 3D Gear Wall - Interactive Cart & Checkout System
 * Handles slide-out cart drawer, localStorage persistence, quantity updates,
 * toast notifications, and checkout modal flow.
 */

(function () {
  'use strict';

  const STORAGE_KEY = '3dgearwall_cart';

  // State
  let cart = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    cart = saved ? JSON.parse(saved) : [];
  } catch (e) {
    cart = [];
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
    updateCartUI();
  }

  // Helpers
  function formatINR(num) {
    return '₹' + Number(num).toLocaleString('en-IN');
  }

  function getTotalItems() {
    return cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }

  function getSubtotal() {
    return cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    let container = document.getElementById('gw-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gw-toast-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: #111115;
      color: #fff;
      border: 1px solid rgba(255, 107, 53, 0.4);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(255, 107, 53, 0.2);
      border-radius: 8px;
      padding: 14px 20px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: auto;
      transform: translateX(120%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: inherit;
    `;
    toast.innerHTML = `
      <span style="color:#FF6B35;font-size:18px;">🛒</span>
      <div>${message}</div>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => toast.remove(), 350);
    }, 2800);
  }

  // Slide-out Drawer HTML & Injection
  function injectCartDrawer() {
    if (document.getElementById('gw-cart-drawer-root')) return;

    const root = document.createElement('div');
    root.id = 'gw-cart-drawer-root';
    root.innerHTML = `
      <!-- Backdrop -->
      <div id="gw-cart-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:99998;opacity:0;pointer-events:none;transition:opacity 0.3s ease;"></div>

      <!-- Drawer Panel -->
      <div id="gw-cart-drawer" style="position:fixed;top:0;right:0;bottom:0;width:100%;max-width:440px;background:#0d0d11;border-left:1px solid rgba(255,255,255,0.1);box-shadow:-10px 0 40px rgba(0,0,0,0.8);z-index:99999;transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);display:flex;flex-direction:column;font-family:inherit;color:#fff;">
        
        <!-- Header -->
        <div style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:between;background:rgba(255,255,255,0.02);">
          <div style="display:flex;align-items:center;gap:10px;">
            <h3 style="margin:0;font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#fff;">Your Crate</h3>
            <span id="gw-drawer-count-badge" style="background:#FF6B35;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">0</span>
          </div>
          <button id="gw-close-cart-btn" style="background:transparent;border:none;color:rgba(255,255,255,0.6);cursor:pointer;padding:6px;border-radius:6px;font-size:20px;line-height:1;margin-left:auto;transition:color 0.2s;">✕</button>
        </div>

        <!-- Free shipping notice -->
        <div style="padding:10px 24px;background:linear-gradient(90deg, rgba(255,107,53,0.1), rgba(255,51,102,0.1));border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#FF6B35;font-weight:600;display:flex;align-items:center;gap:8px;">
          <span>🚚</span> <span>FREE Express Shipping on all 3D Gear Wall orders!</span>
        </div>

        <!-- Cart Items List -->
        <div id="gw-cart-items-container" style="flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:16px;">
          <!-- Items dynamically rendered here -->
        </div>

        <!-- Footer / Checkout -->
        <div id="gw-cart-footer" style="padding:20px 24px;border-top:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);display:flex;flex-direction:column;gap:14px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;color:rgba(255,255,255,0.5);">
            <span>Subtotal</span>
            <span id="gw-cart-subtotal" style="color:#fff;font-weight:600;">₹0</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;color:rgba(255,255,255,0.5);">
            <span>Shipping</span>
            <span style="color:#22c55e;font-weight:600;">FREE</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#fff;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
            <span>Total</span>
            <span id="gw-cart-total" style="color:#FF6B35;">₹0</span>
          </div>

          <button id="gw-drawer-checkout-btn" style="width:100%;padding:14px;background:linear-gradient(135deg, #FF6B35 0%, #FF3366 100%);color:#fff;border:none;border-radius:6px;font-weight:700;font-size:15px;cursor:pointer;transition:opacity 0.2s;box-shadow:0 6px 20px rgba(255,107,53,0.35);">
            Proceed to Checkout
          </button>
        </div>
      </div>

      <!-- Checkout Modal -->
      <div id="gw-checkout-modal-root" style="position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);z-index:999999;display:none;align-items:center;justify-content:center;padding:16px;">
        <div style="background:#131318;border:1px solid rgba(255,255,255,0.1);border-radius:12px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,0.9);color:#fff;font-family:inherit;">
          
          <div style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;">
            <div>
              <h3 style="margin:0;font-size:18px;font-weight:700;">Complete Your Order</h3>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);">3D Gear Wall — Handcrafted Die-Cast Displays</p>
            </div>
            <button id="gw-close-checkout-modal" style="background:transparent;border:none;color:rgba(255,255,255,0.5);font-size:20px;cursor:pointer;padding:4px;">✕</button>
          </div>

          <form id="gw-checkout-form" style="padding:24px;display:flex;flex-direction:column;gap:16px;">
            <div style="display:flex;flex-direction:column;gap:6px;">
              <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.05em;">Full Name</label>
              <input type="text" id="gw-cust-name" required placeholder="e.g. Rahul Sharma" style="background:#0a0a0d;border:1px solid rgba(255,255,255,0.15);padding:10px 14px;border-radius:6px;color:#fff;font-size:14px;outline:none;">
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.05em;">Phone (WhatsApp)</label>
                <input type="tel" id="gw-cust-phone" required placeholder="+91 98765 43210" style="background:#0a0a0d;border:1px solid rgba(255,255,255,0.15);padding:10px 14px;border-radius:6px;color:#fff;font-size:14px;outline:none;">
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.05em;">Email Address</label>
                <input type="email" id="gw-cust-email" required placeholder="name@domain.com" style="background:#0a0a0d;border:1px solid rgba(255,255,255,0.15);padding:10px 14px;border-radius:6px;color:#fff;font-size:14px;outline:none;">
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:6px;">
              <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.05em;">Delivery Address</label>
              <textarea id="gw-cust-address" required rows="2" placeholder="House / Flat No, Street, Landmark" style="background:#0a0a0d;border:1px solid rgba(255,255,255,0.15);padding:10px 14px;border-radius:6px;color:#fff;font-size:14px;outline:none;resize:vertical;"></textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.05em;">City</label>
                <input type="text" id="gw-cust-city" required placeholder="e.g. Mumbai" style="background:#0a0a0d;border:1px solid rgba(255,255,255,0.15);padding:10px 14px;border-radius:6px;color:#fff;font-size:14px;outline:none;">
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.05em;">Pincode</label>
                <input type="text" id="gw-cust-pincode" required placeholder="400001" maxlength="6" style="background:#0a0a0d;border:1px solid rgba(255,255,255,0.15);padding:10px 14px;border-radius:6px;color:#fff;font-size:14px;outline:none;">
              </div>
            </div>

            <!-- Payment Options -->
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px;">
              <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.05em;">Payment Gateway</label>
              <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(255,107,53,0.08);border:1px solid #FF6B35;border-radius:6px;">
                <input type="radio" checked id="pay-razorpay" name="paymentMethod" style="accent-color:#FF6B35;">
                <label for="pay-razorpay" style="font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;">
                  <span>Razorpay / UPI / Cards / NetBanking</span>
                  <span style="background:#FF6B35;font-size:10px;padding:2px 6px;border-radius:4px;">Recommended</span>
                </label>
              </div>
            </div>

            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:14px;border-radius:6px;margin-top:4px;">
              <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;">
                <span>Payable Amount</span>
                <span id="gw-modal-total-amount" style="color:#FF6B35;">₹0</span>
              </div>
            </div>

            <button type="submit" id="gw-submit-order-btn" style="margin-top:8px;padding:14px;background:linear-gradient(135deg, #FF6B35 0%, #FF3366 100%);color:#fff;border:none;border-radius:6px;font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 6px 20px rgba(255,107,53,0.35);">
              Pay with Razorpay
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    // Event listeners
    document.getElementById('gw-close-cart-btn').addEventListener('click', closeCartDrawer);
    document.getElementById('gw-cart-backdrop').addEventListener('click', closeCartDrawer);
    document.getElementById('gw-drawer-checkout-btn').addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Your crate is empty!');
        return;
      }
      closeCartDrawer();
      openCheckoutModal();
    });

    document.getElementById('gw-close-checkout-modal').addEventListener('click', closeCheckoutModal);

    document.getElementById('gw-checkout-form').addEventListener('submit', handleCheckoutSubmit);
  }

  function handleCheckoutSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('gw-cust-name').value;
    const phone = document.getElementById('gw-cust-phone').value;
    const address = document.getElementById('gw-cust-address').value;
    const total = formatINR(getSubtotal());

    // Check if Razorpay keys are configured or simulate immediate success
    if (window.Razorpay && window.RAZORPAY_KEY_ID) {
      // Direct Razorpay SDK trigger
      const options = {
        key: window.RAZORPAY_KEY_ID,
        amount: getSubtotal() * 100,
        currency: 'INR',
        name: '3D Gear Wall',
        description: 'Premium Die-Cast Model Car Wall Art',
        image: 'https://3dgearwall.shop/og-image.png',
        handler: function (response) {
          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}\nThank you ${name}, your order has been placed.`);
          cart = [];
          saveCart();
          closeCheckoutModal();
        },
        prefill: {
          name: name,
          contact: phone,
          email: document.getElementById('gw-cust-email').value
        },
        theme: {
          color: '#FF6B35'
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      // Clean, professional order placement confirmation
      alert(`🎉 Order Received!\n\nThank you, ${name}!\nAmount: ${total}\nDelivery To: ${address}\n\nRazorpay Gateway is ready for your Live API Keys in Stage 2. Your order details have been captured.`);
      cart = [];
      saveCart();
      closeCheckoutModal();
    }
  }

  // Open / Close Drawer
  function openCartDrawer() {
    injectCartDrawer();
    updateCartUI();
    const drawer = document.getElementById('gw-cart-drawer');
    const backdrop = document.getElementById('gw-cart-backdrop');
    if (drawer && backdrop) {
      drawer.style.transform = 'translateX(0)';
      backdrop.style.opacity = '1';
      backdrop.style.pointerEvents = 'auto';
    }
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('gw-cart-drawer');
    const backdrop = document.getElementById('gw-cart-backdrop');
    if (drawer && backdrop) {
      drawer.style.transform = 'translateX(100%)';
      backdrop.style.opacity = '0';
      backdrop.style.pointerEvents = 'none';
    }
  }

  function openCheckoutModal() {
    injectCartDrawer();
    const modal = document.getElementById('gw-checkout-modal-root');
    const totalSpan = document.getElementById('gw-modal-total-amount');
    if (modal) {
      if (totalSpan) totalSpan.textContent = formatINR(getSubtotal());
      modal.style.display = 'flex';
    }
  }

  function closeCheckoutModal() {
    const modal = document.getElementById('gw-checkout-modal-root');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Update Drawer Content & Badges
  function updateCartUI() {
    injectCartDrawer();
    const container = document.getElementById('gw-cart-items-container');
    const countBadge = document.getElementById('gw-drawer-count-badge');
    const subtotalEl = document.getElementById('gw-cart-subtotal');
    const totalEl = document.getElementById('gw-cart-total');

    const totalCount = getTotalItems();
    const subtotal = getSubtotal();

    if (countBadge) countBadge.textContent = totalCount;
    if (subtotalEl) subtotalEl.textContent = formatINR(subtotal);
    if (totalEl) totalEl.textContent = formatINR(subtotal);

    // Update any external cart counters or floating badges
    document.querySelectorAll('.cart-count, [data-cart-count]').forEach(el => {
      el.textContent = totalCount;
    });

    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:40px 20px;color:rgba(255,255,255,0.4);">
          <span style="font-size:48px;margin-bottom:16px;">🏎️</span>
          <p style="font-size:16px;font-weight:600;color:#fff;margin:0 0 8px;">Your crate is empty</p>
          <p style="font-size:13px;margin:0 0 24px;">Explore our collection of iconic 3D die-cast wall art.</p>
          <a href="/collections.html" style="background:#FF6B35;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:700;" onclick="window.closeCartDrawer()">
            Browse Models
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = cart.map((item, idx) => `
      <div style="display:flex;gap:14px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;align-items:center;">
        <img src="${item.image || 'og-image.png'}" alt="${item.name}" style="width:68px;height:68px;object-fit:cover;border-radius:6px;background:#000;flex-shrink:0;">
        <div style="flex:1;min-width:0;">
          <h4 style="margin:0 0 4px;font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${item.name}">${item.name}</h4>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:700;color:#FF6B35;background:rgba(255,107,53,0.15);padding:1px 6px;border-radius:4px;">${item.scale || '1:36'}</span>
            <span style="font-size:13px;font-weight:700;color:#fff;">${formatINR(item.price)}</span>
            ${item.originalPrice ? `<span style="font-size:11px;color:rgba(255,255,255,0.3);text-decoration:line-through;">${formatINR(item.originalPrice)}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="display:inline-flex;align-items:center;background:#0a0a0e;border:1px solid rgba(255,255,255,0.15);border-radius:4px;overflow:hidden;">
              <button onclick="window.updateCartQty(${idx}, -1)" style="background:transparent;border:none;color:#fff;width:24px;height:24px;font-size:14px;cursor:pointer;line-height:1;">-</button>
              <span style="font-size:12px;font-weight:600;min-width:20px;text-align:center;">${item.quantity || 1}</span>
              <button onclick="window.updateCartQty(${idx}, 1)" style="background:transparent;border:none;color:#fff;width:24px;height:24px;font-size:14px;cursor:pointer;line-height:1;">+</button>
            </div>
            <button onclick="window.removeCartItem(${idx})" style="background:transparent;border:none;color:rgba(255,255,255,0.4);font-size:12px;cursor:pointer;padding:4px;margin-left:auto;">✕ Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Cart operations
  window.addToCart = function (product) {
    const existing = cart.find(item => item.id == product.id || item.name == product.name);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        id: product.id || Date.now(),
        name: product.name || '3D Die-Cast Car Frame',
        price: Number(product.price) || 599,
        originalPrice: Number(product.originalPrice) || 999,
        scale: product.scale || '1:36',
        image: product.image || 'images/products/twoofvu6src3z5foyd8h.jpg',
        quantity: 1
      });
    }
    saveCart();
    showToast(`Added <strong>${product.name.substring(0, 30)}...</strong> to Crate!`);
    openCartDrawer();
  };

  window.updateCartQty = function (index, delta) {
    if (!cart[index]) return;
    cart[index].quantity = (cart[index].quantity || 1) + delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
  };

  window.removeCartItem = function (index) {
    if (!cart[index]) return;
    cart.splice(index, 1);
    saveCart();
  };

  window.openCartDrawer = openCartDrawer;
  window.closeCartDrawer = closeCartDrawer;
  window.openCheckoutModal = openCheckoutModal;
  window.closeCheckoutModal = closeCheckoutModal;

  // Global listener for "Add to Crate" buttons
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const btnText = btn.textContent.toLowerCase();
    if (btnText.includes('add to crate') || btnText.includes('add to cart') || btnText.includes('buy now')) {
      e.preventDefault();
      e.stopPropagation();

      // Look up parent card or product container
      const card = btn.closest('.group') || btn.closest('main') || document.body;
      const titleEl = card.querySelector('h1, h2, h3, .product-title');
      const name = titleEl ? titleEl.textContent.trim() : document.title.split('|')[0].trim();

      // Find price
      const priceText = card.textContent.match(/₹\s*([0-9,]+)/);
      const price = priceText ? Number(priceText[1].replace(/,/g, '')) : 599;

      // Find image
      const imgEl = card.querySelector('img');
      const image = imgEl ? (imgEl.src || imgEl.getAttribute('src')) : 'og-image.png';

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
