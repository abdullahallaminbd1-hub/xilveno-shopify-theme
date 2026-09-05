/* ==========================================================================
   XILVENO — component-predictive-search.js
   Uses Shopify's /search/suggest.json endpoint — real results, no app needed.
   ========================================================================== */

'use strict';

class PredictiveSearch {
  constructor(input, resultsContainer) {
    this.input = input;
    this.results = resultsContainer;
    this.query = '';
    this.cache = {};
    this.abortController = null;

    this.input.addEventListener('input', this.debounce(() => this.onInput(), 280));
    this.input.addEventListener('keydown', e => this.onKeydown(e));
    this.input.addEventListener('focus', () => { if (this.query) this.show(); });
    document.addEventListener('click', e => {
      if (!e.target.closest('[data-search-drawer]') && !e.target.closest('.search-drawer')) this.hide();
    });
  }

  onInput() {
    const q = this.input.value.trim();
    if (!q || q.length < 2) { this.hide(); return; }
    this.query = q;
    this.fetch(q);
  }

  onKeydown(e) {
    if (e.key === 'Escape') this.hide();
    if (e.key === 'Enter' && this.query) {
      window.location.href = `/search?q=${encodeURIComponent(this.query)}&type=product`;
    }
  }

  async fetch(q) {
    if (this.cache[q]) { this.render(this.cache[q]); return; }
    this.abortController?.abort();
    this.abortController = new AbortController();
    try {
      const url = `/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product,collection,page&resources[limit]=4&resources[options][unavailable_products]=last`;
      const res = await fetch(url, { signal: this.abortController.signal, headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      this.cache[q] = data;
      this.render(data);
    } catch(e) {
      if (e.name !== 'AbortError') console.error('Search error:', e);
    }
  }

  render(data) {
    const products = data?.resources?.results?.products || [];
    const pages = data?.resources?.results?.pages || [];
    const collections = data?.resources?.results?.collections || [];

    if (!products.length && !pages.length && !collections.length) {
      this.results.innerHTML = `<div class="search-empty">No results for "<strong>${this.escapeHtml(this.query)}</strong>"</div>`;
      this.show();
      return;
    }

    let html = '';

    if (products.length) {
      html += `<div class="search-results__section">
        <p class="search-results__heading">Products</p>
        ${products.map(p => `
          <a href="${p.url}" class="search-product-item">
            <div class="search-product-item__image">
              ${p.image ? `<img src="${p.image}" alt="${this.escapeHtml(p.title)}" width="56" height="56" loading="lazy">` : ''}
            </div>
            <div class="search-product-item__info">
              <p class="search-product-item__title">${this.highlight(p.title, this.query)}</p>
              <p class="search-product-item__price">${p.price ? `From ${this.formatMoney(parseInt(p.price) * 100)}` : ''}</p>
            </div>
          </a>`).join('')}
      </div>`;
    }

    if (collections.length) {
      html += `<div class="search-results__section">
        <p class="search-results__heading">Collections</p>
        ${collections.map(c => `<a href="${c.url}" class="search-suggestion">${this.highlight(c.title, this.query)}</a>`).join('')}
      </div>`;
    }

    html += `<div class="search-results__section">
      <a href="/search?q=${encodeURIComponent(this.query)}&type=product" class="btn btn--ghost btn--sm btn--full" style="margin-top:0.25rem">
        View all results for "${this.escapeHtml(this.query)}"
      </a>
    </div>`;

    this.results.innerHTML = html;
    this.show();
  }

  show() { this.results.style.display = 'block'; }
  hide() { this.results.style.display = 'none'; }

  highlight(text, query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.escapeHtml(text).replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:var(--color-surface-2);border-radius:2px;">$1</mark>');
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  formatMoney(cents) { return window.Xilveno?.formatMoney(cents) || `$${(cents/100).toFixed(2)}`; }

  debounce(fn, ms) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('.search-input');
  const results = document.querySelector('.search-results');
  if (input && results) new PredictiveSearch(input, results);
});
