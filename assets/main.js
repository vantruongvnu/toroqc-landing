/* ============================================================
   TORO — main.js
   No inline handlers (CSP-safe). All behaviour wired here.
   ── Sections: REVEAL · FORM · STICKY CTA ──
   ============================================================ */
'use strict';

// Set this once you deploy the Worker (see worker.js / README).
const TORO_ENDPOINT = 'https://bot-tro-ly-toro.luongvantruong-1611.workers.dev/api/leads';

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
        showFormSuccess(payload);
        return;
      }

      try {
        const res = await fetch(TORO_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        showFormSuccess(payload);
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

  function showFormSuccess(leadData) {
    const wrap = document.querySelector('.lark-body');
    if (!wrap) return;
    const shop = (leadData && leadData.shop_name) || 'quán';
    const owner = (leadData && leadData.owner_name) || '';
    const zaloMsg = encodeURIComponent('Chào anh Trường, mình là ' + (owner || 'chủ quán') + ', vừa đăng ký khảo sát vận hành cho ' + shop + ' trên toroqc.com.');
    const zaloUrl = 'https://zalo.me/0969418898?text=' + zaloMsg;

    wrap.innerHTML =
      '<div class="form-success" role="alert" aria-live="polite" style="text-align:center;padding:24px 12px;">' +
        '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" style="margin:0 auto;display:block;">' +
          '<circle cx="32" cy="32" r="31" stroke="var(--teal-500)" stroke-width="2"></circle>' +
          '<path d="M20 32l9 9 15-16" stroke="var(--teal-500)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="40" stroke-dashoffset="40" style="animation:draw-check .6s .2s ease forwards"></path>' +
        '</svg>' +
        '<h3 style="margin-top:16px;font-size:20px;font-weight:800;color:var(--charcoal-900);">Đã nhận thông tin khảo sát!</h3>' +
        '<p style="margin:8px 0 18px;font-size:14.5px;color:var(--steam-600);line-height:1.6;">TORO sẽ liên hệ trong 24 giờ để trao đổi phương án tối ưu vận hành cho <strong>' + (shop.replace(/</g, '&lt;')) + '</strong>.</p>' +
        '<div style="background:var(--teal-100);border:1px solid var(--teal-200);border-radius:10px;padding:16px;max-width:440px;margin:0 auto 16px;text-align:center;">' +
          '<div style="font-size:13.5px;font-weight:700;color:var(--teal-700);margin-bottom:8px;">⚡ Muốn trao đổi ngay không cần chờ?</div>' +
          '<a href="' + zaloUrl + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;justify-content:center;background:var(--saffron-500);color:var(--charcoal-900);font-weight:700;font-size:14.5px;padding:12px 18px;border-radius:6px;text-decoration:none;width:100%;box-sizing:border-box;">' +
            'Nhắn Zalo trực tiếp với anh Trường (Founder) →' +
          '</a>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--steam-500);">Hotline / Zalo: <strong>0969.418.898</strong></div>' +
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
