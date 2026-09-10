import { computeOfferTotals } from '../_lib/pricing.js';
import { json, verifySession } from '../_lib/session.js';

export const PAYMENT_METHODS = new Set(['card', 'ach']);
const MAX_FIELD = 200;

function clean(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizePaymentMethod(value) {
  return clean(value, 20).toLowerCase();
}

export function isAcceptedPaymentMethod(value) {
  return PAYMENT_METHODS.has(normalizePaymentMethod(value));
}

export function normalizeLeadNotes() {
  // Notes are no longer collected. Tolerate omitted or leftover payloads.
  return '';
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(await verifySession(request, env))) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  const contentType = request.headers.get('content-type') || '';
  let body = {};
  try {
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400);
  }

  if (clean(body.website || body.hp, 80)) {
    return json({ ok: true, stored: 'ignored', charged: false });
  }

  const parentName = clean(body.parentName, MAX_FIELD);
  const studentName = clean(body.studentName, MAX_FIELD);
  const email = clean(body.email, MAX_FIELD);
  const phone = clean(body.phone, 40);
  const notes = normalizeLeadNotes(body.notes);
  const paymentMethod = normalizePaymentMethod(body.paymentMethod);
  const seminarCount = Number(body.seminarCount) === 2 ? 2 : 1;
  const includeResearch = body.includeResearch === true
    || body.includeResearch === 'true'
    || body.includeResearch === '1'
    || body.includeResearch === 'on';

  if (!parentName || !studentName || !isEmail(email) || !isAcceptedPaymentMethod(paymentMethod)) {
    return json({ ok: false, error: 'invalid_fields' }, 400);
  }

  const totals = computeOfferTotals(seminarCount, includeResearch);
  const record = {
    createdAt: new Date().toISOString(),
    parentName,
    studentName,
    email,
    phone,
    notes,
    paymentMethod,
    ...totals,
    charged: false,
  };

  let stored = 'stub';

  if (env && env.DB) {
    try {
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS offer_leads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at TEXT NOT NULL,
          parent_name TEXT,
          student_name TEXT,
          email TEXT,
          phone TEXT,
          seminar_count INTEGER,
          include_research INTEGER,
          payment_method TEXT,
          seminar_subtotal INTEGER,
          seminar_discount INTEGER,
          research_total INTEGER,
          grand_total INTEGER,
          notes TEXT
        )`
      ).run();
      await env.DB.prepare(
        `INSERT INTO offer_leads (
          created_at, parent_name, student_name, email, phone,
          seminar_count, include_research, payment_method,
          seminar_subtotal, seminar_discount, research_total, grand_total, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        record.createdAt,
        record.parentName,
        record.studentName,
        record.email,
        record.phone,
        record.seminarCount,
        record.includeResearch ? 1 : 0,
        record.paymentMethod,
        record.seminarSubtotal,
        record.seminarDiscount,
        record.researchTotal,
        record.grandTotal,
        record.notes
      ).run();
      stored = 'd1';
    } catch {
      stored = 'stub';
    }
  }

  if (env && env.OFFER_LEAD_WEBHOOK) {
    try {
      const resp = await fetch(env.OFFER_LEAD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (resp.ok && stored === 'stub') stored = 'webhook';
      if (resp.ok && stored === 'd1') stored = 'd1+webhook';
    } catch {
      // Keep the accepted stub/D1 outcome. Do not fail the family on webhook errors.
    }
  }

  return json({
    ok: true,
    stored,
    charged: false,
    totals,
  });
}

export async function onRequestGet() {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
