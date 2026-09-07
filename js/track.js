/**
 * 3D Gear Wall - Interactive Order Tracker
 */

(function () {
  'use strict';

  function initTracker() {
    const form = document.querySelector('main form');
    if (!form) return;

    const input = document.getElementById('orderNumber');
    const container = form.parentElement;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const orderId = (input.value || '').trim().toUpperCase() || '3DGW-84920';

      const resultsDiv = document.getElementById('tracking-result') || document.createElement('div');
      resultsDiv.id = 'tracking-result';
      resultsDiv.style.marginTop = '24px';
      resultsDiv.innerHTML = `
        <div style="background:#111827;color:white;border-radius:12px;padding:24px;border:1px solid rgba(255,255,255,0.1);animation:fadeIn 0.4s ease;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:16px;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
            <div>
              <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#FF6B35;font-weight:700;margin:0 0 4px 0;">Order Tracking Details</p>
              <h3 style="font-size:18px;font-weight:800;margin:0;letter-spacing:-0.01em;">Order #${orderId}</h3>
            </div>
            <span style="background:rgba(16,185,129,0.15);color:#10B981;border:1px solid rgba(16,185,129,0.3);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">In Transit</span>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:16px;margin-bottom:24px;background:rgba(255,255,255,0.03);padding:14px;border-radius:8px;">
            <div>
              <span style="font-size:11px;color:rgba(255,255,255,0.4);display:block;">Carrier</span>
              <strong style="font-size:13px;color:#fff;">Bluedart Express</strong>
            </div>
            <div>
              <span style="font-size:11px;color:rgba(255,255,255,0.4);display:block;">Air Waybill (AWB)</span>
              <strong style="font-size:13px;color:#FF6B35;">BD849201948IN</strong>
            </div>
            <div>
              <span style="font-size:11px;color:rgba(255,255,255,0.4);display:block;">Estimated Delivery</span>
              <strong style="font-size:13px;color:#fff;">Tomorrow by 6:00 PM</strong>
            </div>
          </div>

          <div style="position:relative;padding-left:24px;margin-left:8px;border-left:2px solid #FF6B35;">
            <div style="margin-bottom:20px;position:relative;">
              <div style="position:absolute;left:-31px;top:2px;width:12px;height:12px;border-radius:50%;background:#10B981;border:2px solid #111827;"></div>
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0;">Dispatched from Hub & In Transit</p>
              <p style="font-size:11px;color:rgba(255,255,255,0.5);margin:2px 0 0 0;">Express Sort Facility — Package scanned and on flight to destination hub</p>
            </div>
            <div style="margin-bottom:20px;position:relative;">
              <div style="position:absolute;left:-31px;top:2px;width:12px;height:12px;border-radius:50%;background:#10B981;border:2px solid #111827;"></div>
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0;">Precision 3D Framing & Quality Inspection</p>
              <p style="font-size:11px;color:rgba(255,255,255,0.5);margin:2px 0 0 0;">Studio Workshop — Handcrafted framing inspected and shock-proof sealed</p>
            </div>
            <div style="position:relative;">
              <div style="position:absolute;left:-31px;top:2px;width:12px;height:12px;border-radius:50%;background:#10B981;border:2px solid #111827;"></div>
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0;">Order Confirmed & Prepared</p>
              <p style="font-size:11px;color:rgba(255,255,255,0.5);margin:2px 0 0 0;">Payment verified & die-cast model allocated from collector inventory</p>
            </div>
          </div>

          <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <span style="font-size:12px;color:rgba(255,255,255,0.5);">Need assistance with this shipment?</span>
            <a href="contact.html" style="font-size:12px;font-weight:700;color:#FF6B35;text-decoration:none;border-bottom:1px solid #FF6B35;">Contact Support →</a>
          </div>
        </div>
      `;

      if (!document.getElementById('tracking-result')) {
        container.appendChild(resultsDiv);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracker);
  } else {
    initTracker();
  }
})();
