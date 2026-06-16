/**
 * SaleSquared transactional SMS
 * https://developer.salesquared.io/
 *
 * Required .env:
 *   SALESQUARED_API_KEY        (aka smsapikey)
 *   SALESQUARED_SENDER_ID      (DLT approved senderid)
 *   SALESQUARED_TEMPLATE_ID    (19-digit DLT template id)
 *   SALESQUARED_PE_ID          (19-digit DLT PE-ID)
 *
 * Optional:
 *   SALESQUARED_UNICODE        (default: 0; set 1 for unicode)
 *   SALESQUARED_SCHEDULE_TIME  (YYYY-MM-DD HH:MM:SS)
 *   SALESQUARED_SHORT_URLS
 *   SALESQUARED_GROUP_ID
 *   SALESQUARED_TEST
 *   SALESQUARED_REF_ID
 *   SALESQUARED_SMS_URL        (default: https://api.salesquared.io/sendsms/v1)
 */

import '../config/loadEnv.js';

const DEFAULT_SMS_URL = 'https://api.salesquared.io/sendsms/v1';

function trimEnv(value) {
  let v = String(value ?? '').trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export function isSalesquaredConfigured() {
  return (
    !!trimEnv(process.env.SALESQUARED_API_KEY) &&
    !!trimEnv(process.env.SALESQUARED_SENDER_ID) &&
    !!trimEnv(process.env.SALESQUARED_TEMPLATE_ID) &&
    !!trimEnv(process.env.SALESQUARED_PE_ID)
  );
}

export function getSalesquaredConfigError() {
  if (!trimEnv(process.env.SALESQUARED_API_KEY)) {
    return 'SALESQUARED_API_KEY is missing. Add it to .env and restart the server.';
  }
  if (!trimEnv(process.env.SALESQUARED_SENDER_ID)) {
    return 'SALESQUARED_SENDER_ID is missing. Add your approved 6-character DLT sender ID to .env.';
  }
  if (!trimEnv(process.env.SALESQUARED_TEMPLATE_ID)) {
    return 'SALESQUARED_TEMPLATE_ID is missing. Add your 19-digit DLT approved template_id to .env.';
  }
  if (!trimEnv(process.env.SALESQUARED_PE_ID)) {
    return 'SALESQUARED_PE_ID is missing. Add your 19-digit DLT approved pe_id to .env.';
  }
  return null;
}

/** Last 10 digits for Indian mobiles */
export function normalizeIndianMobileDigits(phone) {
  const d = String(phone ?? '').replace(/\D/g, '');
  if (d.length >= 12 && d.startsWith('91')) return d.slice(-10);
  if (d.length === 11 && d.startsWith('0')) return d.slice(1);
  if (d.length === 10) return d;
  if (d.length > 10) return d.slice(-10);
  return d;
}

function formatSalesquaredError(data, httpStatus) {
  if (!data || typeof data !== 'object') {
    return httpStatus ? `HTTP ${httpStatus}` : 'Unknown SaleSquared error';
  }
  const candidates = [
    data.message,
    data.error,
    data.error_message,
    data.reason,
    data.status_message,
    data.description,
  ];
  for (const c of candidates) {
    if (c == null) continue;
    if (Array.isArray(c) && c.length) return c.join(' ');
    if (String(c).trim()) return String(c);
  }
  try {
    return JSON.stringify(data);
  } catch {
    return 'SaleSquared SMS error';
  }
}

function isSalesquaredAccepted(data, httpStatus) {
  if (httpStatus < 200 || httpStatus >= 300) return false;
  if (!data || typeof data !== 'object') return true;

  const status = String(data.status ?? data.Status ?? '').toLowerCase();
  if (status === 'error' || status === 'failed' || status === 'failure') return false;

  const errorCode = String(data.error_code ?? data.errcode ?? '').trim();
  if (errorCode && errorCode !== '0') return false;

  const total = Number(data.Total_numbers);
  const valid = Number(data.Valid_numbers);
  if (Number.isFinite(total) && total > 0 && Number.isFinite(valid) && valid === 0) {
    return false;
  }

  if (status === 'success') return true;
  if (errorCode === '0') return true;

  return true;
}

function appendIfSet(params, key, envName) {
  const v = trimEnv(process.env[envName]);
  if (v) params.set(key, v);
}

/**
 * Render a DLT-approved template. Use placeholders like {{name}} or {#name#}.
 * The final text must match your approved DLT template exactly (except variable parts).
 */
export function renderSalesquaredTemplate(template, values = {}) {
  let text = String(template ?? '');
  for (const [key, raw] of Object.entries(values)) {
    const value = String(raw ?? '');
    text = text
      .replaceAll(`{{${key}}}`, value)
      .replaceAll(`{#${key}#}`, value)
      .replaceAll(`{${key}}`, value);
  }
  return text.trim();
}

export function buildSalesquaredRegistrationMessage(student) {
  const template = trimEnv(process.env.SALESQUARED_REGISTRATION_TEMPLATE);
  const name = String(student?.studentName || 'Student').trim();
  const year = String(student?.year || '').trim();
  const id = student?.rollNumber
    ? String(student.rollNumber).trim()
    : 'Admission / roll on record';

  if (template) {
    return renderSalesquaredTemplate(template, { name, year, id });
  }

  return `SAHE Hostelers: Dear Parent, ${name}'s hostel registration is confirmed. Year: ${year}. ID: ${id}. Thank you.`;
}

export function buildSalesquaredOutingMessage(outStr, inStr) {
  const template = trimEnv(process.env.SALESQUARED_OUTING_TEMPLATE);
  if (template) {
    return renderSalesquaredTemplate(template, { out: outStr, in: inStr });
  }
  return `Your Child had taken permission for outing from ${outStr} and until ${inStr} dates.`;
}

async function sendSalesquaredToNumber(toNumber, message) {
  const apiKey = trimEnv(process.env.SALESQUARED_API_KEY);
  const senderId = trimEnv(process.env.SALESQUARED_SENDER_ID);
  const templateId = trimEnv(process.env.SALESQUARED_TEMPLATE_ID);
  const peId = trimEnv(process.env.SALESQUARED_PE_ID);
  const smsUrl = trimEnv(process.env.SALESQUARED_SMS_URL) || DEFAULT_SMS_URL;

  if (!apiKey || !senderId || !templateId || !peId) {
    return { ok: false, error: getSalesquaredConfigError() || 'SaleSquared SMS is not configured.' };
  }

  const params = new URLSearchParams();
  params.set('to_numbers', String(toNumber ?? '').trim());
  params.set('message', String(message ?? '').slice(0, 1600));
  params.set('senderid', senderId);
  params.set('api_key', apiKey);
  params.set('template_id', templateId);
  params.set('pe_id', peId);

  // Optional params from env
  params.set('unicode', trimEnv(process.env.SALESQUARED_UNICODE) || '0');
  appendIfSet(params, 'schedule_time', 'SALESQUARED_SCHEDULE_TIME');
  appendIfSet(params, 'short_urls', 'SALESQUARED_SHORT_URLS');
  appendIfSet(params, 'group_id', 'SALESQUARED_GROUP_ID');
  appendIfSet(params, 'test', 'SALESQUARED_TEST');
  appendIfSet(params, 'ref_id', 'SALESQUARED_REF_ID');

  const url = `${smsUrl}?${params.toString()}`;

  try {
    const smsRes = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
    });

    const data = await smsRes.json().catch(() => ({}));
    const ok = isSalesquaredAccepted(data, smsRes.status);

    if (!ok) {
      console.warn('[SaleSquared] Send failed:', {
        httpStatus: smsRes.status,
        to_numbers: params.get('to_numbers'),
        message: formatSalesquaredError(data, smsRes.status),
      });
    }

    const msgId = data.messages?.[0]?.Msg_id ?? data.messages?.[0]?.msg_id;
    if (ok) {
      console.info('[SaleSquared] Accepted SMS:', {
        to_numbers: params.get('to_numbers'),
        Msg_requestid: data.Msg_requestid ?? data.msg_requestid,
        Msg_id: msgId,
      });
    }

    return {
      ok,
      data,
      httpStatus: smsRes.status,
      error: ok ? undefined : formatSalesquaredError(data, smsRes.status),
      requestId: data.Msg_requestid ?? data.msg_requestid ?? data.request_id ?? data.requestId,
      messageId: msgId,
    };
  } catch (err) {
    console.error('sendSalesquaredToNumber:', err);
    return { ok: false, error: err?.message || 'SMS request failed' };
  }
}

/**
 * @param {string} toPhone - parent phone (10-digit Indian)
 * @param {string} message
 */
export async function sendSalesquaredSms(toPhone, message) {
  const digits = normalizeIndianMobileDigits(toPhone);
  if (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
    return { ok: false, error: 'Invalid Indian mobile for SMS' };
  }
  return sendSalesquaredToNumber(digits, message);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One SMS per unique parent number.
 */
export async function sendSalesquaredSequential(phones, message, delayMs = 300) {
  const ms = Number.isFinite(delayMs) && delayMs >= 0 ? delayMs : 300;
  const raw = Array.isArray(phones) ? phones : [phones];
  const seen = new Set();
  const uniq = [];
  for (const p of raw) {
    const d = normalizeIndianMobileDigits(p);
    if (d.length !== 10 || !/^[6-9]\d{9}$/.test(d)) continue;
    if (seen.has(d)) continue;
    seen.add(d);
    uniq.push(d);
  }

  if (uniq.length === 0) {
    return { ok: false, error: 'No valid mobile numbers provided' };
  }

  const results = [];
  for (let i = 0; i < uniq.length; i++) {
    if (i > 0 && ms > 0) await sleep(ms);
    const r = await sendSalesquaredSms(uniq[i], message);
    results.push({ phone: uniq[i], ...r });
  }

  const allOk = results.every((r) => r.ok);
  const firstErr = results.find((r) => !r.ok);
  return {
    ok: allOk,
    results,
    error: allOk ? undefined : firstErr?.error || 'One or more SMS failed',
  };
}
