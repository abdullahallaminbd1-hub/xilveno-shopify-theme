/* Xilveno theme behaviour - V2 */
(function () {
  'use strict';

  var body = document.body;
  var qs = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var qsa = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header scroll state ---------- */
  var header = qs('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.pageYOffset > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- overlay helpers ---------- */
  var cartDrawer = qs('[data-cart-drawer]');
  var menuDrawer = qs('[data-menu-drawer]');
  var searchOverlay = qs('[data-search-overlay]');

  var isLocked = function () {
    return body.classList.contains('drawer-open') || body.classList.contains('mobile-nav-open') || body.classList.contains('search-open');
  };
  var setFlag = function (cls, open) {
    if (open && isLocked()) { return false; }
    body.classList.toggle(cls, open);
    return true;
  };

  var setDrawer = function (open) {
    if (!setFlag('drawer-open', open)) { return; }
    if (cartDrawer) { cartDrawer.setAttribute('aria-hidden', open ? 'false' : 'true'); }
  };
  var setMenu = function (open) {
    if (!setFlag('mobile-nav-open', open)) { return; }
    if (menuDrawer) { menuDrawer.setAttribute('aria-hidden', open ? 'false' : 'true'); }
    qsa('[data-menu-open]').forEach(function (t) { t.setAttribute('aria-expanded', open ? 'true' : 'false'); });
  };
  var setSearch = function (open) {
    if (!setFlag('search-open', open)) { return; }
    if (searchOverlay) {
      searchOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) { var input = qs('input[type="search"]', searchOverlay); if (input) { window.setTimeout(function () { input.focus(); }, 240); } }
    }
  };
  var setFilters = function (open) { body.classList.toggle('filter-panel-open', open); };

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (target.closest('[data-cart-open]')) { event.preventDefault(); setDrawer(true); return; }
    if (target.closest('[data-drawer-close]')) { event.preventDefault(); setDrawer(false); return; }
    if (target.closest('[data-menu-open]')) { event.preventDefault(); setMenu(!body.classList.contains('mobile-nav-open')); return; }
    if (target.closest('[data-menu-close]')) { event.preventDefault(); setMenu(false); return; }
    if (target.closest('[data-search-open]')) { event.preventDefault(); setSearch(true); return; }
    if (target.closest('[data-search-close]')) { event.preventDefault(); setSearch(false); return; }
    if (target.closest('[data-filter-open]')) { event.preventDefault(); setFilters(true); return; }
    if (target.closest('[data-filter-close]')) { event.preventDefault(); setFilters(false); return; }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') { return; }
    setDrawer(false); setMenu(false); setSearch(false); setFilters(false);
  });

  /* ---------- hero slideshow ---------- */
  qsa('[data-slideshow]').forEach(function (root) {
    var slides = qsa('[data-slide]', root);
    if (slides.length < 2) { return; }
    var dots = qsa('[data-slide-dot]', root);
    var delay = Math.max(3, parseInt(root.getAttribute('data-autoplay'), 10) || 6) * 1000;
    var index = 0;
    var timer = null;

    var show = function (next) {
      index = next;
      slides.forEach(function (slide, i) { slide.classList.toggle('is-active', i === index); });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
        dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
    };
    var stop = function () { if (timer) { window.clearInterval(timer); timer = null; } };
    var start = function () { stop(); if (!reduceMotion) { timer = window.setInterval(function () { show((index + 1) % slides.length); }, delay); } };

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () { show(parseInt(dot.getAttribute('data-slide-dot'), 10) || 0); start(); });
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); } else { start(); } });

    var startX = 0;
    root.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) { show((index + (dx < 0 ? 1 : slides.length - 1)) % slides.length); start(); }
    }, { passive: true });

    show(0);
    start();
  });

  /* ---------- reveal on scroll ---------- */
  var revealables = qsa('[data-reveal]');
  if (revealables.length) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
      revealables.forEach(function (el) { observer.observe(el); });
    } else {
      revealables.forEach(function (el) { el.classList.add('is-revealed'); });
    }
  }

  /* ---------- product gallery thumbnails (legacy markup) + quantity ---------- */
  document.addEventListener('click', function (event) {
    var thumb = event.target.closest('[data-gallery-thumb]');
    if (thumb) {
      /* The new product section owns its own gallery; leave those thumbnails alone. */
      if (thumb.closest('[data-product-root]')) { return; }
      var wanted = thumb.getAttribute('data-gallery-thumb');
      qsa('.product-gallery__item').forEach(function (item, i) { item.classList.toggle('is-active', String(i) === wanted); });
      qsa('[data-gallery-thumb]').forEach(function (other) { other.classList.toggle('is-active', other === thumb); });
      return;
    }
    var minus = event.target.closest('[data-qty-minus]');
    var plus = event.target.closest('[data-qty-plus]');
    if (minus || plus) {
      var wrap = (minus || plus).parentElement;
      var input = qs('input[type="number"]', wrap);
      if (!input) { return; }
      var step = minus ? -1 : 1;
      var next = Math.max(1, (parseInt(input.value, 10) || 1) + step);
      input.value = next;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  /* ---------- complimentary gift ---------- */
  document.addEventListener('click', function (event) {
    var choice = event.target.closest('[data-gift-choice]');
    if (!choice) { return; }
    qsa('[data-gift-choice]').forEach(function (other) { other.classList.remove('is-selected'); });
    choice.classList.add('is-selected');
    var label = choice.getAttribute('data-gift-choice');
    qsa('[data-gift-status]').forEach(function (status) { status.textContent = label + ' selected for checkout.'; });
    try {
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ attributes: { 'Complimentary gift': label } })
      });
    } catch (error) {
      /* Selection stays visible when the cart endpoint is unavailable. */
    }
  });

  /* ---------- discount code ----------
     The real handler lives in bindDrawerInternals() below, which applies the
     code with Shopify's supported { discount: code } payload and checks the
     response. An earlier delegated version of this handler only wrote the code
     to the cart as an "attribute" (which never applies a discount) and
     reported success without checking the response, so a rejected code was
     still announced as applied. It was removed to avoid two handlers racing
     to write the same message. */

  /* ---------- order tracking placeholder ---------- */
  document.addEventListener('submit', function (event) {
    var form = event.target.closest('[data-track-form]');
    if (!form) { return; }
    event.preventDefault();
    var result = qs('[data-track-result]');
    var value = String(new FormData(form).get('tracking') || '').replace(/[&<>"']/g, '');
    if (result) {
      result.innerHTML = '<span>&#10003;</span><h2>Tracking request received.</h2><p>We will look up <strong>' + value + '</strong> and display the latest update once carrier data is connected.</p>';
    }
  });
  /* ---------- cart data helpers ---------- */
  var getCart = function () { return fetch('/cart.js').then(function (r) { return r.json(); }); };

  var paintCount = function (count) {
    qsa('[data-cart-count]').forEach(function (el) { el.textContent = count; });
  };

  var postCart = function (url, payload) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  var restoreButton = function (button, html) {
    if (!button) { return; }
    button.innerHTML = html;
    button.disabled = false;
    button.removeAttribute('aria-busy');
  };

  var flashButton = function (button, message, html) {
    if (!button) { return; }
    button.textContent = message;
    window.setTimeout(function () { restoreButton(button, html); }, 1800);
  };

  /* the drawer markup is replaced after every cart update, so the listeners
     inside it are re-bound on the fresh nodes */
  var bindDrawerInternals = function () {
    /* every discount form is bound, not just the first one, so the cart page
       and the drawer each apply codes through the same supported flow */
    qsa('[data-discount-form]').forEach(function (form) {
      if (form.hasAttribute('data-bound')) { return; }
      form.setAttribute('data-bound', 'true');
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var scope = form.parentElement || document;
        var input = qs('input[name="discount"]', form);
        var note = qs('[data-discount-note]', scope) || qs('[data-discount-note]');
        var code = input ? input.value.trim() : '';
        if (!code) { if (note) { note.textContent = 'Enter a discount code first.'; } return; }
        postCart('/cart/update.js', { discount: code })
          .then(function (r) { if (!r.ok) { throw new Error('discount failed'); } return getCart(); })
          .then(function (cart) {
            if (note) { note.textContent = code + ' applied to your order.'; }
            paintCount(cart.item_count);
            return refreshDrawer();
          })
          .catch(function () { if (note) { note.textContent = 'That code could not be applied. Please try again.'; } });
      });
    });
    var giftBox = qs('[data-gift-choices]');
    if (giftBox && !giftBox.hasAttribute('data-bound')) {
      giftBox.setAttribute('data-bound', 'true');
      giftBox.addEventListener('click', function (event) {
        var choice = event.target.closest('[data-gift-choice]');
        if (!choice) { return; }
        var status = qs('[data-gift-status]');
        if (status) { status.textContent = choice.getAttribute('data-gift-choice') + ' will be added as your complimentary gift.'; }
        giftBox.setAttribute('data-gift-selected', choice.getAttribute('data-gift-choice'));
      });
    }
  };

  var getScroller = function () {
    return cartDrawer ? cartDrawer.querySelector('[data-cart-body]') : null;
  };

  var rowForLine = function (root, line) {
    if (!root || !line) { return null; }
    var trigger = root.querySelector('[data-line="' + line + '"]');
    return trigger ? trigger.closest('.cart-item') : null;
  };

  /* loading feedback is applied to the single row the customer clicked */
  var setRowBusy = function (line, busy) {
    var row = rowForLine(cartDrawer, line);
    if (row) { row.classList.toggle('is-updating', !!busy); }
  };

  /* anchorLine keeps the clicked row in place across the markup swap */
  var refreshDrawer = function (anchorLine) {
    if (!cartDrawer) { return Promise.resolve(); }
    var scroller = getScroller();
    var anchor = rowForLine(cartDrawer, anchorLine);
    var fallbackTop = scroller ? scroller.scrollTop : 0;
    var anchorDelta = null;
    if (anchor && scroller) {
      anchorDelta = anchor.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    }
    return fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, 'text/html');
        var fresh = parsed.querySelector('[data-cart-drawer]');
        if (fresh) { cartDrawer.innerHTML = fresh.innerHTML; }
        /* innerHTML rebuilds [data-cart-body], so re-query the live scroller */
        var after = getScroller();
        if (after) {
          var next = rowForLine(cartDrawer, anchorLine);
          if (next && anchorDelta !== null) {
            var moved = next.getBoundingClientRect().top - after.getBoundingClientRect().top;
            after.scrollTop += (moved - anchorDelta);
          } else {
            after.scrollTop = fallbackTop;
          }
        }
        bindDrawerInternals();
      })
      .catch(function () { /* keep the current drawer markup when the request fails */ });
  };

  /* ---------- quick add / quantity / remove (delegated) ---------- */
  document.addEventListener('click', function (event) {
    var quickAdd = event.target.closest('[data-quick-add]');
    if (quickAdd) {
      event.preventDefault();
      var variantId = quickAdd.getAttribute('data-quick-add');
      if (!variantId || quickAdd.disabled) { return; }
      var originalHtml = quickAdd.innerHTML;
      quickAdd.setAttribute('aria-busy', 'true');
      quickAdd.disabled = true;
      quickAdd.textContent = 'Adding...';
      postCart('/cart/add.js', { items: [{ id: variantId, quantity: 1 }] })
        .then(function (r) { if (!r.ok) { throw new Error('add failed'); } return getCart(); })
        .then(function (cart) {
          paintCount(cart.item_count);
          /* open the side cart straight away, then refresh its contents - no navigation */
          setDrawer(true);
          restoreButton(quickAdd, originalHtml);
          return refreshDrawer();
        })
        .catch(function () { flashButton(quickAdd, 'Unavailable', originalHtml); });
      return;
    }

    var change = event.target.closest('[data-cart-change]');
    if (change) {
      event.preventDefault();
      var line = change.getAttribute('data-line');
      var quantity = Math.max(0, parseInt(change.getAttribute('data-quantity'), 10) || 0);
      if (!line) { return; }
      change.disabled = true;
      setRowBusy(line, true);
      postCart('/cart/change.js', { line: line, quantity: quantity })
        .then(function (r) { if (!r.ok) { throw new Error('change failed'); } return getCart(); })
        .then(function (cart) { paintCount(cart.item_count); return refreshDrawer(quantity > 0 ? line : null); })
        .catch(function () { change.disabled = false; setRowBusy(line, false); });
      return;
    }

    var remove = event.target.closest('[data-remove-item]');
    if (remove) {
      event.preventDefault();
      var removeLine = remove.getAttribute('data-line');
      setRowBusy(removeLine, true);
      var removeRequest = removeLine
        ? postCart('/cart/change.js', { line: removeLine, quantity: 0 })
        : fetch(remove.getAttribute('href'), { headers: { Accept: 'application/json' } });
      removeRequest
        .then(function () { return getCart(); })
        .then(function (cart) { paintCount(cart.item_count); return refreshDrawer(); })
        .catch(function () { setRowBusy(removeLine, false); /* item stays in the drawer until the page reloads */ });
    }
  });

  /* ---------- keep cart in sync across tabs ---------- */
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) { refreshDrawer(); }
  });

  /* ---------- product page add to cart (uses the existing cart drawer) ---------- */
  var addToCart = function (items) {
    return postCart('/cart/add.js', { items: items })
      .then(function (r) {
        if (!r.ok) { throw new Error('add failed'); }
        return getCart();
      })
      .then(function (cart) {
        paintCount(cart.item_count);
        setDrawer(true);
        return refreshDrawer().then(function () { return cart; });
      });
  };
  window.LumaCart = { add: addToCart, open: setDrawer, refresh: refreshDrawer, setCount: paintCount };

  bindDrawerInternals();
}());