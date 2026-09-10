export const SEMINAR_PRICE = 1750;
export const RESEARCH_PRICE = 3300;
export const BUNDLE_SEMINAR_COUNT = 2;
export const BUNDLE_DISCOUNT_RATE = 0.1;

export function computeOfferTotals(seminarCount, includeResearch) {
  const n = Number(seminarCount) === BUNDLE_SEMINAR_COUNT ? BUNDLE_SEMINAR_COUNT : 1;
  const research = !!includeResearch;
  const seminarSubtotal = n * SEMINAR_PRICE;
  const seminarDiscount = n === BUNDLE_SEMINAR_COUNT
    ? Math.round(seminarSubtotal * BUNDLE_DISCOUNT_RATE)
    : 0;
  const seminarTotal = seminarSubtotal - seminarDiscount;
  const researchTotal = research ? RESEARCH_PRICE : 0;
  return {
    seminarCount: n,
    includeResearch: research,
    seminarUnitPrice: SEMINAR_PRICE,
    seminarSubtotal,
    seminarDiscount,
    seminarTotal,
    researchTotal,
    grandTotal: seminarTotal + researchTotal,
    bundleApplied: n === BUNDLE_SEMINAR_COUNT,
  };
}
