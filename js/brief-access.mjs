export const SUBSCRIBER_COOKIE = 'vellum_brief_sub';
export const SUBSCRIBER_STORAGE_KEY = 'vellumBriefSubscriber';
export const SUBSCRIBER_MAX_AGE = 60 * 60 * 24 * 400;
export const PUBLIC_DATE_KEY = '2026-10-10';
export const SIGNUP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwPlrYuRWkWUdllbBmIofivxwuXHA-gbejsVCSpJmE_DdRaSeNpFIGF3XCmEsCCBQj_uQ/exec';
export const ISSUE_PATH = '/newsletter/issue-03/';
export const ACCESS_PATH = '/newsletter/issue-03/access/';

const TEMPLATE_OPEN = '<template id="issue-template">';
const TEMPLATE_CLOSE = '</template><!-- /issue-template -->';
const GATE_OPEN = '<div class="wrap" id="issue-gate">';
const GATE_HIDDEN = '<div class="wrap" id="issue-gate" hidden>';
const ROBOTS_META = '<meta name="robots" content="noindex, nofollow" data-brief-robots="gated">';

export function pacificDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function isBriefPublic(date = new Date()) {
  return pacificDateKey(date) >= PUBLIC_DATE_KEY;
}

export function hasSubscriberCookie(cookieHeader) {
  if (!cookieHeader) return false;
  return cookieHeader.split(';').some((part) => {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) return false;
    return trimmed.slice(0, eq) === SUBSCRIBER_COOKIE && trimmed.slice(eq + 1) === '1';
  });
}

export function decideIssueAccess({ cookieHeader = '', now = new Date() } = {}) {
  const publicNow = isBriefPublic(now);
  const subscriber = hasSubscriberCookie(cookieHeader);
  return { publicNow, subscriber, open: publicNow || subscriber };
}

export function applyIssueAccessHtml(html, { open, publicNow }) {
  let next = html;
  if (open && next.includes(TEMPLATE_OPEN)) {
    next = next.replace(TEMPLATE_OPEN, '<div id="issue-rendered">');
    next = next.replace(TEMPLATE_CLOSE, '</div><!-- /issue-rendered -->');
    next = next.replace(GATE_OPEN, GATE_HIDDEN);
  }
  if (publicNow) {
    next = next.replace(ROBOTS_META, '');
  }
  return next;
}

export function grantSubscriberAccess() {
  if (typeof document === 'undefined') return;
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SUBSCRIBER_COOKIE}=1; Path=/; Max-Age=${SUBSCRIBER_MAX_AGE}; SameSite=Lax${secure}`;
  try {
    localStorage.setItem(SUBSCRIBER_STORAGE_KEY, '1');
  } catch (err) {
    /* Storage can be blocked. The cookie is the other mark. */
  }
}

export function hasIssueAccess(now = new Date()) {
  if (isBriefPublic(now)) return true;
  if (typeof document !== 'undefined' && hasSubscriberCookie(document.cookie)) return true;
  try {
    return localStorage.getItem(SUBSCRIBER_STORAGE_KEY) === '1';
  } catch (err) {
    return false;
  }
}

function wireRoleOther(form) {
  const role = form.querySelector('[name="role"]');
  const other = form.querySelector('[name="role_other"]');
  if (!role || !other || role.dataset.briefRoleWired === '1') return;
  role.dataset.briefRoleWired = '1';
  const sync = () => {
    const show = role.value === 'Other';
    other.hidden = !show;
    other.required = show;
    if (!show) other.value = '';
  };
  role.addEventListener('change', sync);
  sync();
}

function revealIssue() {
  const gate = document.getElementById('issue-gate');
  if (gate) gate.hidden = true;
  if (!document.getElementById('issue-rendered')) {
    const template = document.getElementById('issue-template');
    if (!template) return;
    const mount = document.createElement('div');
    mount.id = 'issue-rendered';
    mount.appendChild(template.content.cloneNode(true));
    template.replaceWith(mount);
  }
}

function focusIssueHeading() {
  const heading = document.querySelector('#issue-rendered h1');
  if (!heading) return;
  heading.setAttribute('tabindex', '-1');
  heading.focus();
}

async function submitBriefSignup(form) {
  const body = new URLSearchParams(new FormData(form));
  await fetch(form.action, {
    method: 'POST',
    mode: 'no-cors',
    body
  });
}

function wireBriefSignup(form) {
  if (!form || form.dataset.briefWired === '1') return;
  form.dataset.briefWired = '1';
  wireRoleOther(form);
  form.addEventListener('submit', (event) => {
    const redirectTo = form.getAttribute('data-brief-redirect');
    if (!redirectTo) return;
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    const error = form.querySelector('.form-error');
    if (error) error.hidden = true;
    if (button) button.disabled = true;
    submitBriefSignup(form)
      .then(() => {
        window.location.assign(redirectTo);
      })
      .catch(() => {
        if (button) button.disabled = false;
        if (error) error.hidden = false;
      });
  });
}

function promotePublicArchive() {
  if (!isBriefPublic()) return;
  const list = document.getElementById('subscriber-issues');
  const archive = document.getElementById('public-archive');
  if (!list || !archive) return;
  const meta = list.querySelector('.issue-meta');
  if (meta) meta.textContent = 'Oct 2026';
  const note = document.getElementById('subscriber-note');
  if (note) note.textContent = 'Issue 03 is public as of October 10, 2026.';
  if (!archive.querySelector('a[href="/newsletter/issue-03/"]')) {
    const item = list.querySelector('li');
    if (item) archive.insertAdjacentHTML('afterbegin', item.outerHTML);
  }
}

function initBriefPages() {
  document.querySelectorAll('form[data-brief-redirect]').forEach((form) => {
    wireBriefSignup(form);
  });

  const claim = document.getElementById('claim-access');
  if (claim) {
    claim.addEventListener('click', () => {
      grantSubscriberAccess();
      revealIssue();
      focusIssueHeading();
    });
  }

  if (document.body && document.body.dataset.briefGrant === 'access') {
    grantSubscriberAccess();
  }

  if (document.getElementById('issue-template') || document.getElementById('issue-rendered')) {
    if (hasIssueAccess()) revealIssue();
  }

  promotePublicArchive();
}

if (typeof document !== 'undefined') {
  initBriefPages();
}
