(function () {
  var btn = document.getElementById('burgerBtn');
  var menu = document.getElementById('mobileMenu');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
      });
    });
  }

  var nav = document.getElementById('siteNav');
  if (!nav) return;
  var ticking = false;
  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });
  updateNav();
})();
