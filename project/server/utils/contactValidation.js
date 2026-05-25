/**
 * Shared contact validation for student registration (server-side).
 */

export function normalizePhoneDigits(value) {
  if (value === undefined || value === null) return '';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('91')) return digits.slice(-10);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

/** Indian mobile: 10 digits starting with 6–9 */
export function isValidIndianMobile(value) {
  const d = normalizePhoneDigits(value);
  return /^[6-9]\d{9}$/.test(d);
}

export function isValidEmailStrict(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 254) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  const at = trimmed.lastIndexOf('@');
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!local.length || local.length > 64 || !domain.length || domain.length > 253) return false;
  if (!/\./.test(domain)) return false;
  return true;
}

/** Returns error message string or null if OK */
export function phoneDuplicateAgainstStudent(studentPhone, otherPhones) {
  const s = normalizePhoneDigits(studentPhone);
  if (!s || !/^[6-9]\d{9}$/.test(s)) return null;

  const labels = [
    ['Parent phone number', otherPhones.parentPhone],
    ['Guardian phone number', otherPhones.guardianPhone],
    ['Emergency contact number', otherPhones.emergencyContact],
  ];

  for (const [label, raw] of labels) {
    if (raw === undefined || raw === null || String(raw).trim() === '') continue;
    if (normalizePhoneDigits(raw) === s) {
      return `${label} cannot be the same as the student's phone number.`;
    }
  }
  return null;
}

/** Single place for POST /students body checks — returns English error message or null */
export function validateRegistrationContacts(email, phone, parentPhone, guardianPhone, emergencyContact) {
  if (!email || String(email).trim() === '') {
    return 'Email is required.';
  }
  if (!isValidEmailStrict(String(email))) {
    return 'Please enter a valid email address.';
  }
  if (!phone || String(phone).trim() === '') {
    return 'Student phone number is required.';
  }
  if (!isValidIndianMobile(phone)) {
    return 'Student phone must be a valid 10-digit Indian mobile number (starting with 6–9).';
  }
  if (!parentPhone || String(parentPhone).trim() === '') {
    return 'Parent phone number is required.';
  }
  if (!isValidIndianMobile(parentPhone)) {
    return 'Parent phone must be a valid 10-digit Indian mobile number.';
  }

  const g = guardianPhone != null ? String(guardianPhone).trim() : '';
  if (g && !isValidIndianMobile(guardianPhone)) {
    return 'Guardian phone must be a valid 10-digit Indian mobile number, or leave it blank.';
  }

  if (!emergencyContact || String(emergencyContact).trim() === '') {
    return 'Emergency contact phone is required.';
  }
  if (!isValidIndianMobile(emergencyContact)) {
    return 'Emergency contact must be a valid 10-digit Indian mobile number.';
  }

  const dupMsg = phoneDuplicateAgainstStudent(phone, {
    parentPhone,
    guardianPhone,
    emergencyContact,
  });
  if (dupMsg) return dupMsg;

  return null;
}
