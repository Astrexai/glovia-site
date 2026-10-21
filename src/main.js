// Glovia — progressive enhancement only. The page is fully readable without JS.
(function () {
  'use strict';

  // Sticky nav: switch to the blurred bar once the page leaves the very top.
  var nav = document.getElementById('nav');
  var sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none';
  document.body.prepend(sentinel);

  if (!('IntersectionObserver' in window)) {
    nav.classList.add('is-scrolled');
    document.querySelectorAll('[data-reveal],[data-reveal-group]').forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  new IntersectionObserver(function (entries) {
    nav.classList.toggle('is-scrolled', !entries[0].isIntersecting);
  }).observe(sentinel);

  // Scroll reveal: fade + rise once, then stop observing.
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });

  // The philosophy statement reveals once it is properly in view.
  var group = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      group.unobserve(entry.target);
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('[data-reveal-group]').forEach(function (el) { group.observe(el); });
})();
