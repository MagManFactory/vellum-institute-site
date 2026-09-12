import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const { courses, faqs } = JSON.parse(read('scripts/seo-content.json'));

const pages = {
  '/': { file: 'index.html', title: 'Vellum Institute | Live seminars with real faculty' },
  '/about/': { file: 'about/index.html', title: 'About Vellum | Vellum Institute' },
  '/courses/': { file: 'courses/index.html', title: 'Courses and seminars | Vellum Institute' },
  '/how-it-works/': { file: 'how-it-works/index.html', title: 'How Vellum works | Vellum Institute' },
  '/pricing/': { file: 'pricing/index.html', title: 'Seminar pricing | Vellum Institute' },
  '/guided-research/': { file: 'guided-research/index.html', title: 'Guided research and apprenticeship | Vellum Institute' },
  '/faq/': { file: 'faq/index.html', title: 'FAQ | Vellum Institute' },
  '/apply/': { file: 'apply/index.html', title: 'Apply to Vellum | Vellum Institute' },
  '/counselors/': { file: 'counselors/index.html', title: 'Counselors &amp; advisors | Vellum Institute' },
  '/insights/': { file: 'insights/index.html', title: 'Insights | Vellum Institute' },
  '/insights/college-selectivity/': { file: 'insights/college-selectivity/index.html', title: 'Selective-college acceptance rates | Vellum Institute' },
  '/privacy/': { file: 'privacy/index.html', title: 'Privacy Notice | Vellum Institute' },
  '/newsletter/': { file: 'newsletter/index.html', title: 'The Vellum Brief | Vellum Institute' },
  '/offer/': { file: 'offer/index.html', title: 'Seminar tuition and application | Vellum Institute' }
};

const titles = Object.values(pages).map((page) => page.title);
assert.equal(new Set(titles).size, titles.length, 'page titles must be unique');

for (const [path, page] of Object.entries(pages)) {
  const html = read(page.file);
  assert.match(html, new RegExp(`<title>${page.title}</title>`), `${path} title`);
  assert.match(html, /<meta name="description" content="[^"]+"/, `${path} description`);
  assert.match(html, /googletagmanager\.com\/gtag\/js\?id=G-W4TVNVLX3X/, `${path} gtag src`);
  assert.match(html, /\/js\/gtag\.js/, `${path} gtag config`);
  if (path !== '/offer/') {
    assert.match(html, /EducationalOrganization/, `${path} Organization JSON-LD`);
  }
}

const titleSet = new Set([
  read('index.html').match(/<title>([^<]+)<\/title>/)[1],
  read('pricing/index.html').match(/<title>([^<]+)<\/title>/)[1],
  read('faq/index.html').match(/<title>([^<]+)<\/title>/)[1],
  read('courses/index.html').match(/<title>([^<]+)<\/title>/)[1]
]);
assert.equal(titleSet.size, 4, 'home/pricing/faq/courses titles must differ');

const descSet = new Set([
  read('index.html').match(/<meta name="description" content="([^"]+)"/)[1],
  read('pricing/index.html').match(/<meta name="description" content="([^"]+)"/)[1],
  read('faq/index.html').match(/<meta name="description" content="([^"]+)"/)[1],
  read('courses/index.html').match(/<meta name="description" content="([^"]+)"/)[1]
]);
assert.equal(descSet.size, 4, 'home/pricing/faq/courses descriptions must differ');

const faqHtml = read('faq/index.html');
const homeHtml = read('index.html');
for (const item of faqs) {
  assert.match(faqHtml, new RegExp(item.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(homeHtml, new RegExp(item.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const snippet = item.a ? item.a.slice(0, 40) : 'Complete the short survey and we send';
  assert.ok(faqHtml.includes(snippet), `faq page missing answer snippet: ${snippet}`);
  assert.ok(homeHtml.includes(snippet), `homepage missing answer snippet: ${snippet}`);
}
assert.match(faqHtml, /"@type":"FAQPage"/);
assert.match(faqHtml, /Who is Vellum Institute for\?/);
assert.doesNotMatch(faqHtml, /id="faqList"><\/div>/);

const coursesHtml = read('courses/index.html');
for (const course of courses) {
  assert.ok(coursesHtml.includes(course.title), `courses page missing ${course.title}`);
  assert.ok(homeHtml.includes(course.title), `homepage missing ${course.title}`);
}
assert.match(coursesHtml, /"@type":"Course"/);
assert.match(read('pricing/index.html'), /By inquiry/);
assert.match(read('pricing/index.html'), /Eight live 90-minute sessions/);

const sitemap = read('sitemap.xml');
assert.match(sitemap, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
for (const path of ['/', '/about/', '/courses/', '/how-it-works/', '/pricing/', '/guided-research/', '/faq/', '/apply/', '/counselors/', '/newsletter/', '/insights/', '/insights/college-selectivity/', '/privacy/']) {
  assert.match(sitemap, new RegExp(`<loc>https://velluminstitute.org${path}</loc>`));
}
assert.doesNotMatch(sitemap, /velluminstitute\.org\/offer\//);

const llms = read('llms.txt');
assert.match(llms, /Vellum Institute/);
assert.match(llms, /https:\/\/velluminstitute\.org\/courses\//);
assert.match(llms, /https:\/\/velluminstitute\.org\/faq\//);
assert.match(llms, /https:\/\/velluminstitute\.org\/insights\/college-selectivity\//);
assert.match(read('_headers'), /\/llms\.txt\s+Content-Type: text\/plain; charset=utf-8/);
assert.match(read('robots.txt'), /Sitemap: https:\/\/velluminstitute\.org\/sitemap\.xml/);

assert.equal(existsSync(join(root, 'wrangler.toml')), true, 'do not strip wrangler.toml');
assert.match(read('counselors/index.html'), /The Hidden Rules of College/);
assert.match(read('pricing/index.html'), />By inquiry</);
assert.doesNotMatch(read('pricing/index.html'), /\$1,750/);

const insightsHtml = read('insights/college-selectivity/index.html');
assert.match(homeHtml, /href="\/insights\/college-selectivity\/"/);
assert.match(insightsHtml, /oira\.harvard\.edu\/factbook\/fact-book-admissions/);
assert.match(insightsHtml, /irds\.stanford\.edu\/data-findings\/cds/);
assert.match(insightsHtml, /upenn\.edu\/about\/facts/);
assert.match(insightsHtml, /communications\.williams\.edu\/media-relations\/fast-facts/);
assert.match(insightsHtml, /amherst\.edu\/about\/facts\/common_data_sets/);
assert.match(insightsHtml, /swarthmore\.edu\/sites\/default\/files\/assets\/documents\/admissions-aid/);
assert.match(insightsHtml, /middlebury\.edu\/sites\/default\/files\/2025-04\/Middlebury%20CDS%202024_2025\.pdf/);
assert.match(insightsHtml, /bowdoin\.edu\/ir\/pdf\/bowdoin-cds_2025-2026\.pdf/);
assert.match(insightsHtml, /Retrieved 11 September 2026/);
assert.match(insightsHtml, /41\.5%/);
assert.doesNotMatch(insightsHtml, /The Hidden Rules of College/);
assert.match(read('counselors/index.html'), /The Hidden Rules of College/);

const insightRows = [...insightsHtml.matchAll(/data-school="([^"]+)" data-old-app="(\d+)" data-old-adm="(\d+)" data-new-app="(\d+)" data-new-adm="(\d+)"/g)];
assert.equal(insightRows.length, 8, 'eight sourced school rows');
let relSum = 0;
for (const row of insightRows) {
  const oldRate = Number(row[3]) / Number(row[2]);
  const newRate = Number(row[5]) / Number(row[4]);
  assert.ok(newRate < oldRate, `${row[1]} recent rate should be below baseline`);
  relSum += (oldRate - newRate) / oldRate;
}
assert.ok(Math.abs(relSum / 8 - 0.415) < 0.01, 'mean relative decline should be about 41.5%');

const insightTitle = insightsHtml.match(/<title>([^<]+)<\/title>/)[1];
const homeTitle = homeHtml.match(/<title>([^<]+)<\/title>/)[1];
assert.notEqual(insightTitle, homeTitle);
const insightDesc = insightsHtml.match(/<meta name="description" content="([^"]+)"/)[1];
const homeDesc = homeHtml.match(/<meta name="description" content="([^"]+)"/)[1];
assert.notEqual(insightDesc, homeDesc);

console.log('seo phase 1 checks passed');
