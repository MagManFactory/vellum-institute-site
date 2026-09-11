(function () {
  var grid = document.getElementById('courseGrid');
  if (grid) {
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(function (other) {
          other.classList.remove('active');
        });
        btn.classList.add('active');
        var filter = btn.getAttribute('data-filter');
        grid.querySelectorAll('.course-row').forEach(function (row) {
          row.hidden = filter !== 'all' && row.getAttribute('data-tag') !== filter;
        });
      });
    });
  }

  var faqList = document.getElementById('faqList');
  if (faqList) {
    faqList.addEventListener('click', function (e) {
      var btn = e.target.closest('.faq-q');
      if (!btn) return;
      var item = btn.parentElement;
      var ans = item.querySelector('.faq-a');
      var isOpen = item.classList.contains('open');
      faqList.querySelectorAll('.faq-item.open').forEach(function (openItem) {
        openItem.classList.remove('open');
        var openBtn = openItem.querySelector('.faq-q');
        var openAns = openItem.querySelector('.faq-a');
        if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
        if (openAns) openAns.style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  }
})();
