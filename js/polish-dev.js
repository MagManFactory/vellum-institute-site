/* Sticky-nav bookkeeping and scroll reveals for the polish preview.
   Does not rewrite labels. Respects prefers-reduced-motion. */
(function () {
  if (window.__vellumPolishBoot) return;
  window.__vellumPolishBoot = true;

  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function wantsMotion() {
    return !reduceQuery.matches;
  }

  if (wantsMotion()) {
    document.documentElement.classList.add('polish-boot');
  } else {
    document.documentElement.classList.add('polish-reduce');
  }

  var RISE = '.hero-note, .course-row, .price-panel, .research-panel, .step, .program-row, .section-mark, .ms-figure, .apply-panel';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    try {
    var nav = document.getElementById('siteNav');
    if (nav) {
      var ticking = false;
      function syncNav() {
        var y = window.scrollY || window.pageYOffset || 0;
        var stuck = y > 40;
        nav.classList.toggle('scrolled', stuck);
        nav.classList.toggle('polish-compact', stuck);
        ticking = false;
      }
      window.addEventListener('scroll', function () {
        if (!ticking) {
          window.requestAnimationFrame(syncNav);
          ticking = true;
        }
      }, { passive: true });
      syncNav();
    }

    var nodes = Array.prototype.slice.call(document.querySelectorAll(RISE));
    nodes.forEach(function (el) {
      el.classList.add('polish-rise');
    });

    var byParent = new Map();
    nodes.forEach(function (el) {
      var parent = el.parentElement || document.body;
      if (!byParent.has(parent)) byParent.set(parent, []);
      byParent.get(parent).push(el);
    });
    byParent.forEach(function (group) {
      group.forEach(function (el, index) {
        el.style.setProperty('--polish-delay', Math.min(index, 7) * 70 + 'ms');
      });
    });

    function show(el) {
      el.classList.add('is-shown');
    }

    function showAll() {
      nodes.forEach(show);
    }

    if (!wantsMotion() || !('IntersectionObserver' in window)) {
      document.documentElement.classList.remove('polish-boot');
      showAll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

    nodes.forEach(function (el) {
      io.observe(el);
    });

    document.addEventListener('focusin', function (event) {
      var target = event.target && event.target.closest ? event.target.closest(RISE) : null;
      if (target) show(target);
    });

    window.setTimeout(function () {
      nodes.forEach(function (el) {
        if (el.classList.contains('is-shown')) return;
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) show(el);
      });
    }, 900);

    window.setTimeout(showAll, 6000);

    if (typeof reduceQuery.addEventListener === 'function') {
      reduceQuery.addEventListener('change', function () {
        if (!wantsMotion()) {
          document.documentElement.classList.remove('polish-boot');
          document.documentElement.classList.add('polish-reduce');
          showAll();
        }
      });
    }
    } catch (err) {
      document.documentElement.classList.remove('polish-boot');
    }
  });
})();
