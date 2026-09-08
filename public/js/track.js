/**
 * 3D Gear Wall - Live Real-Time Order Tracker
 * Connects directly to Supabase public.orders for real-time tracking
 */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://ipcutxtnjplptmxjdtax.supabase.co';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY3V0eHRuanBscHRteGpkdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjUwMTMsImV4cCI6MjEwNDQ0MTAxM30.WHsEzjWwNl8R48b8239RUIOPjuN7xbl-RdEQGLG_1LI';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  const STATUS_STEPS = [
    { title: 'Order Confirmed & Prepared', desc: 'Payment verified & die-cast model allocated from collector inventory' },
    { title: 'Handcrafted 3D Framing & QC', desc: 'Studio Workshop — Handcrafted framing inspected and shock-proof sealed' },
    { title: 'Dispatched & In Transit', desc: 'Handed to express logistics partner and en route to destination' },
    { title: 'Out for Delivery', desc: 'Package assigned to local courier agent for doorstep delivery' },
    { title: 'Successfully Delivered', desc: 'Delivered and signed by recipient' }
  ];

  function getStepIndex(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver') && !s.includes('out for')) return 4;
    if (s.includes('out for delivery')) return 3;
    if (s.includes('ship') || s.includes('transit') || s.includes('dispatch')) return 2;
    if (s.includes('process') || s.includes('fram') || s.includes('craft')) return 1;
    return 0; // Order Confirmed
  }

  async function fetchOrderFromSupabase(query) {
    try {
      // 1. Check exact order_id
      let res = await fetch(`${SUPABASE_URL}/rest/v1/orders?order_id=eq.${encodeURIComponent(query)}&select=*`, {
        headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) return data[0];
      }

      // 2. If user entered phone number
      const phoneDigits = query.replace(/\D/g, '');
      if (phoneDigits.length >= 10) {
        res = await fetch(`${SUPABASE_URL}/rest/v1/orders?customer_phone=ilike.%25${phoneDigits.slice(-10)}%25&select=*&order=created_at.desc`, {
          headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) return data[0];
        }
      }
    } catch (e) {
      console.warn('Live tracking query failed:', e);
    }
    return null;
  }

  async function trackOrder(orderIdInput, container) {
    const query = (orderIdInput || '').trim();
    if (!query) return;

    let resultsDiv = document.getElementById('tracking-result');
    if (!resultsDiv) {
      resultsDiv = document.createElement('div');
      resultsDiv.id = 'tracking-result';
      container.appendChild(resultsDiv);
    }

    resultsDiv.style.marginTop = '24px';
    resultsDiv.innerHTML = `
      <div style="background:#111827;color:white;border-radius:12px;padding:32px;border:1px solid rgba(255,255,255,0.1);text-align:center;">
        <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0;">Looking up live shipment status for <strong style="color:#fff;">${escapeHtml(query)}</strong>...</p>
      </div>
    `;

    const order = await fetchOrderFromSupabase(query);

    if (!order) {
      resultsDiv.innerHTML = `
        <div style="background:#111827;color:white;border-radius:12px;padding:24px;border:1px solid rgba(244,63,94,0.3);">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(244,63,94,0.15);display:flex;align-items:center;justify-content:center;color:#f43f5e;">⚠️</div>
            <div>
              <h4 style="margin:0;font-size:15px;font-weight:700;">No Order Found</h4>
              <p style="margin:2px 0 0 0;font-size:12px;color:rgba(255,255,255,0.5);">We couldn't find an order matching "${escapeHtml(query)}".</p>
            </div>
          </div>
          <p style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5;margin:0 0 16px 0;">
            Please double-check your Order ID (e.g. <strong>GW-260908-7492</strong>) or enter your 10-digit registered phone number.
          </p>
          <div style="padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:11px;color:rgba(255,255,255,0.4);">Need help?</span>
            <a href="contact.html" style="font-size:12px;color:#FF6B35;text-decoration:none;font-weight:700;">Contact Customer Support →</a>
          </div>
        </div>
      `;
      return;
    }

    const currentStep = getStepIndex(order.order_status);
    const carrier = order.courier_partner || 'Bluedart Express';
    const awb = order.tracking_number || 'Allocation in Progress';
    const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const items = Array.isArray(order.items) ? order.items : [];

    resultsDiv.innerHTML = `
      <div style="background:#111827;color:white;border-radius:12px;padding:24px;border:1px solid rgba(255,255,255,0.1);animation:fadeIn 0.3s ease;">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:16px;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
          <div>
            <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#FF6B35;font-weight:700;margin:0 0 4px 0;">Live Tracking Status</p>
            <h3 style="font-size:18px;font-weight:800;margin:0;letter-spacing:-0.01em;">Order #${escapeHtml(order.order_id)}</h3>
            <p style="font-size:11px;color:rgba(255,255,255,0.5);margin:2px 0 0 0;">Recipient: ${escapeHtml(order.customer_name)} • Placed: ${dateStr}</p>
          </div>
          <span style="background:rgba(16,185,129,0.15);color:#10B981;border:1px solid rgba(16,185,129,0.3);padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;">
            ${escapeHtml(order.order_status || 'Order Confirmed')}
          </span>
        </div>

        <!-- Carrier Info Card -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:14px;margin-bottom:24px;background:rgba(255,255,255,0.03);padding:14px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
          <div>
            <span style="font-size:11px;color:rgba(255,255,255,0.4);display:block;">Logistics Partner</span>
            <strong style="font-size:13px;color:#fff;">${escapeHtml(carrier)}</strong>
          </div>
          <div>
            <span style="font-size:11px;color:rgba(255,255,255,0.4);display:block;">Air Waybill (AWB)</span>
            <strong style="font-size:13px;color:#FF6B35;">${escapeHtml(awb)}</strong>
          </div>
          <div>
            <span style="font-size:11px;color:rgba(255,255,255,0.4);display:block;">Destination City</span>
            <strong style="font-size:13px;color:#fff;">${escapeHtml(order.city || 'India')} (${escapeHtml(order.pincode || '')})</strong>
          </div>
          <div>
            <span style="font-size:11px;color:rgba(255,255,255,0.4);display:block;">Amount Paid</span>
            <strong style="font-size:13px;color:#34d399;">₹${Number(order.subtotal || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <!-- Timeline -->
        <div style="position:relative;padding-left:24px;margin-left:8px;border-left:2px solid #FF6B35;">
          ${STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;
            const dotColor = isCompleted ? '#10B981' : 'rgba(255,255,255,0.2)';
            return `
              <div style="margin-bottom:20px;position:relative;">
                <div style="position:absolute;left:-31px;top:2px;width:12px;height:12px;border-radius:50%;background:${dotColor};border:2px solid #111827;box-shadow:${isCurrent ? '0 0 10px #10B981' : 'none'};"></div>
                <p style="font-size:13px;font-weight:700;color:${isCompleted ? '#fff' : 'rgba(255,255,255,0.4)'};margin:0;">
                  ${step.title} ${isCurrent ? '<span style="font-size:10px;font-family:monospace;background:#FF6B35;color:#fff;padding:1px 6px;margin-left:6px;">CURRENT</span>' : ''}
                </p>
                <p style="font-size:11px;color:rgba(255,255,255,0.5);margin:2px 0 0 0;">${step.desc}</p>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Ordered Items Preview -->
        ${items.length > 0 ? `
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);">
            <span style="font-size:11px;font-family:monospace;color:rgba(255,255,255,0.4);text-transform:uppercase;display:block;margin-bottom:10px;">Package Contents</span>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${items.map(it => `
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;background:rgba(255,255,255,0.02);padding:6px 10px;border-radius:6px;">
                  <span style="color:#fff;font-weight:600;">${escapeHtml(it.name || 'Diecast Frame')} × ${it.quantity || 1}</span>
                  <span style="font-family:monospace;color:rgba(255,255,255,0.6);">₹${Number((it.price || 0) * (it.quantity || 1)).toLocaleString('en-IN')}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top:20px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <span style="font-size:12px;color:rgba(255,255,255,0.5);">Need priority delivery or changes?</span>
          <a href="contact.html" style="font-size:12px;font-weight:700;color:#FF6B35;text-decoration:none;border-bottom:1px solid #FF6B35;">Contact Dispatch Desk →</a>
        </div>
      </div>
    `;
  }

  function initTracker() {
    const form = document.querySelector('main form');
    if (!form) return;

    const input = document.getElementById('orderNumber');
    const container = form.parentElement;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      trackOrder(input.value, container);
    });

    // Auto-track if ?order_id= is in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderFromUrl = urlParams.get('order_id');
    if (orderFromUrl) {
      if (input) input.value = orderFromUrl;
      trackOrder(orderFromUrl, container);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracker);
  } else {
    initTracker();
  }
})();
