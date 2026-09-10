import { formatUsd } from './offer-pricing.js';

export const APPLICATION_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwmiM-ikPVH0yS9jCdO5VZDp0Q-W7xHhq7rTE24Dj6oDutkRSEGrgiT1ANigtGx_mFiJg/exec';

export const COURSES = [
  'AI and Society',
  'Social Entrepreneurship',
  'Media Psychology',
  'Geopolitics in the Age of AI',
  'Environmental Sustainability in Business',
  'Behavioral Economics',
  'Japanese Media, Culture, and Society: From Buddhist Texts to Global Anime',
];

export const APPLICATION_TEXT_IDS = [
  'parentFirst', 'parentLast', 'studentName', 'email', 'phone', 'cohort',
  'grade', 'school', 'location', 'gpa', 'testing', 'testScore', 'interests',
  'school1', 'school2', 'school3', 'school4', 'school5',
  'course1', 'course2', 'course3',
  'secondCourse1', 'secondCourse2',
  'suppOther', 'heard',
];

export const APPLICATION_REQUIRED_IDS = [
  'parentFirst', 'parentLast', 'studentName', 'email', 'grade', 'cohort',
  'course1', 'school1', 'school2', 'school3',
];

export function fillCourseSelect(select) {
  if (!select) return;
  select.innerHTML = '<option value="">Select a course</option>'
    + COURSES.map((course) => `<option value="${course}">${course}</option>`).join('');
}

export function paymentLabel(paymentMethod) {
  return String(paymentMethod || '').toLowerCase() === 'ach'
    ? 'ACH / bank transfer'
    : 'card';
}

export function formatPricingNotes(totals, paymentMethod) {
  const seminarBit = totals.seminarCount === 2 ? '2 seminars' : '1 seminar';
  const researchBit = totals.includeResearch ? ' + guided research add-on' : '';
  const parts = [
    `Pricing preference (not a charge): ${seminarBit}${researchBit}`,
    `Seminar subtotal ${formatUsd(totals.seminarSubtotal)}`,
  ];
  if (totals.seminarDiscount) {
    parts.push(`Bundle discount ${formatUsd(-totals.seminarDiscount)} on seminar tuition only`);
  }
  if (totals.includeResearch) {
    parts.push(`Research add-on ${formatUsd(totals.researchTotal)}`);
  }
  parts.push(`Package total ${formatUsd(totals.grandTotal)}`);
  parts.push(`Payment preference: ${paymentLabel(paymentMethod)}`);
  return `${parts.join('. ')}.`;
}

export function buildApplicationPayload({
  fields,
  supplementary,
  secondCourseThisCohort,
  totals,
  paymentMethod,
  hp,
}) {
  const payload = { source: 'full-application', sourcePage: 'offer' };
  APPLICATION_TEXT_IDS.forEach((id) => {
    payload[id] = fields && fields[id] ? String(fields[id]).trim() : '';
  });
  payload.notes = formatPricingNotes(totals, paymentMethod);
  payload.secondCourseThisCohort = !!secondCourseThisCohort;
  payload.supplementary = supplementary || '';
  payload.hp = hp || '';
  payload.seminarCount = totals.seminarCount;
  payload.includeResearch = !!totals.includeResearch;
  payload.paymentMethod = String(paymentMethod || '').toLowerCase();
  payload.seminarSubtotal = totals.seminarSubtotal;
  payload.seminarDiscount = totals.seminarDiscount;
  payload.researchTotal = totals.researchTotal;
  payload.grandTotal = totals.grandTotal;
  payload.charged = false;
  return payload;
}

export function endpointIsConfigured(url) {
  return typeof url === 'string'
    && url.indexOf('REPLACE_WITH_APPLICATIONS_GAS_EXEC_URL') === -1
    && /^https:\/\//i.test(url);
}

export function buildOfferLeadPayload({ fields, totals, paymentMethod, hp }) {
  return {
    parentName: `${(fields.parentFirst || '').trim()} ${(fields.parentLast || '').trim()}`.trim(),
    studentName: (fields.studentName || '').trim(),
    email: (fields.email || '').trim(),
    phone: (fields.phone || '').trim(),
    seminarCount: totals.seminarCount,
    includeResearch: !!totals.includeResearch,
    paymentMethod: String(paymentMethod || '').toLowerCase(),
    website: hp || '',
  };
}
