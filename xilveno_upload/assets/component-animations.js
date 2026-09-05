/* ==========================================================================
   XILVENO — component-animations.js
   Performance-safe animations using IntersectionObserver.
   Respects prefers-reduced-motion. Uses transform/opacity only (no layout).
   ========================================================================== */

'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Stagger children ────────────────────────────────────────────────────────

function initStaggerGroups() {
  if (prefersReducedMotion) return;
  document.querySelectorAll('[data-stagger]').forEach(group => {
    const children = [...group.children];
    children.forEach((child, i) => {
      child.classList.add('animate-on-scroll');
      child.classList.add(`animate-on-scroll--delay-${Math.min(i + 1, 4)}`);
    });
  });
}

// ─── Parallax (subtle, only on desktop) ─────────────────────────────────────

function initParallax() {
  if (prefersReducedMotion) return;
  if (window.matchMedia('(max-width: 768px)').matches) return;

  const els = document.querySelectorAll('[data-parallax]');
  if (!els.length) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        els.forEach(el => {
          const rect = el.getBoundingClientRect();
          const speed = parseFloat(el.dataset.parallax || 0.15);
          const offset = rect.top * speed;
          el.style.transform = `translateY(${offset}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ─── Number counter animation ─────────────────────────────────────────────────

function animateCounter(el) {
  const target = parseInt(el.dataset.counter);
  const duration = 1500;
  const start = performance.now();
  const suffix = el.dataset.counterSuffix || '';

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initCounters() {
  const els = document.querySelectorAll('[data-counter]');
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (!prefersReducedMotion) animateCounter(e.target);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  els.forEach(el => observer.observe(el));
}

// ─── Hero text reveal ─────────────────────────────────────────────────────────

function initHeroReveal() {
  if (prefersReducedMotion) return;
  const hero = document.querySelector('.hero-slide--active .hero-slide__content, .hero-slide:first-child .hero-slide__content');
  if (!hero) return;

  const animatable = hero.querySelectorAll('.hero-slide__eyebrow, .hero-slide__heading, .hero-slide__subheading, .hero-slide__actions');
  animatable.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.6s ease ${i * 0.12}s, transform 0.6s ease ${i * 0.12}s`;
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 100);
  });
}

// ─── Image lazy load enhancement ─────────────────────────────────────────────

function initLazyImages() {
  if ('loading' in HTMLImageElement.prototype) return; // native lazy load supported
  const images = document.querySelectorAll('img[loading="lazy"]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const img = e.target;
        if (img.dataset.src) img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        observer.unobserve(img);
      }
    });
  });
  images.forEach(img => observer.observe(img));
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initStaggerGroups();
  initParallax();
  initCounters();
  initLazyImages();
  setTimeout(initHeroReveal, 200);
});
