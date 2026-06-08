import crypto from 'crypto';

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

function timingSafeEqualStrings(a, b) {
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function getAdminCredentials() {
  const email = trimEnv(process.env.ADMIN_EMAIL);
  const password = trimEnv(process.env.ADMIN_PASSWORD);
  return { email, password };
}

export function isAdminConfigured() {
  const { email, password } = getAdminCredentials();
  return !!(email && password);
}

export function verifyAdminCredentials(email, password) {
  const configured = getAdminCredentials();
  if (!configured.email || !configured.password) return false;

  const inputEmail = String(email ?? '').trim().toLowerCase();
  const configEmail = configured.email.toLowerCase();
  const inputPassword = String(password ?? '');

  if (!timingSafeEqualStrings(inputEmail, configEmail)) return false;
  return timingSafeEqualStrings(inputPassword, configured.password);
}
