/**
 * 3D Gear Wall - Interactive Contact Form
 */

(function () {
  'use strict';

  function initContactForm() {
    const form = document.querySelector('main form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');
      const origText = submitBtn ? submitBtn.innerHTML : 'Send Message';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending message...';
      }

      setTimeout(() => {
        const successCard = document.createElement('div');
        successCard.style.cssText = 'background:#10B981;color:white;padding:16px 20px;border-radius:8px;margin-bottom:20px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:10px;animation:fadeIn 0.3s ease;';
        successCard.innerHTML = `
          <svg style="width:20px;height:20px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span>Thank you! Your message has been sent successfully. Our support team will get back to you within 2–4 hours.</span>
        `;
        form.parentNode.insertBefore(successCard, form);
        form.reset();

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }

        setTimeout(() => {
          successCard.style.transition = 'opacity 0.5s ease';
          successCard.style.opacity = '0';
          setTimeout(() => successCard.remove(), 500);
        }, 6000);
      }, 700);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }
})();
