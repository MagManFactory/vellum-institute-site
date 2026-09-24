import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACCESS_PATH,
  ISSUE_PATH,
  PUBLIC_DATE_KEY,
  SIGNUP_ENDPOINT,
  SUBSCRIBER_COOKIE,
  applyIssueAccessHtml,
  decideIssueAccess,
  hasSubscriberCookie,
  isBriefPublic,
  pacificDateKey
} from '../js/brief-access.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const beforePublic = new Date('2026-10-10T06:59:59.000Z');
const atPublic = new Date('2026-10-10T07:00:00.000Z');

assert.equal(pacificDateKey(beforePublic), '2026-10-09');
assert.equal(pacificDateKey(atPublic), PUBLIC_DATE_KEY);
assert.equal(isBriefPublic(beforePublic), false);
assert.equal(isBriefPublic(atPublic), true);
assert.equal(isBriefPublic(new Date('2026-09-24T18:00:00.000Z')), false);
assert.equal(isBriefPublic(new Date('2026-11-02T08:00:00.000Z')), true);
assert.equal(isBriefPublic(new Date('2027-01-01T08:00:00.000Z')), true);

assert.equal(hasSubscriberCookie(''), false);
assert.equal(hasSubscriberCookie('other=1'), false);
assert.equal(hasSubscriberCookie(`${SUBSCRIBER_COOKIE}=1`), true);
assert.equal(hasSubscriberCookie(`theme=dark; ${SUBSCRIBER_COOKIE}=1`), true);
assert.equal(hasSubscriberCookie(`${SUBSCRIBER_COOKIE}=0`), false);
assert.equal(hasSubscriberCookie(`prefix${SUBSCRIBER_COOKIE}=1`), false);

assert.deepEqual(decideIssueAccess({ cookieHeader: '', now: beforePublic }), {
  publicNow: false,
  subscriber: false,
  open: false
});
assert.equal(decideIssueAccess({ cookieHeader: `${SUBSCRIBER_COOKIE}=1`, now: beforePublic }).open, true);
assert.equal(decideIssueAccess({ cookieHeader: '', now: atPublic }).open, true);
assert.equal(decideIssueAccess({ cookieHeader: '', now: atPublic }).publicNow, true);

const sample = [
  '<meta name="robots" content="noindex, nofollow" data-brief-robots="gated">',
  '<div class="wrap" id="issue-gate"><p>Gate</p></div>',
  '<template id="issue-template"><p>GEORGETOWN NOW ACCEPTS</p></template><!-- /issue-template -->'
].join('');

const gated = applyIssueAccessHtml(sample, { open: false, publicNow: false });
assert.match(gated, /<template id="issue-template">/);
assert.match(gated, /data-brief-robots="gated"/);
assert.doesNotMatch(gated, /id="issue-gate" hidden/);

const subscriber = applyIssueAccessHtml(sample, { open: true, publicNow: false });
assert.match(subscriber, /id="issue-rendered"/);
assert.match(subscriber, /id="issue-gate" hidden/);
assert.match(subscriber, /GEORGETOWN NOW ACCEPTS/);
assert.doesNotMatch(subscriber, /<template id="issue-template">/);
assert.match(subscriber, /data-brief-robots="gated"/);

const publicHtml = applyIssueAccessHtml(sample, { open: true, publicNow: true });
assert.doesNotMatch(publicHtml, /data-brief-robots="gated"/);
assert.match(publicHtml, /id="issue-rendered"/);

const index = read('newsletter/index.html');
const subscribersAt = index.indexOf('>Newsletter Subscribers<');
const archiveAt = index.indexOf('>Archive<');
assert.ok(subscribersAt > 0 && subscribersAt < archiveAt, 'Newsletter Subscribers sits above Archive');
const archiveChunk = index.slice(index.indexOf('id="public-archive"'), index.indexOf('class="signup-card"'));
assert.match(archiveChunk, /\/newsletter\/issue-01\//);
assert.match(archiveChunk, /\/newsletter\/issue-02\//);
assert.doesNotMatch(archiveChunk, /\/newsletter\/issue-03\//);
assert.match(index, /id="subscriber-issues"[\s\S]*\/newsletter\/issue-03\//);
assert.match(index, /October 10, 2026/);
assert.match(index, new RegExp(`action="${SIGNUP_ENDPOINT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
assert.match(index, /name="source" value="site_newsletter"/);
assert.match(index, /data-brief-redirect="\/newsletter\/issue-03\/access\/"/);
for (const field of ['first_name', 'last_name', 'email', 'role', 'role_other', 'consent']) {
  assert.match(index, new RegExp(`name="${field}"`));
}

const issue = read('newsletter/issue-03/index.html');
const access = read('newsletter/issue-03/access/index.html');
const gateAt = issue.indexOf('id="issue-gate"');
const templateAt = issue.indexOf('<template id="issue-template">');
const storyAt = issue.indexOf('GEORGETOWN NOW ACCEPTS THE COMMON APPLICATION');
const templateEnd = issue.indexOf('</template><!-- /issue-template -->');
assert.ok(gateAt > 0 && gateAt < templateAt && templateAt < storyAt && storyAt < templateEnd);
assert.match(issue, /If you are subscribed to The Vellum Brief, you can read this issue now/);
assert.match(issue, /October 10, 2026/);
assert.match(issue, /id="claim-access"/);
assert.match(issue, /data-brief-robots="gated"/);
assert.match(issue, /src="\/js\/brief-access\.mjs"/);
assert.match(issue, new RegExp(`action="${SIGNUP_ENDPOINT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
assert.match(issue, /name="source" value="site_newsletter"/);
assert.match(issue, /Mailing Address: 1968 S\. Coast Hwy #5495, Laguna Beach, CA 92651/);
assert.equal(issue.split('Mailing Address:').length - 1, 1);

const customer = [
  issue.slice(issue.indexOf('<main'), issue.indexOf('</main>') + 7),
  access.slice(access.indexOf('<main'), access.indexOf('</main>') + 7),
  index.slice(subscribersAt, index.indexOf('class="signup-card"'))
].join('\n');
assert.doesNotMatch(customer, /—/, 'customer copy should not use em dashes');
assert.doesNotMatch(customer, /\b(I'm|don't|can't|won't|it's|you're|they're|that's|we'll|isn't|aren't|doesn't|didn't|let's)\b/i);

for (const heading of [
  'GEORGETOWN NOW ACCEPTS THE COMMON APPLICATION',
  'AT GEORGETOWN, EARLY SUBMISSION IS ABOUT THE INTERVIEW CLOCK',
  'PRIOR RESEARCH EXPERIENCE IS A SIGNAL, NOT A SHORTCUT',
  'HOW TO JUDGE A HIGH-SCHOOL RESEARCH OR MENTORSHIP OFFER',
  'NOVEMBER EARLY ROUNDS NEED ONE CHECKLIST PER COLLEGE',
  'DATAWATCH',
  'WHAT WE ARE WATCHING',
  'VELLUM INSTITUTE'
]) {
  assert.ok(issue.includes(heading), `missing ${heading}`);
}

assert.match(access, /data-brief-grant="access"/);
assert.match(access, /You are subscribed/);
assert.match(access, /href="\/newsletter\/issue-03\/"/);
assert.match(access, /<meta name="robots" content="noindex, nofollow">/);
assert.doesNotMatch(access, /GEORGETOWN NOW ACCEPTS/);
assert.match(access, /src="\/js\/brief-access\.mjs"/);

const sitemap = read('sitemap.xml');
assert.match(sitemap, /<loc>https:\/\/velluminstitute\.org\/newsletter\/issue-03\/<\/loc>/);
assert.doesNotMatch(sitemap, /newsletter\/issue-03\/access/);
assert.match(read('robots.txt'), /Disallow: \/newsletter\/issue-03\/access\//);
assert.match(read('robots.txt'), /Sitemap: https:\/\/velluminstitute\.org\/sitemap\.xml/);
assert.match(read('_headers'), /\/newsletter\/issue-03\/access\/\n {2}X-Robots-Tag: noindex, nofollow/);

assert.equal(ISSUE_PATH, '/newsletter/issue-03/');
assert.equal(ACCESS_PATH, '/newsletter/issue-03/access/');

const opened = applyIssueAccessHtml(issue, { open: true, publicNow: true });
assert.doesNotMatch(opened, /<template id="issue-template">/);
assert.match(opened, /id="issue-gate" hidden/);
assert.doesNotMatch(opened, /data-brief-robots="gated"/);
assert.match(opened, /GEORGETOWN NOW ACCEPTS THE COMMON APPLICATION/);

console.log('brief access checks passed');
