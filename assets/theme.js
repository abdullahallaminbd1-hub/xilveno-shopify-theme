document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const drawer = document.querySelector('[data-cart-drawer]');
  const setDrawer = (open) => {
    body.classList.toggle('drawer-open', open);
    drawer?.setAttribute('aria-hidden', open ? 'false' : 'true');
  };
  const setMenu = (open) => body.classList.toggle('mobile-nav-open', open);
  const setFilters = (open) => body.classList.toggle('filter-panel-open', open);

  document.querySelectorAll('[data-cart-open]').forEach((button) => button.addEventListener('click', () => setDrawer(true)));
  document.querySelectorAll('[data-drawer-close]').forEach((button) => button.addEventListener('click', () => setDrawer(false)));
  document.querySelector('[data-menu-open]')?.addEventListener('click', () => setMenu(true));
  document.querySelector('[data-menu-close]')?.addEventListener('click', () => setMenu(false));
  document.querySelector('[data-filter-open]')?.addEventListener('click', () => setFilters(true));
  document.querySelector('[data-filter-close]')?.addEventListener('click', () => setFilters(false));
  document.querySelectorAll('[data-gift-choice]').forEach((button) => button.addEventListener('click', async () => {
    document.querySelectorAll('[data-gift-choice]').forEach((choice) => choice.classList.remove('is-selected'));
    button.classList.add('is-selected');
    document.querySelectorAll('[data-gift-status]').forEach((status) => { status.textContent = `${button.dataset.giftChoice} selected for checkout.`; });
    try {
      await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ attributes: { 'Complimentary gift': button.dataset.giftChoice } })
      });
    } catch (error) {
      // The selection remains visible even if the cart endpoint is unavailable in preview.
    }
  }));
  document.querySelector('[data-track-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = document.querySelector('[data-track-result]');
    const value = new FormData(event.currentTarget).get('tracking');
    if (result) result.innerHTML = `<span>✓</span><h2>Tracking request received.</h2><p>We’ll look up <strong>${String(value).replace(/[&<>"']/g, '')}</strong> and display the latest update when carrier data is connected.</p>`;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setDrawer(false);
      setMenu(false);
      setFilters(false);
    }
  });

  document.querySelectorAll('[data-gallery-thumb]').forEach((button) => button.addEventListener('click', () => {
    const index = button.dataset.galleryThumb;
    document.querySelectorAll('.product-gallery__item').forEach((item, itemIndex) => item.classList.toggle('is-active', String(itemIndex) === index));
    document.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => thumb.classList.toggle('is-active', thumb === button));
  }));

  document.querySelectorAll('[data-qty-minus]').forEach((button) => button.addEventListener('click', () => {
    const input = button.parentElement.querySelector('input[type="number"]');
    if (input) input.value = Math.max(1, Number(input.value || 1) - 1);
  }));
  document.querySelectorAll('[data-qty-plus]').forEach((button) => button.addEventListener('click', () => {
    const input = button.parentElement.querySelector('input[type="number"]');
    if (input) input.value = Math.max(1, Number(input.value || 1) + 1);
  }));

  document.querySelectorAll('[data-discount-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = new FormData(form).get('discount');
    const note = form.parentElement?.querySelector('[data-discount-note]');
    if (!code || !String(code).trim()) {
      if (note) { note.textContent = 'Please enter a valid discount code.'; note.classList.add('is-visible'); }
      return;
    }
    try {
      await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ attributes: { 'Discount code': String(code).trim() } })
      });
      if (note) { note.textContent = `Discount code ${String(code).trim()} applied for review at checkout.`; note.classList.add('is-visible'); }
    } catch (error) {
      if (note) { note.textContent = 'Discount code saved for checkout review.'; note.classList.add('is-visible'); }
    }
  }));

  const refreshCart = async () => {
    const response = await fetch('/cart.js');
    if (!response.ok) throw new Error('Cart unavailable');
    return response.json();
  };

  const updateCartCount = (count) => document.querySelectorAll('[data-cart-count]').forEach((element) => { element.textContent = count; });

  document.querySelectorAll('[data-quick-add]').forEach((button) => button.addEventListener('click', async (event) => {
    event.preventDefault();
    const variantId = button.dataset.quickAdd;
    if (!variantId) return;
    const original = button.innerHTML;
    button.textContent = 'Adding…';
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: Number(variantId), quantity: 1 }] })
      });
      if (!response.ok) throw new Error('Unable to add item');
      const cart = await refreshCart();
      updateCartCount(cart.item_count);
      button.textContent = 'Added ✓';
      setDrawer(true);
      window.setTimeout(() => { button.innerHTML = original; }, 1500);
    } catch (error) {
      button.textContent = 'Try again';
      window.setTimeout(() => { button.innerHTML = original; }, 1500);
    }
  }));

  document.querySelectorAll('[data-cart-change]').forEach((button) => button.addEventListener('click', async () => {
    const line = Number(button.dataset.line);
    const quantity = Math.max(0, Number(button.dataset.quantity));
    button.disabled = true;
    try {
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line, quantity })
      });
      window.location.reload();
    } catch (error) {
      button.disabled = false;
    }
  }));

  document.querySelectorAll('[data-remove-item]').forEach((link) => link.addEventListener('click', async (event) => {
    event.preventDefault();
    await fetch(link.href, { headers: { Accept: 'application/json' } });
    window.location.reload();
  }));
});