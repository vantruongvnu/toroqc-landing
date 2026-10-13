/* ============================================================
   TORO — main.js
   No inline handlers (CSP-safe). All behaviour wired here.
   ── Sections: REVEAL · FORM · STICKY CTA ──
   ============================================================ */
'use strict';

// Set this once you deploy the Worker (see worker.js / README).
const TORO_ENDPOINT = 'https://bot-tro-ly-toro.luongvantruong-1611.workers.dev/api/leads';

document.addEventListener('DOMContentLoaded', () => {
  // ── TURNSTILE EXPLICIT RENDER & STATE MANAGEMENT ──────────────
  const TURNSTILE_SITE_KEY = window.TURNSTILE_SITE_KEY || '0x4AAAAAAFVvvNYVPbOJr63A'; // Test Key Cloudflare (luôn pass)
  let currentTurnstileToken = '';
  let turnstileWidgetId = null;

  function initTurnstile() {
    const container = document.getElementById('turnstile-container');
    if (!container) return;

    if (window.turnstile && typeof window.turnstile.render === 'function') {
      try {
        if (turnstileWidgetId === null) {
          turnstileWidgetId = window.turnstile.render(container, {
            sitekey: TURNSTILE_SITE_KEY,
            theme: 'light',
            callback: function (token) {
              currentTurnstileToken = token;
            },
            'expired-callback': function () {
              currentTurnstileToken = '';
              resetTurnstile();
            },
            'error-callback': function () {
              currentTurnstileToken = '';
              resetTurnstile();
            },
          });
        }
      } catch (err) {
        console.warn('[toro] turnstile render error:', err);
      }
    } else {
      setTimeout(initTurnstile, 250);
    }
  }

  function resetTurnstile() {
    currentTurnstileToken = '';
    if (turnstileWidgetId !== null && window.turnstile && typeof window.turnstile.reset === 'function') {
      try {
        window.turnstile.reset(turnstileWidgetId);
      } catch (e) {
        console.warn('[toro] turnstile reset error:', e);
      }
    }
  }

  initTurnstile();

  // ── A/B TESTING ENGINE (CRO VARIANT A vs B) ───────────────────
  let activeVariant = 'B'; // Ưu tiên kiểm nghiệm Biến thể B (Tinh gọn 2 ô)

  function initABTesting() {
    const urlParams = new URLSearchParams(window.location.search);
    let vParam = urlParams.get('v') || urlParams.get('variant');
    if (vParam) {
      vParam = vParam.toUpperCase();
      activeVariant = (vParam === 'A') ? 'A' : 'B';
      try { localStorage.setItem('toro_form_variant', activeVariant); } catch(e){}
    } else {
      try {
        const stored = localStorage.getItem('toro_form_variant');
        if (stored === 'A' || stored === 'B') {
          activeVariant = stored;
        } else {
          // Phân phối ngẫu nhiên 50/50 cho khách vãng lai
          activeVariant = Math.random() < 0.5 ? 'A' : 'B';
          localStorage.setItem('toro_form_variant', activeVariant);
        }
      } catch(e) {
        activeVariant = 'B';
      }
    }

    renderVariantUI(activeVariant);

    // Kích hoạt nút chuyển đổi nhanh trên giao diện
    const switchA = document.getElementById('switch-variant-a');
    const switchB = document.getElementById('switch-variant-b');
    if (switchA) {
      switchA.addEventListener('click', (e) => {
        e.preventDefault();
        activeVariant = 'A';
        try { localStorage.setItem('toro_form_variant', 'A'); } catch(err){}
        renderVariantUI('A');
      });
    }
    if (switchB) {
      switchB.addEventListener('click', (e) => {
        e.preventDefault();
        activeVariant = 'B';
        try { localStorage.setItem('toro_form_variant', 'B'); } catch(err){}
        renderVariantUI('B');
      });
    }
  }

  function renderVariantUI(v) {
    const extraFields = document.getElementById('extra-fields');
    const formBadge = document.getElementById('form-badge');
    const formTitle = document.getElementById('form-title');
    const formDesc = document.getElementById('form-desc');
    const formCardTitle = document.getElementById('form-card-title');
    const submitBtn = document.getElementById('form-submit-btn');
    const switchA = document.getElementById('switch-variant-a');
    const switchB = document.getElementById('switch-variant-b');

    if (switchA && switchB) {
      if (v === 'A') {
        switchA.style.fontWeight = '700';
        switchA.style.color = 'var(--charcoal-900)';
        switchB.style.fontWeight = '400';
        switchB.style.color = 'var(--teal-600)';
      } else {
        switchB.style.fontWeight = '700';
        switchB.style.color = 'var(--charcoal-900)';
        switchA.style.fontWeight = '400';
        switchA.style.color = 'var(--teal-600)';
      }
    }

    if (v === 'B') {
      // Biến thể B: Tinh gọn 2 trường (Tên quán + SĐT Zalo)
      if (extraFields) extraFields.style.display = 'none';
      if (formBadge) formBadge.textContent = 'Khảo sát nhanh 30 giây';
      if (formTitle) formTitle.textContent = 'Nhận phân tích vận hành & margin món';
      if (formDesc) formDesc.textContent = 'Chỉ cần để lại tên quán và số Zalo — Toro gửi ngay bảng phân tích chi phí sàn và biên lợi nhuận sau 15 phút.';
      if (formCardTitle) formCardTitle.textContent = 'Khảo sát nhanh (2 thông tin)';
      if (submitBtn) submitBtn.textContent = 'Nhận phân tích miễn phí qua Zalo →';
    } else {
      // Biến thể A: Gốc 5 trường
      if (extraFields) extraFields.style.display = 'grid';
      if (formBadge) formBadge.textContent = 'Đăng ký tư vấn';
      if (formTitle) formTitle.textContent = 'Nhận khảo sát vận hành miễn phí';
      if (formDesc) formDesc.textContent = 'Để lại thông tin quán — đội TORO liên hệ trong 24h, chốt mục tiêu 30 ngày theo đúng quy mô của bạn.';
      if (formCardTitle) formCardTitle.textContent = 'Form đăng ký quán';
      if (submitBtn) submitBtn.textContent = 'Gửi đăng ký →';
    }
  }

  initABTesting();



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

      // Validate tên quán (bắt buộc cả 2 biến thể)
      const shopInput = document.getElementById('shop-name');
      const shopName = (shopInput && shopInput.value || '').trim();
      if (!shopName) {
        showFieldError(shopInput, 'Vui lòng nhập tên quán ăn / đồ uống của bạn.');
        shopInput.focus();
        return;
      }

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

      const turnstileEl = form.querySelector('[name="cf-turnstile-response"]');
      const turnstileToken = (turnstileEl && turnstileEl.value) || (window.turnstile && typeof window.turnstile.getResponse === 'function' ? window.turnstile.getResponse() : '') || '';

      const payload = {
        owner_name: val('owner-name'),
        owner_phone: phone,
        shop_name: shopName,
        branch_count: val('branch-count') || '1 quán',
        platform: val('platform-select') || 'both',
        turnstile_token: currentTurnstileToken || (form.querySelector('[name="cf-turnstile-response"]') && form.querySelector('[name="cf-turnstile-response"]').value) || '',
        source: 'toroqc.com [Biến thể ' + (activeVariant === 'B' ? 'B (Tinh gọn)' : 'A (Đầy đủ)') + ']',
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
        if (!res.ok) {
          resetTurnstile();
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || ('HTTP ' + res.status);
          throw new Error(errMsg);
        }
        showFormSuccess(payload);
      } catch (err) {
        console.error('[toro] submit failed:', err);
        resetTurnstile();
        showFieldError(submitBtn, 'Có lỗi khi gửi (' + (err.message || 'vui lòng thử lại') + ') — hoặc nhắn Zalo.');
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
