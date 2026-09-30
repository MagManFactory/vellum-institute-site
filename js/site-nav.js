(function () {
  var btn = document.getElementById('burgerBtn');
  var menu = document.getElementById('mobileMenu');
  if (btn && menu) {
    btn.setAttribute('aria-controls', menu.id);
    function setOpen(open) {
      menu.classList.toggle('open', open);
      menu.style.display = open ? 'flex' : 'none';
      btn.setAttribute('aria-expanded', String(open));
    }
    setOpen(false);
    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        btn.focus();
      }
    });
    window.addEventListener('resize', function () { setOpen(false); });
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
