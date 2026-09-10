import assert from 'node:assert/strict';
import { computeOfferTotals as clientCompute, SEMINAR_PRICE, RESEARCH_PRICE } from '../js/offer-pricing.js';
import { computeOfferTotals as fnCompute } from '../functions/_lib/pricing.js';
import {
  PAYMENT_METHODS,
  isAcceptedPaymentMethod,
  normalizeLeadNotes,
} from '../functions/api/offer-lead.js';

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

console.log('offer pricing cases passed');
