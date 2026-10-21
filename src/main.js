// Glovia — progressive enhancement only. The page is fully readable without JS.
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var hasIO = 'IntersectionObserver' in window;

  // ---------- Sticky nav + scroll cue ----------
  var nav = document.getElementById('nav');
  var setScrolled = function () {
    var s = window.scrollY > 24;
    nav.classList.toggle('is-scrolled', s);
    doc.classList.toggle('is-scrolled-page', s);
  };

  // ---------- Reveal on scroll ----------
  if (hasIO) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------- Count-up stats ----------
  var counters = $$('[data-count]');
  var runCount = function (el) {
    var end = +el.getAttribute('data-count');
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = end + suffix; return; }
    var t0 = null, dur = 1600 + Math.min(end, 120) * 4;
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = clamp((t - t0) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (hasIO && !reduce) {
    counters.forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        runCount(e.target);
        cio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // ---------- Scan demo: start when the phone is properly in view ----------
  var live = $$('[data-live]');
  if (hasIO) {
    var lio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-live');
        lio.unobserve(e.target);
      });
    }, { threshold: 0.45 });
    live.forEach(function (el) { lio.observe(el); });
  } else {
    live.forEach(function (el) { el.classList.add('is-live'); });
  }

  // ---------- FAQ accordion ----------
  $$('.faq__btn').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (open) panel.setAttribute('data-closed', '');
      else panel.removeAttribute('data-closed');
    });
  });

  // ---------- Notify form: compose an email (no backend) ----------
  var form = document.querySelector('[data-notify]');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var input = form.querySelector('input[type=email]');
      if (!input.checkValidity()) { input.reportValidity(); return; }
      var subject = 'Notify me when Glovia launches';
      var body = 'Hi Glovia team,\n\nPlease let me know when Glovia is available.\n\nMy email: ' + input.value.trim() + '\n';
      window.location.href = 'mailto:info@astrextech.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  // ---------- Smooth anchor scrolling with easing ----------
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a || ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    var id = a.getAttribute('href');
    var target = id === '#top' ? document.body : document.querySelector(id);
    if (!target) return;
    ev.preventDefault();
    var navH = nav.offsetHeight;
    var to = id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY - navH - 8;
    var from = window.scrollY, dist = to - from;
    var finish = function () {
      history.pushState(null, '', id);
      if (target !== document.body) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    };
    if (reduce || Math.abs(dist) < 2) { window.scrollTo(0, to); finish(); return; }
    var dur = clamp(Math.abs(dist) * 0.35, 600, 1300), t0 = null;
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = clamp((t - t0) / dur, 0, 1);
      window.scrollTo(0, from + dist * easeInOut(p));
      if (p < 1) requestAnimationFrame(step); else finish();
    };
    requestAnimationFrame(step);
  });

  // ---------- Scroll-linked effects (one rAF loop, only for what is on screen) ----------
  var parallax = $$('[data-parallax]');
  var steps = document.querySelector('[data-progress]');
  var stepEls = steps ? $$('.step', steps) : [];
  var philo = document.querySelector('[data-philo]');
  var words = philo ? $$('.pw', philo) : [];
  var philoAura = philo ? philo.querySelector('.aura') : null;
  var visible = new Set();

  if (hasIO) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
      requestTick();
    }, { rootMargin: '10% 0px' });
    parallax.concat(steps ? [steps] : [], philo ? [philo] : []).forEach(function (el) { vio.observe(el); });
  }

  var ticking = false;
  var requestTick = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  function update() {
    ticking = false;
    setScrolled();
    var vh = window.innerHeight;

    if (!reduce) {
      parallax.forEach(function (el) {
        if (!visible.has(el)) return;
        var f = parseFloat(el.getAttribute('data-parallax')) || 0;
        el.style.transform = 'translate3d(0,' + (window.scrollY * f).toFixed(1) + 'px,0)';
      });
    }

    if (steps && (visible.has(steps) || !hasIO) && !reduce) {
      var r = steps.getBoundingClientRect();
      var horizontal = window.innerWidth >= 820;
      // Draw from when the strip enters the lower part of the screen until it nears the top.
      var p = clamp((vh * 0.85 - r.top) / (vh * 0.5 + (horizontal ? 0 : r.height * 0.6)), 0, 1);
      steps.style.setProperty('--p', p.toFixed(3));
      var len = horizontal ? r.width : r.height;
      stepEls.forEach(function (s) {
        var at = horizontal ? s.offsetLeft / len : s.offsetTop / len;
        s.classList.toggle('is-lit', p >= at - 0.001 && p > 0.01);
      });
    }

    if (philo && (visible.has(philo) || !hasIO) && !reduce) {
      var pr = philo.getBoundingClientRect();
      var span = philo.offsetHeight - vh;
      var pp = span > 0 ? clamp(-pr.top / span, 0, 1) : 1;
      // Words light up one by one across the first ~70% of the stage.
      words.forEach(function (w, i) { w.classList.toggle('is-on', pp > 0.08 + i * 0.2); });
      philo.classList.toggle('is-done', pp > 0.68);
      if (philoAura) philoAura.style.setProperty('--glow-s', (0.9 + pp * 0.2).toFixed(3));
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  update();

  // ---------- Custom cursor: coral dot with a soft trailing ring ----------
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduce) {
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring); document.body.appendChild(dot);
    var mx = -100, my = -100, dx = mx, dy = my, rx = mx, ry = my, running = false;
    var loop = function () {
      dx += (mx - dx) * 0.45; dy += (my - dy) * 0.45;
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) requestAnimationFrame(loop);
      else running = false;
    };
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!doc.classList.contains('has-cursor')) { dx = rx = mx; dy = ry = my; doc.classList.add('has-cursor'); }
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { doc.classList.remove('has-cursor'); });
    document.addEventListener('mouseover', function (e) {
      var hit = e.target.closest && e.target.closest('a, button, input, .card, .badge');
      doc.classList.toggle('cursor-hover', !!hit);
    });
  }
})();
