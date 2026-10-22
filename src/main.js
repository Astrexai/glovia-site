// Glovia — progressive enhancement only. The page is fully readable without JS.
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var hasIO = 'IntersectionObserver' in window;

  // ---------- A little personality ----------
  try {
    console.log(
      '%c\n   ____\n  / ___|\n | |  _\n | |_| |\n  \\____|\n',
      'color:#EE8A72;font:600 14px/1.1 monospace'
    );
    console.log('%cCurious? We like that. info@astrextech.com', 'color:#A44E31;font:500 13px Inter,system-ui,sans-serif');
  } catch (e) { /* console unavailable */ }

  var baseTitle = document.title;
  document.addEventListener('visibilitychange', function () {
    document.title = document.hidden ? 'Come back and glow ✨' : baseTitle;
  });

  // ---------- Wake the living background on first interaction ----------
  var wake = function () {
    doc.classList.add('is-awake');
    ['scroll', 'pointermove', 'touchstart', 'keydown'].forEach(function (t) { window.removeEventListener(t, wake); });
  };
  ['scroll', 'pointermove', 'touchstart', 'keydown'].forEach(function (t) { window.addEventListener(t, wake, { passive: true }); });

  // ---------- Reveal on scroll ----------
  var once = function (els, cls, opts) {
    if (!hasIO) { els.forEach(function (el) { el.classList.add(cls); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add(cls);
        io.unobserve(e.target);
      });
    }, opts);
    els.forEach(function (el) { io.observe(el); });
  };
  once($$('[data-reveal]'), 'is-in', { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  once($$('[data-live]'), 'is-live', { threshold: 0.45 });

  // ---------- Count-up stats ----------
  var counters = $$('[data-count]');
  if (hasIO && !reduce) {
    counters.forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, end = +el.getAttribute('data-count'), suffix = el.getAttribute('data-suffix') || '';
        var t0 = null, dur = 1600 + Math.min(end, 120) * 4;
        var step = function (t) {
          if (t0 === null) t0 = t;
          var p = clamp((t - t0) / dur, 0, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // ---------- Honest answers accordion ----------
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
      var body = 'Hi Glovia team,\n\nPlease let me know when Glovia is available.\n\nMy email: ' + input.value.trim() + '\n';
      window.location.href = 'mailto:info@astrextech.com?subject=' + encodeURIComponent('Notify me when Glovia launches') + '&body=' + encodeURIComponent(body);
    });
  }

  // ---------- Smooth anchor scrolling with easing ----------
  var nav = document.getElementById('nav');
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a || ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    var id = a.getAttribute('href');
    var target = id === '#top' ? document.body : document.querySelector(id);
    if (!target) return;
    ev.preventDefault();
    // Measured every frame: sections that render lazily can change height on the way.
    var targetY = function () { return id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 8; };
    var to = targetY();
    var from = window.scrollY, dist = to - from;
    var finish = function () {
      history.pushState(null, '', id);
      if (target !== document.body) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    };
    if (reduce || Math.abs(dist) < 2) { window.scrollTo(0, to); finish(); return; }
    var dur = clamp(Math.abs(dist) * 0.3, 600, 1400), t0 = null;
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = clamp((t - t0) / dur, 0, 1);
      window.scrollTo(0, from + (targetY() - from) * easeInOut(p));
      if (p < 1) requestAnimationFrame(step); else finish();
    };
    requestAnimationFrame(step);
  });

  // ---------- Scroll-linked effects: one rAF, only for what is on screen ----------
  var parallax = $$('[data-parallax]');
  var steps = document.querySelector('[data-progress]');
  var stepEls = steps ? $$('.step', steps) : [];
  var philo = document.querySelector('[data-philo]');
  var philoAura = philo ? philo.querySelector('.aura') : null;
  var progress = document.querySelector('.progress-ring');
  var progressArc = progress ? progress.querySelector('.progress-ring__arc') : null;
  var visible = new Set();
  var ticking = false;
  var requestTick = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  if (hasIO) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
      requestTick();
    }, { rootMargin: '10% 0px' });
    parallax.concat(steps ? [steps] : [], philo ? [philo] : []).forEach(function (el) { vio.observe(el); });
  }
  var inView = function (el) { return !hasIO || visible.has(el); };

  function update() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var scrolled = y > 24;
    nav.classList.toggle('is-scrolled', scrolled);
    doc.classList.toggle('is-scrolled-page', scrolled);

    // The G ring in the corner fills as you read.
    if (progress) {
      var max = Math.max(1, doc.scrollHeight - vh);
      progressArc.style.strokeDashoffset = (100 - clamp(y / max, 0, 1) * 100).toFixed(2);
      progress.classList.toggle('is-visible', y > vh * 0.6);
    }

    if (reduce) return;

    parallax.forEach(function (el) {
      if (!inView(el)) return;
      el.style.transform = 'translate3d(0,' + (y * (parseFloat(el.getAttribute('data-parallax')) || 0)).toFixed(1) + 'px,0)';
    });

    if (steps && inView(steps)) {
      var r = steps.getBoundingClientRect();
      var horizontal = window.innerWidth >= 820;
      var p = clamp((vh * 0.85 - r.top) / (vh * 0.5 + (horizontal ? 0 : r.height * 0.6)), 0, 1);
      steps.style.setProperty('--p', p.toFixed(3));
      var len = horizontal ? r.width : r.height;
      stepEls.forEach(function (s) {
        var at = horizontal ? s.offsetLeft / len : s.offsetTop / len;
        s.classList.toggle('is-lit', p > 0.01 && p >= at - 0.001);
      });
    }

    if (philo && inView(philo)) {
      var pr = philo.getBoundingClientRect();
      var span = philo.offsetHeight - vh;
      var pp = span > 0 ? clamp(-pr.top / span, 0, 1) : 1;
      // Once the stage settles, the words take their own time: a rhythm, not a scrub.
      if (pp > 0.08 || pr.top < vh * 0.15) philo.classList.add('is-play');
      if (philoAura) philoAura.style.setProperty('--glow-s', (0.92 + pp * 0.16).toFixed(3));
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  requestTick();

  if (reduce) return; // Everything below is pure motion.

  // ---------- Scan demo: hold the phone (mouse tilt, or gyroscope where no prompt is needed) ----------
  var tilt = document.querySelector('[data-tilt]');
  if (tilt) {
    var stage = tilt.parentElement;
    var glare = tilt.querySelector('.phone__glare');
    var MAX = 6;
    var tx = 0, ty = 0, cx = 0, cy = 0, tiltRunning = false;
    var render = function () {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      tilt.style.transform = 'perspective(1100px) rotateX(' + cx.toFixed(2) + 'deg) rotateY(' + cy.toFixed(2) + 'deg)';
      if (glare) glare.style.transform = 'translate3d(' + (-cy * 4).toFixed(1) + '%,' + (cx * 4).toFixed(1) + '%,0)';
      if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) requestAnimationFrame(render);
      else tiltRunning = false;
    };
    var kick = function () { if (!tiltRunning) { tiltRunning = true; requestAnimationFrame(render); } };

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      stage.addEventListener('pointermove', function (e) {
        var r = tilt.getBoundingClientRect();
        var nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2 + 120), -1, 1);
        var ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2 + 120), -1, 1);
        tx = -ny * MAX; ty = nx * MAX;
        tilt.classList.add('is-active');
        kick();
      });
      stage.addEventListener('pointerleave', function () {
        tx = 0; ty = 0; tilt.classList.remove('is-active'); kick();
      });
    } else if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
      // Android and friends deliver orientation without a prompt; iOS would ask, so it keeps the auto-animation.
      var base = null, onScreen = false;
      if (hasIO) {
        new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (!onScreen) { tx = ty = 0; kick(); } }).observe(tilt);
      }
      window.addEventListener('deviceorientation', function (e) {
        if (!onScreen || e.beta === null || e.gamma === null) return;
        if (!base) base = { b: e.beta, g: e.gamma };
        tx = clamp((e.beta - base.b) * 0.35, -MAX, MAX);
        ty = clamp((e.gamma - base.g) * 0.35, -MAX, MAX);
        tilt.classList.add('is-active');
        kick();
      }, { passive: true });
    }
  }

  // ---------- Custom cursor: coral dot with a soft trailing ring ----------
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
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
