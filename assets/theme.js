/* ==========================================================================
   XILVENO THEME — theme.js
   Core interactions: header, announcement bar, mobile nav, hero slideshow,
   FAQ accordion, tabs, sticky ATC, search drawer, overlay
   ========================================================================== */

'use strict';

// ─── Utility helpers ────────────────────────────────────────────────────────

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
const off = (el, ev, fn) => el && el.removeEventListener(ev, fn);
const emit = (el, name, detail = {}) => el && el.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));

function debounce(fn, ms = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function formatMoney(cents) {
  const amount = (cents / 100).toFixed(2);
  return window.Shopify?.currency?.active
    ? `${window.Shopify.currency.active} ${amount}`
    : `$${amount}`;
}

// ─── Focus trap for modals/drawers ─────────────────────────────────────────

function trapFocus(el) {
  const focusables = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
  const items = [...el.querySelectorAll(focusables)].filter(e => !e.closest('[inert]'));
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
  }
  on(el, 'keydown', handler);
  items[0].focus();
  return () => off(el, 'keydown', handler);
}

// ─── Overlay ────────────────────────────────────────────────────────────────

const Overlay = {
  el: null,
  init() {
    this.el = $('#overlay');
    on(this.el, 'click', () => this.hide());
  },
  show() { this.el?.classList.add('is-visible'); document.body.classList.add('no-scroll'); },
  hide() {
    this.el?.classList.remove('is-visible');
    document.body.classList.remove('no-scroll');
    emit(document, 'xilveno:overlay:hide');
  }
};

// ─── Header scroll behaviour ─────────────────────────────────────────────────

const Header = {
  el: null,
  init() {
    this.el = $('.site-header');
    if (!this.el) return;
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      this.el.classList.toggle('site-header--scrolled', y > 10);
      last = y;
    };
    on(window, 'scroll', onScroll, { passive: true });
    onScroll();
  }
};

// ─── Announcement Bar ────────────────────────────────────────────────────────

class AnnouncementBar {
  constructor(el) {
    this.el = el;
    this.track = $('.announcement-bar__track', el);
    this.slides = $$('.announcement-bar__slide', el);
    this.current = 0;
    this.timer = null;
    this.interval = parseInt(el.dataset.interval || 4000);

    if (this.slides.length > 1) this.start();

    const closeBtn = $('.announcement-bar__close', el);
    on(closeBtn, 'click', () => {
      this.stop();
      el.style.display = 'none';
      try { sessionStorage.setItem('xilveno_announcement_closed', '1'); } catch(e) {}
    });
  }

  goTo(idx) {
    this.current = (idx + this.slides.length) % this.slides.length;
    this.track.style.transform = `translateX(-${this.current * 100}%)`;
  }

  start() {
    this.timer = setInterval(() => this.goTo(this.current + 1), this.interval);
  }

  stop() { clearInterval(this.timer); }
}

// ─── Mobile Navigation ───────────────────────────────────────────────────────

const MobileNav = {
  drawer: null,
  releaseFocus: null,
  init() {
    this.drawer = $('.mobile-nav');
    if (!this.drawer) return;

    const openBtn = $('.header-burger');
    const closeBtn = $('.mobile-nav__close');

    on(openBtn, 'click', () => this.open());
    on(closeBtn, 'click', () => this.close());
    on(document, 'keydown', e => { if (e.key === 'Escape' && this.drawer.classList.contains('is-open')) this.close(); });
    on(document, 'xilveno:overlay:hide', () => this.close());
  },
  open() {
    this.drawer.classList.add('is-open');
    this.drawer.removeAttribute('inert');
    Overlay.show();
    this.releaseFocus = trapFocus(this.drawer);
    emit(this.drawer, 'xilveno:nav:opened');
  },
  close() {
    this.drawer.classList.remove('is-open');
    this.drawer.setAttribute('inert', '');
    Overlay.hide();
    this.releaseFocus?.();
  }
};

// ─── Hero Slideshow ──────────────────────────────────────────────────────────

class HeroSlideshow {
  constructor(el) {
    this.el = el;
    this.track = $('.hero-slideshow__track', el);
    this.slides = $$('.hero-slide', el);
    this.dots = $$('.hero-slideshow__dot', el);
    this.current = 0;
    this.count = this.slides.length;
    this.autoplay = el.dataset.autoplay !== 'false';
    this.interval = parseInt(el.dataset.interval || 5000);
    this.timer = null;
    this.startX = 0;
    this.isDragging = false;

    if (this.count < 2) return;

    on($('.hero-slideshow__arrow--prev', el), 'click', () => { this.prev(); this.resetTimer(); });
    on($('.hero-slideshow__arrow--next', el), 'click', () => { this.next(); this.resetTimer(); });
    this.dots.forEach((d, i) => on(d, 'click', () => { this.goTo(i); this.resetTimer(); }));

    // Touch/swipe
    on(this.track, 'touchstart', e => { this.startX = e.touches[0].clientX; }, { passive: true });
    on(this.track, 'touchend', e => {
      const dx = e.changedTouches[0].clientX - this.startX;
      if (Math.abs(dx) > 50) { dx < 0 ? this.next() : this.prev(); this.resetTimer(); }
    }, { passive: true });

    // Pause on hover
    on(el, 'mouseenter', () => this.stop());
    on(el, 'mouseleave', () => this.autoplay && this.start());

    // Keyboard
    on(el, 'keydown', e => {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    this.update();
    if (this.autoplay) this.start();
  }

  goTo(idx) {
    this.current = (idx + this.count) % this.count;
    this.update();
  }

  next() { this.goTo(this.current + 1); }
  prev() { this.goTo(this.current - 1); }

  update() {
    this.track.style.transform = `translateX(-${this.current * 100}%)`;
    this.dots.forEach((d, i) => d.classList.toggle('is-active', i === this.current));
    this.slides.forEach((s, i) => s.setAttribute('aria-hidden', i !== this.current));
  }

  start() { this.timer = setInterval(() => this.next(), this.interval); }
  stop() { clearInterval(this.timer); }
  resetTimer() { this.stop(); if (this.autoplay) this.start(); }
}

// ─── FAQ Accordion ───────────────────────────────────────────────────────────

function initFAQ() {
  $$('.faq-question').forEach(btn => {
    on(btn, 'click', () => {
      const answer = $('#' + btn.getAttribute('aria-controls'));
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      // Close others
      $$('.faq-question[aria-expanded="true"]').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          const a = $('#' + other.getAttribute('aria-controls'));
          a?.classList.remove('is-open');
        }
      });
      btn.setAttribute('aria-expanded', String(!expanded));
      answer?.classList.toggle('is-open', !expanded);
    });
  });
}

// ─── Product Tabs ─────────────────────────────────────────────────────────────

function initTabs() {
  $$('.tabs__btn').forEach(btn => {
    on(btn, 'click', () => {
      const container = btn.closest('[data-tabs]');
      $$('.tabs__btn', container).forEach(b => b.classList.remove('is-active'));
      $$('.tabs__panel', container).forEach(p => p.classList.remove('is-active'));
      btn.classList.add('is-active');
      const panel = $('#' + btn.getAttribute('aria-controls'));
      panel?.classList.add('is-active');
    });
  });
}

// ─── Filter groups ────────────────────────────────────────────────────────────

function initFilters() {
  $$('.filter-group__toggle').forEach(btn => {
    on(btn, 'click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const opts = btn.nextElementSibling;
      opts?.classList.toggle('is-open', !expanded);
    });
    // Open first few by default
    if (btn.closest('.filter-group:nth-child(-n+3)')) {
      btn.click();
    }
  });
}

// ─── Search Drawer ───────────────────────────────────────────────────────────

const SearchDrawer = {
  drawer: null,
  input: null,
  releaseFocus: null,
  init() {
    this.drawer = $('.search-drawer');
    if (!this.drawer) return;
    this.input = $('.search-input', this.drawer);
    const openBtns = $$('[data-search-open]');
    const closeBtn = $('.search-drawer__close', this.drawer);
    openBtns.forEach(b => on(b, 'click', () => this.open()));
    on(closeBtn, 'click', () => this.close());
    on(document, 'keydown', e => { if (e.key === 'Escape') this.close(); });
  },
  open() {
    this.drawer.classList.add('is-open');
    Overlay.show();
    this.releaseFocus = trapFocus(this.drawer);
    setTimeout(() => this.input?.focus(), 100);
  },
  close() {
    this.drawer.classList.remove('is-open');
    Overlay.hide();
    this.releaseFocus?.();
  }
};

// ─── Gallery thumbnails ──────────────────────────────────────────────────────

function initProductGallery() {
  const gallery = $('.product-gallery');
  if (!gallery) return;
  const mainImg = $('.product-gallery__main-image', gallery);
  const thumbs = $$('.product-gallery__thumb', gallery);

  thumbs.forEach((thumb, i) => {
    on(thumb, 'click', () => {
      const src = thumb.dataset.src;
      const srcset = thumb.dataset.srcset;
      if (mainImg && src) {
        mainImg.src = src;
        if (srcset) mainImg.srcset = srcset;
        mainImg.alt = thumb.dataset.alt || '';
      }
      thumbs.forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
    });
  });
}

// ─── Variant selector ─────────────────────────────────────────────────────────

function initVariantSelector() {
  const form = $('form[data-product-form]');
  if (!form) return;

  const swatches = $$('.swatch', form);
  const priceEl = $('.product-info__price', document);
  const comparePriceEl = $('.product-info__price--compare', document);
  const stockEl = $('.product-info__stock', document);
  const stockDot = $('.stock-dot', document);
  const productData = JSON.parse($('[data-product-json]')?.textContent || '{}');

  swatches.forEach(swatch => {
    on(swatch, 'click', () => {
      const optionIndex = parseInt(swatch.dataset.optionIndex);
      const value = swatch.dataset.value;
      const option = swatch.dataset.option;

      // Update swatches in same group
      $$(`.swatch[data-option="${option}"]`).forEach(s => s.classList.remove('is-active'));
      swatch.classList.add('is-active');

      // Update hidden select
      const select = $(`select[data-option-index="${optionIndex}"]`, form);
      if (select) {
        select.value = value;
        select.dispatchEvent(new Event('change'));
      }

      // Find matching variant
      updateVariantState(form, productData);
    });
  });
}

function updateVariantState(form, productData) {
  if (!productData.variants) return;
  const selectedOptions = $$('select[data-option-index]', form).map(s => s.value);

  const variant = productData.variants.find(v =>
    v.options.every((opt, i) => opt === selectedOptions[i])
  );

  if (!variant) return;

  // Update price
  const priceEl = $('.product-info__price');
  const comparePriceEl = $('.product-info__price--compare');
  if (priceEl) priceEl.textContent = formatMoney(variant.price);
  if (comparePriceEl && variant.compare_at_price > variant.price) {
    comparePriceEl.textContent = formatMoney(variant.compare_at_price);
    comparePriceEl.style.display = '';
  } else if (comparePriceEl) {
    comparePriceEl.style.display = 'none';
  }

  // Update stock
  const stockEl = $('.product-info__stock');
  const dot = stockEl?.querySelector('.stock-dot');
  if (stockEl) {
    if (!variant.available) {
      stockEl.querySelector('[data-stock-text]').textContent = 'Out of stock';
      dot?.classList.remove('stock-dot--in', 'stock-dot--low');
      dot?.classList.add('stock-dot--out');
    } else if (variant.inventory_quantity > 0 && variant.inventory_quantity <= 10 && variant.inventory_management) {
      stockEl.querySelector('[data-stock-text]').textContent = `Only ${variant.inventory_quantity} left`;
      dot?.classList.remove('stock-dot--in', 'stock-dot--out');
      dot?.classList.add('stock-dot--low');
    } else {
      stockEl.querySelector('[data-stock-text]').textContent = 'In stock';
      dot?.classList.remove('stock-dot--low', 'stock-dot--out');
      dot?.classList.add('stock-dot--in');
    }
  }

  // Update ATC button
  const atcBtn = $('[data-atc-btn]');
  if (atcBtn) {
    atcBtn.disabled = !variant.available;
    atcBtn.querySelector('.btn__text').textContent = variant.available ? 'Add to cart' : 'Sold out';
  }

  // Update hidden variant input
  const variantInput = $('[name="id"]', form);
  if (variantInput) variantInput.value = variant.id;

  // Update URL without reload
  const url = new URL(window.location);
  url.searchParams.set('variant', variant.id);
  window.history.replaceState({}, '', url.toString());

  emit(document, 'xilveno:variant:changed', { variant });
}

// ─── Quantity stepper ─────────────────────────────────────────────────────────

function initQuantity() {
  $$('[data-quantity-wrap]').forEach(wrap => {
    const input = $('input[type="number"]', wrap);
    const dec = $('[data-qty-dec]', wrap);
    const inc = $('[data-qty-inc]', wrap);

    on(dec, 'click', () => {
      const v = parseInt(input.value) || 1;
      if (v > 1) input.value = v - 1;
    });
    on(inc, 'click', () => {
      const v = parseInt(input.value) || 1;
      input.value = v + 1;
    });
  });
}

// ─── Sticky ATC ──────────────────────────────────────────────────────────────

function initStickyATC() {
  const sticky = $('.sticky-atc');
  const atcBtn = $('[data-atc-btn]');
  if (!sticky || !atcBtn) return;

  const observer = new IntersectionObserver(
    ([entry]) => sticky.classList.toggle('is-visible', !entry.isIntersecting),
    { threshold: 0 }
  );
  observer.observe(atcBtn);

  const stickyBtn = $('.sticky-atc__btn');
  on(stickyBtn, 'click', () => atcBtn.click());
}

// ─── Scroll animations (IntersectionObserver) ────────────────────────────────

function initScrollAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const els = $$('.animate-on-scroll');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach(el => observer.observe(el));
}

// ─── Recently Viewed (localStorage) ─────────────────────────────────────────

const RecentlyViewed = {
  key: 'xilveno_recently_viewed',
  max: 12,
  get() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch(e) { return []; } },
  add(product) {
    let items = this.get().filter(p => p.id !== product.id);
    items.unshift(product);
    items = items.slice(0, this.max);
    try { localStorage.setItem(this.key, JSON.stringify(items)); } catch(e) {}
  },
  track() {
    const el = $('[data-product-json]');
    if (!el) return;
    try {
      const p = JSON.parse(el.textContent);
      this.add({
        id: p.id,
        title: p.title,
        url: p.url,
        price: p.price,
        image: p.featured_image?.src,
        vendor: p.vendor
      });
    } catch(e) {}
  }
};

// ─── Collapsible (generic) ────────────────────────────────────────────────────

function initCollapsibles() {
  $$('[data-collapsible-trigger]').forEach(btn => {
    on(btn, 'click', () => {
      const target = $('#' + btn.dataset.collapsibleTrigger);
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      target?.classList.toggle('is-open', !open);
    });
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  Overlay.init();
  Header.init();
  MobileNav.init();
  SearchDrawer.init();
  initFAQ();
  initTabs();
  initFilters();
  initProductGallery();
  initVariantSelector();
  initQuantity();
  initStickyATC();
  initScrollAnimations();
  initCollapsibles();
  RecentlyViewed.track();

  // Announcement bars
  $$('.announcement-bar[data-autoplay]').forEach(el => new AnnouncementBar(el));

  // Hero slideshows
  $$('.hero-slideshow').forEach(el => new HeroSlideshow(el));
});

window.Xilveno = { formatMoney, RecentlyViewed };
