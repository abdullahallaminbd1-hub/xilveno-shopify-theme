/* ==========================================================================
   XILVENO — component-cart.js
   AJAX cart: add to cart, drawer, qty update, remove, free shipping bar
   Uses Shopify Cart AJAX API
   ========================================================================== */

'use strict';

const CartAPI = {
  async get() {
    const r = await fetch('/cart.js', { headers: { 'Content-Type': 'application/json' } });
    return r.json();
  },
  async add(items) {
    const r = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.description || 'Error adding to cart'); }
    return r.json();
  },
  async change(id, quantity) {
    const r = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity })
    });
    return r.json();
  },
  async update(updates) {
    const r = await fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    return r.json();
  }
};

// ─── Cart Drawer ─────────────────────────────────────────────────────────────

const CartDrawer = {
  el: null,
  bodyEl: null,
  releaseFocus: null,

  init() {
    this.el = document.querySelector('.cart-drawer');
    if (!this.el) return;
    this.bodyEl = this.el.querySelector('.cart-drawer__body');

    // Open triggers
    document.querySelectorAll('[data-cart-open]').forEach(btn => {
      btn.addEventListener('click', e => { e.preventDefault(); this.open(); });
    });

    // Close
    const closeBtn = this.el.querySelector('.cart-drawer__close');
    closeBtn?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.el.classList.contains('is-open')) this.close();
    });
    document.addEventListener('xilveno:overlay:hide', () => this.close());

    // Cart events
    document.addEventListener('xilveno:cart:updated', () => this.refresh());

    this.initItems();
    this.initFreeShipping();
    this.initDiscountField();
    this.updateCount();
  },

  open() {
    this.el.classList.add('is-open');
    this.el.removeAttribute('inert');
    window.Overlay?.show();
    const closeBtn = this.el.querySelector('.cart-drawer__close');
    setTimeout(() => closeBtn?.focus(), 100);
  },

  close() {
    this.el.classList.remove('is-open');
    this.el.setAttribute('inert', '');
    window.Overlay?.hide();
  },

  async refresh() {
    try {
      const cart = await CartAPI.get();
      this.renderItems(cart);
      this.updateCount(cart.item_count);
      this.updateFreeShipping(cart.total_price);
      this.updateTotals(cart);
    } catch(e) { console.error('Cart refresh failed:', e); }
  },

  renderItems(cart) {
    const body = this.bodyEl;
    if (!body) return;

    if (!cart.item_count) {
      body.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M3 6h2l3.6 7.59L7.5 15a1 1 0 0 0 1 1H19m-2 2a1 1 0 1 0 2 0 1 1 0 0 0-2 0m-7 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0M1 1h3.27L5.64 8M5.64 8L8 14h10l2.73-10H5.64z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="cart-empty__title">Your cart is empty</p>
          <p class="cart-empty__text">Add something beautiful to get started.</p>
          <a href="/collections/all" class="btn btn--primary btn--sm" style="margin-top:0.5rem">Shop now</a>
        </div>`;
      return;
    }

    const items = cart.items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <div class="cart-item__image">
          <a href="${item.url}">
            <img src="${item.image ? item.image.replace(/\.\w+$/, m => `_80x80${m}`) : ''}" alt="${item.product_title}" loading="lazy" width="80" height="80">
          </a>
        </div>
        <div class="cart-item__details">
          <a href="${item.url}" class="cart-item__title">${item.product_title}</a>
          ${item.variant_title && item.variant_title !== 'Default Title' ? `<p class="cart-item__variant">${item.variant_title}</p>` : ''}
          <div class="cart-item__row">
            <div class="cart-item__qty" data-qty-wrap>
              <button class="cart-item__qty-btn" data-qty-dec aria-label="Decrease quantity">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><rect x="2" y="6.5" width="10" height="1" rx="0.5"/></svg>
              </button>
              <input type="number" class="cart-item__qty-input" value="${item.quantity}" min="0" data-key="${item.key}" aria-label="Quantity">
              <button class="cart-item__qty-btn" data-qty-inc aria-label="Increase quantity">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M7.5 2a.5.5 0 0 0-1 0v4.5H2a.5.5 0 0 0 0 1h4.5V12a.5.5 0 0 0 1 0V7.5H12a.5.5 0 0 0 0-1H7.5V2z"/></svg>
              </button>
            </div>
            <span class="cart-item__price">${this.formatMoney(item.final_line_price)}</span>
          </div>
          <button class="cart-item__remove" data-key="${item.key}">Remove</button>
        </div>
      </div>`).join('');

    body.innerHTML = items;
    this.initItems();
  },

  initItems() {
    // Quantity controls
    this.el?.querySelectorAll('.cart-item').forEach(item => {
      const key = item.dataset.key;
      const input = item.querySelector('.cart-item__qty-input');
      const dec = item.querySelector('[data-qty-dec]');
      const inc = item.querySelector('[data-qty-inc]');
      const removeBtn = item.querySelector('.cart-item__remove');

      dec?.addEventListener('click', async () => {
        const v = Math.max(0, parseInt(input.value) - 1);
        input.value = v;
        await this.updateItem(key, v);
      });
      inc?.addEventListener('click', async () => {
        const v = parseInt(input.value) + 1;
        input.value = v;
        await this.updateItem(key, v);
      });
      input?.addEventListener('change', async () => {
        await this.updateItem(key, parseInt(input.value) || 0);
      });
      removeBtn?.addEventListener('click', async () => {
        item.style.opacity = '0.4';
        item.style.transition = 'opacity 0.2s';
        await this.updateItem(key, 0);
      });
    });
  },

  async updateItem(key, quantity) {
    try {
      const cart = await CartAPI.change(key, quantity);
      this.renderItems(cart);
      this.updateCount(cart.item_count);
      this.updateFreeShipping(cart.total_price);
      this.updateTotals(cart);
    } catch(e) { console.error('Cart update error:', e); }
  },

  updateCount(count) {
    document.querySelectorAll('.cart-count').forEach(el => {
      if (count !== undefined) {
        el.textContent = count > 99 ? '99+' : count;
        el.dataset.count = count;
      } else {
        CartAPI.get().then(cart => {
          el.textContent = cart.item_count > 99 ? '99+' : cart.item_count;
          el.dataset.count = cart.item_count;
        });
      }
    });
  },

  updateTotals(cart) {
    const totalEl = this.el?.querySelector('[data-cart-total]');
    if (totalEl) totalEl.textContent = this.formatMoney(cart.total_price);
  },

  initFreeShipping() {
    this.freeShippingThreshold = parseInt(
      document.querySelector('[data-free-shipping-threshold]')?.dataset.freeShippingThreshold || '0'
    ) * 100;
    if (!this.freeShippingThreshold) return;
    CartAPI.get().then(cart => this.updateFreeShipping(cart.total_price));
  },

  updateFreeShipping(totalCents) {
    const bar = document.querySelector('.free-shipping-bar');
    if (!bar || !this.freeShippingThreshold) return;
    const label = bar.querySelector('.free-shipping-bar__label');
    const fill = bar.querySelector('.free-shipping-bar__fill');
    const pct = Math.min(100, (totalCents / this.freeShippingThreshold) * 100);
    if (fill) fill.style.width = `${pct}%`;
    if (totalCents >= this.freeShippingThreshold) {
      bar.classList.add('free-shipping-bar--achieved');
      if (label) label.innerHTML = `<strong>🎉 You've unlocked free shipping!</strong>`;
    } else {
      bar.classList.remove('free-shipping-bar--achieved');
      const remaining = this.formatMoney(this.freeShippingThreshold - totalCents);
      if (label) label.innerHTML = `Spend <strong>${remaining}</strong> more for free shipping`;
    }
  },

  initDiscountField() {
    const form = this.el?.querySelector('[data-discount-form]');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const input = form.querySelector('input');
      if (!input?.value.trim()) return;
      // Shopify doesn't allow applying discount codes via AJAX Cart API
      // Best practice: redirect to checkout with discount applied
      window.location.href = `/checkout?discount=${encodeURIComponent(input.value.trim())}`;
    });
  },

  formatMoney(cents) {
    return window.Xilveno?.formatMoney(cents) || `$${(cents / 100).toFixed(2)}`;
  }
};

// ─── Add to Cart Form ─────────────────────────────────────────────────────────

class ProductForm {
  constructor(form) {
    this.form = form;
    this.btn = form.querySelector('[data-atc-btn]');
    this.btnText = this.btn?.querySelector('.btn__text');
    this.loading = form.querySelector('.product-atc-loading');

    form.addEventListener('submit', e => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.btn || this.btn.disabled) return;
    const variantId = this.form.querySelector('[name="id"]')?.value;
    const qty = parseInt(this.form.querySelector('[name="quantity"]')?.value || 1);
    if (!variantId) return;

    this.setLoading(true);
    try {
      await CartAPI.add([{ id: variantId, quantity: qty }]);
      this.setLoading(false);
      this.setSuccess();
      CartDrawer.open();
      document.dispatchEvent(new CustomEvent('xilveno:cart:updated'));
    } catch(err) {
      this.setLoading(false);
      this.setError(err.message);
    }
  }

  setLoading(state) {
    this.btn.disabled = state;
    this.loading?.classList.toggle('is-loading', state);
    if (this.btnText) this.btnText.style.opacity = state ? '0' : '1';
  }

  setSuccess() {
    if (!this.btnText) return;
    const orig = this.btnText.textContent;
    this.btnText.textContent = 'Added!';
    this.btn.style.background = 'var(--color-success)';
    this.btn.style.borderColor = 'var(--color-success)';
    setTimeout(() => {
      this.btnText.textContent = orig;
      this.btn.style.background = '';
      this.btn.style.borderColor = '';
    }, 1500);
  }

  setError(msg) {
    const errEl = this.form.querySelector('[data-atc-error]') || document.createElement('p');
    errEl.textContent = msg;
    errEl.className = 'field__error';
    errEl.dataset.atcError = '';
    this.form.appendChild(errEl);
    setTimeout(() => errEl.remove(), 4000);
  }
}

// ─── Quick Add ────────────────────────────────────────────────────────────────

document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-quick-add]');
  if (!btn) return;
  e.preventDefault();
  const variantId = btn.dataset.quickAdd;
  if (!variantId) return;
  btn.disabled = true;
  btn.textContent = 'Adding...';
  try {
    await CartAPI.add([{ id: variantId, quantity: 1 }]);
    btn.textContent = 'Added!';
    CartDrawer.open();
    document.dispatchEvent(new CustomEvent('xilveno:cart:updated'));
    setTimeout(() => { btn.textContent = 'Quick add'; btn.disabled = false; }, 1500);
  } catch(err) {
    btn.textContent = 'Try again';
    btn.disabled = false;
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  CartDrawer.init();
  document.querySelectorAll('form[data-product-form]').forEach(f => new ProductForm(f));
});

window.CartAPI = CartAPI;
window.CartDrawer = CartDrawer;
