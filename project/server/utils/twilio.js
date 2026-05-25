/**
 * Twilio SMS (REST API — no SDK required).
 * https://www.twilio.com/docs/sms/api/message-resource#create-a-message-resource
 *
 * Required .env:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER  (your Twilio number in E.164, e.g. +14155552671)
 */

const TWILIO_API_VERSION = '2010-04-01';

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

export function isTwilioConfigured() {
  return !!(
    trimEnv(process.env.TWILIO_ACCOUNT_SID) &&
    trimEnv(process.env.TWILIO_AUTH_TOKEN) &&
    trimEnv(process.env.TWILIO_FROM_NUMBER)
  );
}

function getTwilioCredentials() {
  const accountSid = trimEnv(process.env.TWILIO_ACCOUNT_SID);
  const authToken = trimEnv(process.env.TWILIO_AUTH_TOKEN);
  const from = trimEnv(process.env.TWILIO_FROM_NUMBER);
  if (!accountSid || !authToken) {
    return { ok: false, error: 'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in .env' };
  }
  if (!from) {
    return { ok: false, error: 'TWILIO_FROM_NUMBER must be set in .env (E.164 format)' };
  }
  return { ok: true, accountSid, authToken, from };
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

/** E.164 for India (+91XXXXXXXXXX) */
export function toE164Indian(phone) {
  const digits = normalizeIndianMobileDigits(phone);
  if (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91${digits}`;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatTwilioError(data, httpStatus) {
  if (!data || typeof data !== 'object') {
    return httpStatus ? `HTTP ${httpStatus}` : 'Unknown Twilio error';
  }
  const msg = String(data.message || data.error_message || '').trim();
  const code = data.code ?? data.error_code;
  if (msg && code != null) return `${msg} (code ${code})`;
  if (msg) return msg;
  try {
    return JSON.stringify(data);
  } catch {
    return 'Twilio error';
  }
}

function isTwilioMessageAccepted(data, httpStatus) {
  if (!data || typeof data !== 'object') return false;
  if (httpStatus < 200 || httpStatus >= 300) return false;
  if (!data.sid) return false;
  const status = String(data.status || '').toLowerCase();
  if (status === 'failed' || status === 'undelivered' || status === 'canceled') return false;
  return true;
}

/**
 * @param {string} toPhone - parent phone (10-digit Indian or E.164)
 * @param {string} message
 * @returns {Promise<{ ok: boolean, data?: object, httpStatus?: number, error?: string }>}
 */
export async function sendTwilioSms(toPhone, message) {
  const creds = getTwilioCredentials();
  if (!creds.ok) return { ok: false, error: creds.error };

  const to = toE164Indian(toPhone);
  if (!to) {
    return { ok: false, error: 'Invalid Indian mobile for SMS' };
  }

  const body = new URLSearchParams({
    To: to,
    From: creds.from,
    Body: String(message ?? '').slice(0, 1600),
  });

  const url = `https://api.twilio.com/${TWILIO_API_VERSION}/Accounts/${creds.accountSid}/Messages.json`;
  const basic = Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString('base64');

  try {
    const smsRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    const data = await smsRes.json().catch(() => ({}));
    const ok = isTwilioMessageAccepted(data, smsRes.status);

    if (!ok) {
      console.warn('[Twilio] Send failed:', {
        httpStatus: smsRes.status,
        to,
        message: formatTwilioError(data, smsRes.status),
      });
    }

    return {
      ok,
      data,
      httpStatus: smsRes.status,
      error: ok ? undefined : formatTwilioError(data, smsRes.status),
    };
  } catch (err) {
    console.error('sendTwilioSms:', err);
    return { ok: false, error: err?.message || 'SMS request failed' };
  }
}

/**
 * One message per unique parent number (Twilio has no multi-recipient single call like bulk SMS).
 * @param {number} delayMs - pause between sends (rate limits)
 */
export async function sendTwilioSmsSequential(phones, message, delayMs = 500) {
  const ms = Number.isFinite(delayMs) && delayMs >= 0 ? delayMs : 500;
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
    const r = await sendTwilioSms(uniq[i], message);
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
