/* LumaForm product page behaviour: gallery, quantity offers, countdown,
   order progress, accordions, description and add to cart. */
(function () {
  'use strict';

  var root = document.querySelector('[data-product-root]');
  if (!root) { return; }

  var qs = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var qsa = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var money = function (cents) {
    if (typeof Shopify !== 'undefined' && Shopify.formatMoney) { return Shopify.formatMoney(cents); }
    return '$' + (cents / 100).toFixed(2);
  };

  /* ---------------- variant data ---------------- */
  var data = { variants: [] };
  var json = qs('[data-product-json]');
  if (json) {
    try { data = JSON.parse(json.textContent) || data; } catch (e) { /* keep defaults */ }
  }
  var variants = data.variants || [];

  var findVariant = function (options) {
    for (var i = 0; i < variants.length; i++) {
      var match = true;
      for (var j = 0; j < options.length; j++) {
        if (String(variants[i].options[j]) !== String(options[j])) { match = false; break; }
      }
      if (match) { return variants[i]; }
    }
    return null;
  };

  /* ---------------- gallery ---------------- */
  var slides = qsa('[data-gallery-slide]', root);
  var thumbs = qsa('[data-gallery-thumb]', root);
  var prevBtn = qs('[data-gallery-prev]', root);
  var nextBtn = qs('[data-gallery-next]', root);
  var dotWrap = qs('[data-gallery-dots]', root);
  var current = 0;

  var buildDots = function () {
    if (!dotWrap || slides.length < 2) { return; }
    dotWrap.innerHTML = '';
    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'lf-gallery__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Show image ' + (i + 1));
      dot.addEventListener('click', function () { show(i); });
      dotWrap.appendChild(dot);
    });
  };

  var show = function (index) {
    if (!slides.length) { return; }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      var active = i === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    thumbs.forEach(function (thumb, i) {
      var active = i === current;
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    qsa('.lf-gallery__dot', dotWrap).forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === current);
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
    if (prevBtn) { prevBtn.disabled = current === 0; }
    if (nextBtn) { nextBtn.disabled = current === slides.length - 1; }
    revealThumb(current);
  };

  /* thumbnail strip arrows */
  var thumbsList = qs('[data-thumbs-list]', root);
  var tPrev = qs('[data-thumbs-prev]', root);
  var tNext = qs('[data-thumbs-next]', root);
  var syncThumbArrows = function () {
    if (!thumbsList) { return; }
    var max = thumbsList.scrollWidth - thumbsList.clientWidth;
    if (tPrev) { tPrev.disabled = thumbsList.scrollLeft <= 2; }
    if (tNext) { tNext.disabled = thumbsList.scrollLeft >= max - 2; }
  };
  var revealThumb = function (index) {
    if (!thumbsList) { return; }
    var thumb = thumbs[index];
    if (!thumb) { return; }
    var left = thumb.offsetLeft;
    var right = left + thumb.offsetWidth;
    if (left < thumbsList.scrollLeft) { thumbsList.scrollLeft = left - 8; }
    else if (right > thumbsList.scrollLeft + thumbsList.clientWidth) {
      thumbsList.scrollLeft = right - thumbsList.clientWidth + 8;
    }
    syncThumbArrows();
  };

  if (slides.length) {
    buildDots();
    show(0);
    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener('click', function () { show(i); });
    });
    if (prevBtn) { prevBtn.addEventListener('click', function () { show(current - 1); }); }
    if (nextBtn) { nextBtn.addEventListener('click', function () { show(current + 1); }); }
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(current - 1); }
      if (e.key === 'ArrowRight') { show(current + 1); }
    });
  }
  if (thumbsList) {
    var step = function () { return Math.max(120, thumbsList.clientWidth * 0.8); };
    if (tPrev) { tPrev.addEventListener('click', function () { thumbsList.scrollLeft -= step(); }); }
    if (tNext) { tNext.addEventListener('click', function () { thumbsList.scrollLeft += step(); }); }
    thumbsList.addEventListener('scroll', syncThumbArrows, { passive: true });
    window.addEventListener('resize', syncThumbArrows);
    syncThumbArrows();
  }


  /* ---------------- price / variant sync ---------------- */
  var variantField = qs('[data-atc-variant]', root);
  var priceCurrent = qs('[data-price-current]', root);
  var priceCompare = qs('[data-price-compare]', root);
  var priceSaving = qs('[data-price-saving]', root);
  var atcSubmit = qs('[data-atc-submit]', root);
  var atcLabel = qs('[data-atc-label]', root);
  var atcStock = qs('[data-atc-stock]', root);
  var offPctBadge = qs('.lf-pbadge--off', root);

  var paintPrice = function (variant) {
    if (!variant) { return; }
    if (variantField) { variantField.value = variant.id; }
    if (priceCurrent) { priceCurrent.textContent = money(variant.price); }
    var compare = variant.compare_at_price || 0;
    if (priceCompare) {
      if (compare > variant.price) {
        priceCompare.textContent = money(compare);
        priceCompare.hidden = false;
      } else {
        priceCompare.hidden = true;
      }
    }
    if (priceSaving) {
      if (compare > variant.price) {
        priceSaving.textContent = 'You save ' + money(compare - variant.price);
        priceSaving.hidden = false;
      } else {
        priceSaving.hidden = true;
      }
    }
    if (offPctBadge && compare > variant.price) {
      offPctBadge.textContent = 'Up to ' + Math.round(((compare - variant.price) / compare) * 100) + '% off';
    }
    if (atcSubmit) { atcSubmit.disabled = !variant.available; }
    if (atcLabel) { atcLabel.textContent = variant.available ? 'Add to cart' : 'Sold out'; }
    if (atcStock) {
      atcStock.innerHTML = variant.available
        ? '<span class="lf-dot" aria-hidden="true"></span> In stock — ships in 1 business day'
        : '<span class="lf-dot is-off" aria-hidden="true"></span> Currently unavailable';
    }
    if (variant.featured_media_id) {
      slides.forEach(function (slide, i) {
        if (String(slide.getAttribute('data-media-id')) === String(variant.featured_media_id)) { show(i); }
      });
    }
  };

  /* ---------------- buy more, save more ---------------- */
  var offers = qsa('[data-offer]', root);
  var quantityField = qs('[data-atc-quantity]', root);
  var qtyValue = qs('[data-qty-value]', root);
  var offersWrap = qs('[data-offers]', root);

  var selectedOffer = function () {
    for (var i = 0; i < offers.length; i++) {
      var input = qs('[data-offer-input]', offers[i]);
      if (input && input.checked) { return offers[i]; }
    }
    return offers[0] || null;
  };

  /* reads one value per product option out of a grouped <select> */
  var offerOptions = function (offer) {
    var select = qs('[data-offer-select]', offer);
    if (!select) { return null; }
    var groups = select.querySelectorAll('optgroup');
    if (!groups.length) { return null; }
    var out = [];
    for (var i = 0; i < groups.length; i++) {
      var opts = groups[i].querySelectorAll('option');
      var chosen = null;
      for (var j = 0; j < opts.length; j++) { if (opts[j].selected) { chosen = opts[j]; break; } }
      if (!chosen) {
        for (var k = 0; k < opts.length; k++) { if (!opts[k].disabled) { chosen = opts[k]; break; } }
      }
      out.push(chosen ? chosen.value : '');
    }
    return out;
  };

  /* applies one chosen value to every option group of a tier select */
  var applyChoice = function (select, value) {
    var groups = select.querySelectorAll('optgroup');
    for (var i = 0; i < groups.length; i++) {
      var opts = groups[i].querySelectorAll('option');
      for (var j = 0; j < opts.length; j++) {
        if (opts[j].value === value && !opts[j].disabled) { select.value = value; return; }
      }
    }
  };

  var syncOffer = function (offer) {
    var options = offerOptions(offer);
    var variant = options ? findVariant(options) : variants[0];
    var qty = parseInt(offer.getAttribute('data-quantity'), 10) || 1;
    var off = parseFloat(offer.getAttribute('data-discount')) || 0;
    var unit = variant ? variant.price : 0;
    var gross = unit * qty;
    var net = Math.round(gross * (1 - off));
    var amount = qs('[data-offer-price]', offer);
    var was = qs('[data-offer-was]', offer);
    var save = qs('[data-offer-save]', offer);
    if (amount) { amount.textContent = money(net); }
    if (was) {
      if (off > 0) { was.textContent = money(gross); was.hidden = false; } else { was.textContent = ''; was.hidden = true; }
    }
    if (save) { save.textContent = money(gross - net); }
    if (offersWrap) {
      offers.forEach(function (other) { other.classList.toggle('is-selected', other === offer); });
    }
    if (quantityField) { quantityField.value = String(qty); }
    if (qtyValue) { qtyValue.textContent = String(qty); }
    return variant;
  };

  if (offers.length) {
    offers.forEach(function (offer) {
      var input = qs('[data-offer-input]', offer);
      if (input) { input.addEventListener('change', function () { paintPrice(syncOffer(offer)); }); }
      var select = qs('[data-offer-select]', offer);
      if (select) {
        select.addEventListener('change', function () {
          /* mirror the choice into the other tiers so every card shows one variant */
          offers.forEach(function (other) {
            if (other === offer) { return; }
            var mirror = qs('[data-offer-select]', other);
            if (mirror) { applyChoice(mirror, select.value); }
          });
          if (input) { input.checked = true; }
          paintPrice(syncOffer(offer));
        });
      }
    });
    /* the first tier is the default: set it explicitly so the state is deterministic */
    offers.forEach(function (offer, index) {
      var input = qs('[data-offer-input]', offer);
      if (input) { input.checked = index === 0; }
    });
    /* price every tier up front so no card is left blank */
    var active = selectedOffer();
    offers.forEach(function (offer) { syncOffer(offer); });
    offers.forEach(function (other) { other.classList.toggle('is-selected', other === active); });
    if (active) { syncOffer(active); }
    paintPrice(active ? syncOffer(active) : variants[0]);
  } else if (variantField && variants.length) {
    paintPrice(variants[0]);
  }

  /* ---------------- quantity stepper ---------------- */
  var bump = function (delta) {
    var offer = selectedOffer();
    var base = offer ? (parseInt(offer.getAttribute('data-quantity'), 10) || 1) : 1;
    var next = base + delta;
    if (next < 1) { next = 1; }
    if (quantityField) { quantityField.value = String(next); }
    if (qtyValue) { qtyValue.textContent = String(next); }
  };
  var qMinus = qs('[data-qty-minus]', root);
  var qPlus = qs('[data-qty-plus]', root);
  if (qMinus) { qMinus.addEventListener('click', function () { bump(-1); }); }
  if (qPlus) { qPlus.addEventListener('click', function () { bump(1); }); }


  /* ---------------- countdown ---------------- */
  var timer = qs('[data-timer]', root);
  if (timer) {
    var total = parseInt(timer.getAttribute('data-timer-seconds'), 10) || 7200;
    var section = root.closest('[id^="shopify-section-"]');
    var key = 'lf_offer_countdown_' + (section ? section.id : 'default');
    var hEl = qs('[data-timer-h]', timer);
    var mEl = qs('[data-timer-m]', timer);
    var sEl = qs('[data-timer-s]', timer);
    var end = 0;
    try { end = parseInt(window.localStorage.getItem(key), 10) || 0; } catch (e) { end = 0; }
    if (!end || end <= Date.now()) {
      end = Date.now() + total * 1000;
      try { window.localStorage.setItem(key, String(end)); } catch (e) { /* storage unavailable */ }
    }
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var paintTimer = function () {
      var left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      if (left <= 0) {
        end = Date.now() + total * 1000;
        try { window.localStorage.setItem(key, String(end)); } catch (e) { /* storage unavailable */ }
        left = total;
      }
      if (hEl) { hEl.textContent = pad(Math.floor(left / 3600)); }
      if (mEl) { mEl.textContent = pad(Math.floor((left % 3600) / 60)); }
      if (sEl) { sEl.textContent = pad(left % 60); }
    };
    paintTimer();
    window.setInterval(paintTimer, 1000);
  }

  /* ---------------- order progress dates ---------------- */
  var track = qs('[data-track]', root);
  if (track) {
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var fmtDate = function (d) { return MONTHS[d.getMonth()] + ' ' + d.getDate(); };
    var addDays = function (d, n) { var c2 = new Date(d.getTime()); c2.setDate(c2.getDate() + n); return c2; };
    var today = new Date();
    var dates = [
      fmtDate(today),
      fmtDate(addDays(today, 1)) + ' - ' + fmtDate(addDays(today, 3)),
      fmtDate(addDays(today, 5)) + ' - ' + fmtDate(addDays(today, 12))
    ];
    qsa('[data-track-date]', track).forEach(function (el, i) {
      el.textContent = dates[i] || '-';
    });
  }

  /* ---------------- description expansion ---------------- */
  var description = qs('[data-description]', root);
  if (description) {
    var toggle = qs('[data-description-toggle]', description);
    var inner = qs('[data-description-inner]', description);
    var label = qs('[data-description-label]', description);
    var syncDescription = function () {
      if (!toggle || !inner) { return; }
      if (inner.scrollHeight <= description.clientHeight + 4) {
        description.classList.remove('is-collapsed');
        toggle.hidden = true;
      } else {
        toggle.hidden = false;
      }
    };
    window.requestAnimationFrame(syncDescription);
    if (toggle) {
      toggle.addEventListener('click', function () {
        if (toggle.hidden) { return; }
        var collapsed = description.classList.toggle('is-collapsed');
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        if (label) { label.textContent = collapsed ? 'View full details' : 'Show less'; }
      });
    }
    window.addEventListener('resize', syncDescription);
  }

  /* ---------------- add to cart ---------------- */
  var form = qs('.lf-atc', root);
  var message = qs('[data-atc-message]', root);
  if (form) {
    form.addEventListener('submit', function (event) {
      if (!variantField || !variantField.value) { return; }
      /* the accelerated checkout button runs its own flow straight to /checkout */
      var submitter = event.submitter;
      if (submitter && submitter.closest && submitter.closest('.shopify-payment, shopify-payment-terms, [name="checkout"]')) { return; }
      event.preventDefault();
      var variantId = variantField.value;
      var qty = parseInt(quantityField ? quantityField.value : '1', 10) || 1;
      if (atcSubmit) { atcSubmit.classList.add('is-busy'); atcSubmit.disabled = true; }
      if (message) { message.textContent = ''; message.className = 'lf-atc__message'; }

      var settle = function (ok, text) {
        if (atcSubmit) { atcSubmit.classList.remove('is-busy'); atcSubmit.disabled = false; }
        if (message) {
          message.textContent = text || '';
          message.className = 'lf-atc__message' + (ok ? ' is-ok' : ' is-error');
        }
      };

      if (window.LumaCart && typeof window.LumaCart.add === 'function') {
        window.LumaCart.add([{ id: variantId, quantity: qty }])
          .then(function () {
            settle(true, 'Added to your cart.');
            if (message) { window.setTimeout(function () { message.textContent = ''; }, 4000); }
          })
          .catch(function () { settle(false, 'We could not add that item. Please try again.'); });
        return;
      }

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: variantId, quantity: qty }] })
      })
        .then(function (r) {
          if (!r.ok) { throw new Error('add failed'); }
          return fetch('/cart.js').then(function (c3) { return c3.json(); });
        })
        .then(function (cart) {
          var count = qs('[data-cart-count]');
          if (count) { count.textContent = String(cart.item_count); }
          document.body.classList.add('drawer-open');
          var drawer = qs('[data-cart-drawer]');
          if (drawer) { drawer.setAttribute('aria-hidden', 'false'); }
          settle(true, 'Added to your cart.');
        })
        .catch(function () { settle(false, 'We could not add that item. Please try again.'); });
    });
  }
}());
