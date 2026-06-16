function isSet(name) {
  return Boolean(String(process.env[name] || '').trim());
}

function warnOptional(label, configured) {
  if (!configured) {
    console.warn(`[config] ${label} is not configured — related features may be disabled.`);
  }
}

function hasMysqlConfig() {
  if (String(process.env.DATABASE_URL || process.env.MYSQL_URI || '').trim()) {
    return true;
  }
  return Boolean(
    String(process.env.MYSQL_HOST || '').trim() &&
      String(process.env.MYSQL_DATABASE || '').trim()
  );
}

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const required = ['JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
  const missing = required.filter((key) => !isSet(key));

  if (!hasMysqlConfig()) {
    missing.push('DATABASE_URL (or MYSQL_URI)');
  }

  if (missing.length > 0) {
    console.error(`Missing required production environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const jwt = String(process.env.JWT_SECRET || '').trim();
  if (jwt === 'your_jwt_secret_key_here' || jwt.length < 16) {
    console.error('JWT_SECRET must be a strong, non-placeholder value in production.');
    process.exit(1);
  }

  warnOptional('EMAIL_USER (meal reports)', isSet('EMAIL_USER') && isSet('EMAIL_PASS'));
  warnOptional('SALESQUARED_API_KEY (parent SMS)', isSet('SALESQUARED_API_KEY'));
  warnOptional('ADMIN_OTP_TO_EMAIL (admin credential OTP)', isSet('ADMIN_OTP_TO_EMAIL'));
}
