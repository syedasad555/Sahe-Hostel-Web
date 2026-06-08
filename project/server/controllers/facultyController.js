import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Faculty from '../models/Faculty.js';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../utils/otpEmailService.js';

const facultyOtpStore = new Map();

function getEnvString(name) {
  const v = process.env[name];
  return v == null ? '' : String(v).trim();
}

function readEnvNumber(name) {
  const raw = process.env[name];
  if (raw == null) return null;
  const str = String(raw).trim();
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
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

function hashSha256(text) {
  return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
}

function generateOtpCode(length) {
  const len = Math.max(4, Math.min(10, Number(length) || 6));
  const max = 10 ** len;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(len, '0');
}

function getOtpEmailConfig() {
  const otpTo =
    getEnvString('FACULTY_OTP_TO_EMAIL') ||
    getEnvString('ADMIN_OTP_TO_EMAIL');
  const otpFrom =
    getEnvString('FACULTY_OTP_FROM_EMAIL') ||
    getEnvString('ADMIN_OTP_FROM_EMAIL') ||
    getEnvString('EMAIL_USER');
  return { otpTo, otpFrom };
}

// @desc    Login faculty
// @route   POST /api/auth/faculty/login
// @access  Public
export const loginFaculty = async (req, res) => {
  try {
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find faculty by email
    const faculty = await Faculty.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });

    if (!faculty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await faculty.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await faculty.updateLastLogin();


    // Create JWT token
    const token = jwt.sign(
      { 
        id: faculty._id,
        email: faculty.email,
        name: faculty.name,
        role: faculty.role,
        type: 'faculty'
      },
      process.env.JWT_SECRET || 'fallback_secret_key_for_development',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      faculty: {
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        employeeId: faculty.employeeId,
        designation: faculty.designation,
        role: faculty.role,
        lastLogin: faculty.lastLogin
      }
    });

  } catch (error) {
    console.error('Error in faculty login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current faculty profile
// @route   GET /api/auth/faculty/profile
// @access  Private
export const getFacultyProfile = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.id).select('-password');
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    res.json({
      success: true,
      faculty
    });
  } catch (error) {
    console.error('Error getting faculty profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Logout faculty (client-side token removal)
// @route   POST /api/auth/faculty/logout
// @access  Private
export const logoutFaculty = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // This endpoint can be used for logging or cleanup if needed
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Error in faculty logout:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Request OTP to update faculty email/password (login page)
// @route   POST /api/auth/faculty/otp/request
// @access  Public (requires current credentials)
export const requestFacultyCredentialOtp = async (req, res) => {
  try {
    const { currentEmail, currentPassword, newEmail, changeEmail, changePassword } = req.body || {};

    const { otpTo, otpFrom } = getOtpEmailConfig();
    if (!otpTo || !otpFrom) {
      return res.status(503).json({
        success: false,
        message:
          'OTP email is not configured. Set FACULTY_OTP_TO_EMAIL / ADMIN_OTP_TO_EMAIL and FACULTY_OTP_FROM_EMAIL / ADMIN_OTP_FROM_EMAIL in server .env.',
      });
    }

    if (!currentEmail || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current email and password are required.',
      });
    }

    if (!changeEmail && !changePassword) {
      return res.status(400).json({
        success: false,
        message: 'Enter a new email or password to update.',
      });
    }

    const facultyEmailLower = String(currentEmail).trim().toLowerCase();
    const faculty = await Faculty.findOne({ email: facultyEmailLower, isActive: true });

    if (!faculty || !(await faculty.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const expectedNewEmail = changeEmail
      ? String(newEmail || '').trim().toLowerCase()
      : facultyEmailLower;

    if (!expectedNewEmail) {
      return res.status(400).json({ success: false, message: 'New email is required.' });
    }

    if (changeEmail && expectedNewEmail !== facultyEmailLower) {
      const taken = await Faculty.findOne({ email: expectedNewEmail });
      if (taken && taken._id.toString() !== faculty._id.toString()) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }
    }

    const otpLength = readEnvNumber('FACULTY_OTP_LENGTH') ?? readEnvNumber('ADMIN_OTP_LENGTH');
    const ttlMs = readEnvNumber('FACULTY_OTP_TTL_MS') ?? readEnvNumber('ADMIN_OTP_TTL_MS') ?? 120000;

    const otpCode = generateOtpCode(otpLength);
    const otpId = crypto.randomUUID();
    const expiresAt = Date.now() + ttlMs;

    facultyOtpStore.set(otpId, {
      otpId,
      otpHash: hashSha256(otpCode),
      expiresAt,
      purpose: 'faculty_credential_update',
      facultyId: faculty._id.toString(),
      facultyEmail: facultyEmailLower,
      expectedNewEmail,
      expectedChangePassword: !!changePassword,
    });

    try {
      await sendOtpEmail({
        to: otpTo,
        from: otpFrom,
        otp: otpCode,
        purpose: 'Faculty credential update',
      });
    } catch (mailError) {
      facultyOtpStore.delete(otpId);
      console.error('requestFacultyCredentialOtp mail:', mailError);
      const msg = String(mailError?.message || '');
      if (msg.includes('BadCredentials') || msg.includes('535')) {
        return res.status(503).json({
          success: false,
          message:
            'Gmail rejected the app password. Regenerate an app password for EMAIL_USER in Google Account → Security → App passwords, update EMAIL_PASS in .env (no spaces), and restart the server.',
        });
      }
      if (mailError?.code === 'ETIMEOUT' || msg.includes('ETIMEOUT')) {
        return res.status(503).json({
          success: false,
          message:
            'Email server timed out. Check your network or set EMAIL_SMTP_HOST in .env to a Gmail SMTP IP.',
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Check EMAIL_USER, EMAIL_PASS, and server logs.',
      });
    }

    return res.json({
      success: true,
      message: `OTP sent to ${otpTo}.`,
      otpId,
      expiresInMs: ttlMs,
    });
  } catch (error) {
    console.error('requestFacultyCredentialOtp:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

// @desc    Verify faculty credential OTP
// @route   POST /api/auth/faculty/otp/verify
// @access  Public
export const verifyFacultyCredentialOtp = async (req, res) => {
  try {
    const { otpId, otp } = req.body || {};
    if (!otpId || !otp) {
      return res.status(400).json({ success: false, message: 'otpId and otp are required.' });
    }

    const rec = facultyOtpStore.get(otpId);
    if (!rec) {
      return res.status(400).json({ success: false, message: 'Invalid OTP request.' });
    }
    if (Date.now() > rec.expiresAt) {
      facultyOtpStore.delete(otpId);
      return res.status(400).json({ success: false, message: 'OTP expired.' });
    }

    const ok = timingSafeEqualStrings(hashSha256(otp), rec.otpHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid OTP.' });
    }

    facultyOtpStore.delete(otpId);

    const otpJwtExpire =
      getEnvString('FACULTY_OTP_JWT_EXPIRE') || getEnvString('ADMIN_OTP_JWT_EXPIRE') || '2m';
    const otpToken = jwt.sign(
      {
        type: 'faculty_otp',
        purpose: 'faculty_credential_update',
        otpId,
        facultyId: rec.facultyId,
        facultyEmail: rec.facultyEmail,
        expectedNewEmail: rec.expectedNewEmail,
        expectedChangePassword: rec.expectedChangePassword,
      },
      process.env.JWT_SECRET || 'fallback_secret_key_for_development',
      { expiresIn: otpJwtExpire }
    );

    return res.json({ success: true, otpToken });
  } catch (error) {
    console.error('verifyFacultyCredentialOtp:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
};

// @desc    Apply faculty credential update after OTP verification
// @route   POST /api/auth/faculty/account/update
// @access  Public (requires otpToken)
export const updateFacultyCredentials = async (req, res) => {
  try {
    const { otpToken, newEmail, newPassword } = req.body || {};
    if (!otpToken) {
      return res.status(400).json({ success: false, message: 'otpToken is required.' });
    }

    const decoded = jwt.verify(
      otpToken,
      process.env.JWT_SECRET || 'fallback_secret_key_for_development'
    );

    if (decoded?.type !== 'faculty_otp' || decoded?.purpose !== 'faculty_credential_update') {
      return res.status(401).json({ success: false, message: 'Invalid otpToken.' });
    }

    const faculty = await Faculty.findById(decoded.facultyId);
    if (!faculty || !faculty.isActive) {
      return res.status(404).json({ success: false, message: 'Faculty record not found.' });
    }

    if (String(faculty.email).toLowerCase() !== String(decoded.facultyEmail).toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Faculty session mismatch.' });
    }

    const expectedNewEmail = String(decoded.expectedNewEmail || '').trim().toLowerCase();
    if (!expectedNewEmail) {
      return res.status(400).json({ success: false, message: 'Invalid expected email.' });
    }

    const changePassword = !!decoded.expectedChangePassword;

    const bcryptCostRaw =
      getEnvString('FACULTY_BCRYPT_COST') || getEnvString('ADMIN_BCRYPT_COST');
    const bcryptCost = bcryptCostRaw ? Number(bcryptCostRaw) : 12;

    const update = {};
    if (expectedNewEmail !== faculty.email.toLowerCase()) {
      const taken = await Faculty.findOne({ email: expectedNewEmail });
      if (taken && taken._id.toString() !== faculty._id.toString()) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }
      update.email = expectedNewEmail;
    }

    if (changePassword) {
      if (!newPassword || String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password is required (min 6 characters).',
        });
      }
      const salt = await bcrypt.genSalt(Number.isFinite(bcryptCost) ? bcryptCost : 12);
      update.password = await bcrypt.hash(String(newPassword), salt);
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    await Faculty.updateOne({ _id: faculty._id }, update);

    return res.json({ success: true, message: 'Faculty credentials updated successfully.' });
  } catch (error) {
    console.error('updateFacultyCredentials:', error);
    return res.status(500).json({ success: false, message: 'Failed to update credentials.' });
  }
};
