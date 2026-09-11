(function () {
  var form = document.getElementById('applyForm');
  var successMsg = document.getElementById('successMsg');
  var errorMsg = document.getElementById('errorMsg');
  if (!form) return;

  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxXPVsPb3IfHIEaNxlBszLt5cF-B7oGPmvVi3x4OOaKduz4dzTdY8PtlenpkDDvdwMv/exec';
  var FIELD_IDS = ['parentName', 'studentName', 'email', 'grade', 'schoolName', 'state', 'country', 'curriculum', 'courseInterest', 'notes'];
  var REQUIRED_IDS = ['parentName', 'studentName', 'email', 'grade', 'schoolName', 'country', 'curriculum', 'courseInterest', 'notes'];
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitBtnLabel = submitBtn ? submitBtn.textContent : '';

  var interestSelect = document.getElementById('courseInterest');
  if (interestSelect && !interestSelect.options.length) {
    var titles = Array.from(document.querySelectorAll('#courseGrid .course-row h3')).map(function (heading) {
      return heading.textContent.trim();
    });
    if (!titles.length) {
      titles = [
        'AI and Society',
        'Social Entrepreneurship',
        'Media Psychology',
        'Geopolitics in the Age of AI',
        'Environmental Sustainability in Business',
        'Behavioral Economics',
        'Japanese Media, Culture, and Society: From Buddhist Texts to Global Anime'
      ];
    }
    interestSelect.innerHTML = '<option value="">Select a course</option>' +
      titles.map(function (title) {
        return '<option value="' + title.replace(/"/g, '&quot;') + '">' + title + '</option>';
      }).join('');
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? 'Sending…' : submitBtnLabel;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (errorMsg) errorMsg.style.display = 'none';

    var firstInvalid = null;
    for (var i = 0; i < REQUIRED_IDS.length; i++) {
      var el = document.getElementById(REQUIRED_IDS[i]);
      if (el && !el.value.trim()) {
        firstInvalid = el;
        break;
      }
    }
    if (firstInvalid) {
      if (firstInvalid.reportValidity) firstInvalid.reportValidity();
      else firstInvalid.focus();
      return;
    }

    var payload = {};
    FIELD_IDS.forEach(function (id) {
      var field = document.getElementById(id);
      payload[id] = field ? field.value.trim() : '';
    });
    var countryEl = document.getElementById('country');
    if (countryEl && countryEl.selectedIndex >= 0) {
      var selected = countryEl.options[countryEl.selectedIndex];
      payload.country_name = selected && countryEl.value ? selected.textContent.trim() : '';
    }
    var hp = document.getElementById('website');
    if (hp) payload.hp = hp.value;

    setSubmitting(true);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (resp) { return resp.json(); })
      .then(function (data) {
        if (!data || !data.ok) throw new Error('backend reported failure');
        form.style.display = 'none';
        if (successMsg) successMsg.style.display = 'block';
      })
      .catch(function () {
        setSubmitting(false);
        if (errorMsg) errorMsg.style.display = 'block';
      });
  });
})();
