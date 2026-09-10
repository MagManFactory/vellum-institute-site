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
} from '../functions/api/offer-lead.js';
import {
  APPLICATION_ENDPOINT,
  APPLICATION_TEXT_IDS,
  buildApplicationPayload,
  buildOfferLeadPayload,
  formatPricingNotes,
} from '../js/offer-application.js';

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
assert.equal(APPLICATION_TEXT_IDS.includes('notes'), false);

const lead = buildOfferLeadPayload({
  fields: payload,
  totals: twoPlusResearch,
  paymentMethod: 'ach',
  hp: '',
});
assert.equal(lead.parentName, 'Ada Lovelace');
assert.equal(lead.paymentMethod, 'ach');
assert.equal(Object.hasOwn(lead, 'notes'), false);

assert.match(APPLICATION_ENDPOINT, /^https:\/\/script\.google\.com\/macros\/s\//);
assert.match(offerHtml, /parentFirst/);
assert.match(offerHtml, /course1/);
assert.match(offerHtml, /value="card"/);
assert.match(offerHtml, /value="ach"/);
assert.equal(offerHtml.includes('value="invoice"'), false);
assert.equal(offerHtml.includes('Anything we should know'), false);
assert.equal(offerHtml.includes('Anything else we should know'), false);
assert.equal(offerHtml.includes('id="notes"'), false);
assert.match(fullAppHtml, /url=\/offer\//);
assert.match(redirects, /\/full-application\.html \/offer\/ 302/);

console.log('offer pricing cases passed');
