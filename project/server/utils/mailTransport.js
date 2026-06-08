import nodemailer from 'nodemailer';
import dns from 'dns/promises';
import '../config/loadEnv.js';

const DNS_TIMEOUT_MS = 5000;

const SMTP_HOST_FALLBACKS = {
  'smtp.gmail.com': [
    '192.178.211.108',
    '142.250.66.108',
    '172.217.194.108',
  ],
};

function normalizeAppPassword(pass) {
  return String(pass || '').replace(/\s+/g, '');
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

async function resolveSmtpEndpoint(hostname) {
  const overrideHost = String(process.env.EMAIL_SMTP_HOST || '').trim();
  if (overrideHost) {
    return {
      host: overrideHost,
      servername: hostname.includes('.') ? hostname : 'smtp.gmail.com',
    };
  }

  try {
    const addresses = await withTimeout(dns.resolve4(hostname), DNS_TIMEOUT_MS, 'DNS lookup');
    if (addresses.length > 0) {
      return { host: addresses[0], servername: hostname };
    }
  } catch {
    // Try known fallbacks below.
  }

  const fallbacks = SMTP_HOST_FALLBACKS[hostname];
  if (fallbacks?.length) {
    return { host: fallbacks[0], servername: hostname };
  }

  return { host: hostname, servername: undefined };
}

let transporterPromise = null;

async function createTransporter() {
  const configuredHost = String(process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = String(process.env.EMAIL_USER || '').trim();
  const pass = normalizeAppPassword(process.env.EMAIL_PASS);

  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be set in server .env');
  }

  const { host, servername } = await resolveSmtpEndpoint(configuredHost);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    ...(servername ? { tls: { servername } } : {}),
  });
}

export function getMailTransporter() {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  return transporterPromise;
}
