/**
 * Fast2SMS Quick SMS (route: q)
 * https://docs.fast2sms.com/reference/quick-sms-post
 *
 * Required .env:
 *   FAST2SMS_API_KEY
 */

import '../config/loadEnv.js';

const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

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

export function isFast2smsConfigured() {
  return !!trimEnv(process.env.FAST2SMS_API_KEY);
}

export function getFast2smsConfigError() {
  if (!trimEnv(process.env.FAST2SMS_API_KEY)) {
    return 'FAST2SMS_API_KEY is missing. Add it to project/server/.env and restart the server.';
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

function formatFast2smsError(data, httpStatus) {
  if (!data || typeof data !== 'object') {
    return httpStatus ? `HTTP ${httpStatus}` : 'Unknown Fast2SMS error';
  }
  if (Array.isArray(data.message) && data.message.length) {
    return data.message.join(' ');
  }
  if (data.message) return String(data.message);
  try {
    return JSON.stringify(data);
  } catch {
    return 'Fast2SMS error';
  }
}

function isFast2smsAccepted(data, httpStatus) {
  if (!data || typeof data !== 'object') return false;
  if (httpStatus < 200 || httpStatus >= 300) return false;
  return data.return === true || data.return === 'true';
}

/**
 * @param {string} numbers - comma-separated 10-digit Indian mobiles
 * @param {string} message
 */
async function sendFast2smsToNumbers(numbers, message) {
  const apiKey = trimEnv(process.env.FAST2SMS_API_KEY);
  if (!apiKey) {
    return { ok: false, error: 'FAST2SMS_API_KEY must be set in .env' };
  }

  const body = {
    route: 'q',
    message: String(message ?? '').slice(0, 1600),
    numbers: String(numbers ?? '').trim(),
  };

  try {
    const smsRes = await fetch(FAST2SMS_URL, {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
        accept: '*/*',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify(body),
    });

    const data = await smsRes.json().catch(() => ({}));
    const ok = isFast2smsAccepted(data, smsRes.status);

    if (!ok) {
      console.warn('[Fast2SMS] Send failed:', {
        httpStatus: smsRes.status,
        numbers: body.numbers,
        message: formatFast2smsError(data, smsRes.status),
      });
    }

    return {
      ok,
      data,
      httpStatus: smsRes.status,
      error: ok ? undefined : formatFast2smsError(data, smsRes.status),
    };
  } catch (err) {
    console.error('sendFast2smsToNumbers:', err);
    return { ok: false, error: err?.message || 'SMS request failed' };
  }
}

/**
 * @param {string} toPhone - parent phone (10-digit Indian)
 * @param {string} message
 */
export async function sendFast2sms(toPhone, message) {
  const digits = normalizeIndianMobileDigits(toPhone);
  if (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
    return { ok: false, error: 'Invalid Indian mobile for SMS' };
  }
  return sendFast2smsToNumbers(digits, message);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One SMS per unique parent number (Fast2SMS bulkV2 accepts comma-separated numbers,
 * but we send individually for per-roll feedback).
 */
export async function sendFast2smsSequential(phones, message, delayMs = 300) {
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
    const r = await sendFast2sms(uniq[i], message);
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
