/* ============================================================
   TORO — main.js
   No inline handlers (CSP-safe). All behaviour wired here.
   ── Sections: REVEAL · FORM · STICKY CTA ──
   ============================================================ */
'use strict';

// Set this once you deploy the Worker (see worker.js / README).
const TORO_ENDPOINT = '__REPLACE_WITH_CF_WORKER_URL__';

document.addEventListener('DOMContentLoaded', () => {

  // ── REVEAL ON SCROLL ──────────────────────────────────────────
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // ── FORM SUBMIT ───────────────────────────────────────────────
  const form = document.getElementById('toro-form');
  if (form) {
    const phoneInput = document.getElementById('owner-phone');
    const phonePattern = /^0[35789]\d{8}$/; // VN mobile: 03/05/07/08/09 + 8 digits

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(form);

      // Validate phone (the field most worth guarding)
      const phone = (phoneInput && phoneInput.value || '').replace(/[\s.]/g, '');
      if (!phonePattern.test(phone)) {
        showFieldError(phoneInput, 'Số điện thoại chưa đúng (đầu 03/05/07/08/09 + 8 số).');
        phoneInput.focus();
        return;
      }

      const submitBtn = form.querySelector('[type="submit"]');
      const original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang gửi…';

      const payload = {
        owner_name: val('owner-name'),
        owner_phone: phone,
        shop_name: val('shop-name'),
        branch_count: val('branch-count'),
        platform: val('platform-select'),
        source: 'toroqc.com',
        timestamp: new Date().toISOString(),
      };

      // If the endpoint hasn't been wired yet, succeed locally so the page
      // never looks broken in preview / pre-deploy.
      if (!TORO_ENDPOINT || TORO_ENDPOINT.indexOf('REPLACE_WITH') !== -1) {
        console.warn('[toro] TORO_ENDPOINT not set — showing success without sending.');
        showFormSuccess();
        return;
      }

      try {
        const res = await fetch(TORO_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        showFormSuccess();
      } catch (err) {
        console.error('[toro] submit failed:', err);
        showFieldError(submitBtn, 'Có lỗi khi gửi — vui lòng thử lại hoặc nhắn Zalo.');
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      }
    });
  }

  function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  function clearErrors(scope) {
    scope.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
    scope.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  }

  function showFieldError(el, msg) {
    if (!el) return;
    const wrap = el.closest('.lk-field') || el.parentElement;
    let slot = wrap && wrap.querySelector('.field-error');
    if (!slot && wrap) {
      slot = document.createElement('span');
      slot.className = 'field-error';
      slot.setAttribute('role', 'alert');
      slot.setAttribute('aria-live', 'polite');
      wrap.appendChild(slot);
    }
    if (slot) slot.textContent = msg;
    if (el.setAttribute) el.setAttribute('aria-invalid', 'true');
  }

  function showFormSuccess() {
    const wrap = document.querySelector('.lark-body');
    if (!wrap) return;
    wrap.innerHTML =
      '<div class="form-success" role="alert" aria-live="polite">' +
        '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
          '<circle cx="32" cy="32" r="31" stroke="var(--coral)" stroke-width="2"></circle>' +
          '<path d="M20 32l9 9 15-16" stroke="var(--coral)" stroke-width="2.5" ' +
                'stroke-linecap="round" stroke-linejoin="round" ' +
                'stroke-dasharray="40" stroke-dashoffset="40" ' +
                'style="animation:draw-check .6s .2s ease forwards"></path>' +
        '</svg>' +
        '<h3 style="margin-top:16px;">Đã nhận thông tin!</h3>' +
        '<p class="muted" style="margin-top:8px;">TORO sẽ liên hệ trong <strong>24 giờ</strong> ' +
          'để sắp xếp cuộc gọi khảo sát 15 phút.</p>' +
      '</div>';
  }

  // ── MONEY BARS (kinh tế một đơn hàng) ─────────────────────────
  const moneyBars = document.querySelectorAll('#money .mb .bar');
  if (moneyBars.length && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    moneyBars.forEach((b) => b.classList.add('prep'));
    const mio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.remove('prep'); mio.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    moneyBars.forEach((b) => mio.observe(b));
  }

  // ── STICKY CTA (mobile) ───────────────────────────────────────
  const stickyCta = document.getElementById('stickyCta');
  const heroEl = document.querySelector('.hero');
  const formEl = document.getElementById('dangky');

  if (stickyCta && heroEl && formEl && 'IntersectionObserver' in window) {
    let heroVisible = true, formVisible = false;
    const update = () => {
      const show = !heroVisible && !formVisible;
      stickyCta.classList.toggle('visible', show);
      stickyCta.setAttribute('aria-hidden', String(!show));
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === heroEl) heroVisible = entry.isIntersecting;
        if (entry.target === formEl) formVisible = entry.isIntersecting;
      });
      update();
    }, { threshold: 0.08 });
    obs.observe(heroEl);
    obs.observe(formEl);
    update();
  }

});
