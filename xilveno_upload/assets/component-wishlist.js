/* ==========================================================================
   XILVENO — component-wishlist.js
   localStorage wishlist — works without an app on one device/browser.
   For cross-device sync, connect a third-party wishlist app.
   ========================================================================== */

'use strict';

const Wishlist = {
  key: 'xilveno_wishlist',

  get() {
    try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch(e) { return []; }
  },

  save(items) {
    try { localStorage.setItem(this.key, JSON.stringify(items)); } catch(e) {}
  },

  has(id) { return this.get().some(item => item.id === id); },

  add(product) {
    const items = this.get().filter(i => i.id !== product.id);
    items.unshift(product);
    this.save(items);
    document.dispatchEvent(new CustomEvent('xilveno:wishlist:updated', { detail: { items } }));
  },

  remove(id) {
    const items = this.get().filter(i => i.id !== id);
    this.save(items);
    document.dispatchEvent(new CustomEvent('xilveno:wishlist:updated', { detail: { items } }));
  },

  toggle(product) {
    if (this.has(product.id)) { this.remove(product.id); return false; }
    this.add(product); return true;
  },

  count() { return this.get().length; }
};

// ─── Button state sync ───────────────────────────────────────────────────────

function syncWishlistButtons() {
  document.querySelectorAll('[data-wishlist-btn]').forEach(btn => {
    const id = parseInt(btn.dataset.wishlistBtn);
    btn.classList.toggle('is-wishlisted', Wishlist.has(id));
    btn.setAttribute('aria-label', Wishlist.has(id) ? 'Remove from wishlist' : 'Save to wishlist');
    const icon = btn.querySelector('[data-wishlist-icon]');
    if (icon) icon.setAttribute('fill', Wishlist.has(id) ? 'currentColor' : 'none');
  });
  // Update count badges
  document.querySelectorAll('[data-wishlist-count]').forEach(el => {
    el.textContent = Wishlist.count();
    el.dataset.count = Wishlist.count();
  });
}

// ─── Handle button clicks ─────────────────────────────────────────────────────

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-wishlist-btn]');
  if (!btn) return;
  e.preventDefault();
  const id = parseInt(btn.dataset.wishlistBtn);
  const product = {
    id,
    title: btn.dataset.wishlistTitle,
    url: btn.dataset.wishlistUrl,
    price: parseInt(btn.dataset.wishlistPrice || '0'),
    image: btn.dataset.wishlistImage,
    vendor: btn.dataset.wishlistVendor || ''
  };
  const added = Wishlist.toggle(product);

  // Micro-animation
  btn.classList.add('is-animating');
  setTimeout(() => btn.classList.remove('is-animating'), 300);
  syncWishlistButtons();

  // Toast notification
  showWishlistToast(added ? `Saved to wishlist` : `Removed from wishlist`);
});

// ─── Toast ───────────────────────────────────────────────────────────────────

function showWishlistToast(msg) {
  let toast = document.querySelector('.wishlist-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'wishlist-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    const style = document.createElement('style');
    style.textContent = `
      .wishlist-toast {
        position: fixed;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%) translateY(12px);
        background: var(--color-fg);
        color: var(--color-bg);
        padding: 0.6rem 1.25rem;
        border-radius: var(--radius-full);
        font-size: 0.8125rem;
        font-weight: 500;
        z-index: 600;
        opacity: 0;
        transition: opacity 0.2s, transform 0.2s;
        white-space: nowrap;
        pointer-events: none;
      }
      .wishlist-toast.is-visible { opacity: 1; transform: translateX(-50%) translateY(0); }
      @media (max-width: 768px) { .wishlist-toast { bottom: 5rem; } }
    `;
    document.head.appendChild(style);
  }
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

// ─── Wishlist page renderer ───────────────────────────────────────────────────

function renderWishlistPage() {
  const grid = document.querySelector('[data-wishlist-grid]');
  if (!grid) return;

  const items = Wishlist.get();
  if (!items.length) {
    grid.innerHTML = `
      <div class="wishlist-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h2 style="font-size:1.25rem;font-weight:500;margin-bottom:0.5rem">Your wishlist is empty</h2>
        <p style="color:var(--color-fg-muted);font-size:0.875rem;margin-bottom:1.5rem">Save items you love and find them here.</p>
        <a href="/collections/all" class="btn btn--primary">Explore products</a>
      </div>`;
    return;
  }

  grid.innerHTML = `<div class="wishlist-grid">${items.map(item => `
    <div class="product-card" data-wishlist-item="${item.id}">
      <div class="product-card__media">
        <a href="${item.url}" class="product-card__image-link">
          ${item.image ? `<img src="${item.image}?width=400" alt="${item.title}" class="product-card__image product-card__image--primary" loading="lazy" width="400" height="533">` : '<div class="product-card__image product-card__image--primary" style="background:var(--color-surface);aspect-ratio:3/4"></div>'}
        </a>
      </div>
      <div class="product-card__info">
        ${item.vendor ? `<p class="product-card__vendor">${item.vendor}</p>` : ''}
        <a href="${item.url}" class="product-card__title">${item.title}</a>
        <div class="product-card__price-wrap">
          <span class="product-card__price">${window.Xilveno?.formatMoney(item.price) || '$' + (item.price/100).toFixed(2)}</span>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
          <a href="${item.url}" class="btn btn--primary btn--sm" style="flex:1">View product</a>
          <button class="btn btn--ghost btn--sm btn--icon" onclick="Wishlist.remove(${item.id});renderWishlistPage();" aria-label="Remove from wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
    </div>`).join('')}
  </div>`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  syncWishlistButtons();
  renderWishlistPage();
  document.addEventListener('xilveno:wishlist:updated', () => {
    syncWishlistButtons();
    renderWishlistPage();
  });
});

window.Wishlist = Wishlist;
window.renderWishlistPage = renderWishlistPage;
