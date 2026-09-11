import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { computeOfferTotals as clientCompute, SEMINAR_PRICE, RESEARCH_PRICE } from '../js/offer-pricing.js';
import { computeOfferTotals as fnCompute } from '../functions/_lib/pricing.js';
import {
  PAYMENT_METHODS,
  isAcceptedPaymentMethod,
  normalizeLeadNotes,
  normalizeCountry,
} from '../functions/api/offer-lead.js';
import {
  APPLICATION_ENDPOINT,
  APPLICATION_REQUIRED_IDS,
  APPLICATION_TEXT_IDS,
  COURSES,
  buildApplicationPayload,
  buildOfferLeadPayload,
  formatPricingNotes,
} from '../js/offer-application.js';
import {
  COUNTRIES,
  COUNTRY_PLACEHOLDER,
  countryNameFromCode,
  orderedCountriesForSelect,
} from '../js/countries.js';

const root = dirname(fileURLToPath(import.meta.url));
const offerHtml = readFileSync(join(root, '../offer/index.html'), 'utf8');
const fullAppHtml = readFileSync(join(root, '../full-application.html'), 'utf8');
const redirects = readFileSync(join(root, '../_redirects'), 'utf8');

const cases = [
  [1, false, { seminarSubtotal: 1750, seminarDiscount: 0, researchTotal: 0, grandTotal: 1750 }],
  [2, false, { seminarSubtotal: 3500, seminarDiscount: 350, researchTotal: 0, grandTotal: 3150 }],
  [1, true, { seminarSubtotal: 1750, seminarDiscount: 0, researchTotal: 3300, grandTotal: 5050 }],
  [2, true, { seminarSubtotal: 3500, seminarDiscount: 350, researchTotal: 3300, grandTotal: 6450 }],
  [99, false, { seminarCount: 1, seminarSubtotal: 1750, seminarDiscount: 0, grandTotal: 1750 }],
];

for (const [count, research, expected] of cases) {
  const client = clientCompute(count, research);
  const server = fnCompute(count, research);
  assert.deepEqual(client, server, `client/server mismatch for ${count}/${research}`);
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(client[key], value, `${count}/${research} ${key}`);
  }
  if (client.bundleApplied) {
    assert.equal(client.seminarDiscount, Math.round(client.seminarSubtotal * 0.1));
    assert.equal(client.researchTotal, research ? RESEARCH_PRICE : 0);
  }
}

assert.equal(SEMINAR_PRICE, 1750);
assert.equal(RESEARCH_PRICE, 3300);

assert.deepEqual([...PAYMENT_METHODS].sort(), ['ach', 'card']);
assert.equal(isAcceptedPaymentMethod('card'), true);
assert.equal(isAcceptedPaymentMethod('ACH'), true);
assert.equal(isAcceptedPaymentMethod('invoice'), false);
assert.equal(isAcceptedPaymentMethod(''), false);
assert.equal(normalizeLeadNotes(undefined), '');
assert.equal(normalizeLeadNotes('Course interests, timing, or questions.'), '');

const twoPlusResearch = clientCompute(2, true);
const notes = formatPricingNotes(twoPlusResearch, 'ach');
assert.match(notes, /2 seminars/);
assert.match(notes, /guided research/);
assert.match(notes, /ACH \/ bank transfer/);
assert.match(notes, /\$6,450/);
assert.equal(/invoice/i.test(notes), false);

const payload = buildApplicationPayload({
  fields: {
    parentFirst: 'Ada',
    parentLast: 'Lovelace',
    studentName: 'Student Name',
    email: 'family@example.com',
    country: 'GB',
    notes: 'should be ignored',
  },
  supplementary: 'AoPS',
  secondCourseThisCohort: true,
  totals: twoPlusResearch,
  paymentMethod: 'card',
  hp: '',
});
assert.equal(payload.source, 'full-application');
assert.equal(payload.sourcePage, 'offer');
assert.equal(payload.parentFirst, 'Ada');
assert.equal(payload.parentLast, 'Lovelace');
assert.equal(payload.notes, formatPricingNotes(twoPlusResearch, 'card'));
assert.equal(payload.notes.includes('Anything we should know'), false);
assert.equal(payload.paymentMethod, 'card');
assert.equal(payload.grandTotal, 6450);
assert.equal(payload.charged, false);
assert.equal(payload.country, 'GB');
assert.equal(payload.country_name, 'United Kingdom');
assert.equal(APPLICATION_TEXT_IDS.includes('notes'), false);
assert.equal(APPLICATION_TEXT_IDS.includes('country'), true);
assert.equal(APPLICATION_REQUIRED_IDS.includes('country'), true);

const lead = buildOfferLeadPayload({
  fields: payload,
  totals: twoPlusResearch,
  paymentMethod: 'ach',
  hp: '',
});
assert.equal(lead.parentName, 'Ada Lovelace');
assert.equal(lead.paymentMethod, 'ach');
assert.equal(lead.country, 'GB');
assert.equal(lead.country_name, 'United Kingdom');
assert.equal(Object.hasOwn(lead, 'notes'), false);

assert.match(APPLICATION_ENDPOINT, /^https:\/\/script\.google\.com\/macros\/s\//);
assert.match(offerHtml, /parentFirst/);
assert.match(offerHtml, /course1/);
assert.match(offerHtml, /<select id="country"/);
assert.match(offerHtml, /Country <span class="req">\*<\/span>/);
assert.match(offerHtml, /posted JSON includes country/);
assert.equal(offerHtml.includes('<input type="text" id="country"'), false);
assert.match(offerHtml, /value="card"/);
assert.match(offerHtml, /value="ach"/);
assert.equal(offerHtml.includes('value="invoice"'), false);
assert.equal(offerHtml.includes('Anything we should know'), false);
assert.equal(offerHtml.includes('Anything else we should know'), false);
assert.equal(offerHtml.includes('id="notes"'), false);
assert.match(fullAppHtml, /url=\/offer\//);
assert.match(redirects, /\/full-application\.html \/offer\/ 302/);

const homepageHtml = readFileSync(join(root, '../index.html'), 'utf8');
const expectedTitles = [
  'AI and Society',
  'Social Entrepreneurship',
  'Media Psychology',
  'Geopolitics in the Age of AI',
  'Environmental Sustainability in Business',
  'Behavioral Economics',
  'Japanese Media, Culture, and Society: From Buddhist Texts to Global Anime',
];
assert.deepEqual(COURSES, expectedTitles);
assert.equal(COURSES.includes('Biotech Frontiers'), false);
assert.equal(homepageHtml.includes('Biotech Frontiers'), false);
assert.equal(offerHtml.includes('Biotech Frontiers'), false);

const homepageTitles = [...homepageHtml.matchAll(/<div class="course-row-top"><h3>([^<]+)<\/h3>/g)]
  .map((match) => match[1]);
assert.deepEqual(homepageTitles, expectedTitles);
assert.match(homepageHtml, /data-filter="confirmed">FACULTY CONFIRMED/);
assert.match(homepageHtml, /data-filter="consideration">FACULTY UNDER CONSIDERATION/);
assert.match(homepageHtml, /<span class="course-status status-open">FACULTY CONFIRMED<\/span>/);
assert.match(homepageHtml, /<span class="course-status status-progress">FACULTY UNDER CONSIDERATION<\/span>/);
assert.equal(homepageHtml.includes('Faculty match in progress'), false);
assert.equal(homepageHtml.includes('Faculty confirmed'), false);
assert.match(homepageHtml, /By inquiry/);
assert.match(homepageHtml, /<select id="country"/);
assert.match(readFileSync(join(root, '../js/apply-form.js'), 'utf8'), /payload\.country_name/);
assert.match(homepageHtml, /posted JSON includes country/);
assert.equal(homepageHtml.includes('<input type="text" id="country"'), false);
assert.match(homepageHtml, /fillCountrySelect/);

const countryCodes = COUNTRIES.map((row) => row.code);
assert.equal(new Set(countryCodes).size, COUNTRIES.length);
assert.ok(COUNTRIES.length >= 240);
assert.equal(countryNameFromCode('US'), 'United States');
assert.equal(countryNameFromCode('gb'), 'United Kingdom');
assert.equal(orderedCountriesForSelect()[0].code, 'US');
assert.equal(orderedCountriesForSelect()[0].name, 'United States');
assert.equal(COUNTRY_PLACEHOLDER, 'Select country');
assert.equal(normalizeCountry('us'), 'US');
assert.equal(normalizeCountry('United States'), 'United States');
assert.match(readFileSync(join(root, '../functions/api/offer-lead.js'), 'utf8'), /country_name/);

console.log('offer pricing cases passed');
