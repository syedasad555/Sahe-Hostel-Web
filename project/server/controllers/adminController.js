import os from 'os';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Complaint from '../models/Complaint.js';
import MealSelection from '../models/MealSelection.js';
import OutingPermission from '../models/OutingPermission.js';
import { OutingPermissionMember } from '../models/OutingPermission.js';
import SystemAdmin from '../models/SystemAdmin.js';
import { sequelize } from '../config/db.js';
import { todayDateOnly } from '../utils/queryHelpers.js';
import { isSalesquaredConfigured } from '../utils/salesquared.js';
import {
  getAdminCredentials,
  isAdminConfigured,
  verifyAdminCredentials,
} from '../utils/adminAuth.js';
import { sendOtpEmail } from '../utils/otpEmailService.js';

function statusFromMysql(connected) {
  return connected ? 'healthy' : 'critical';
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function heapHealthRatio() {
  const mem = process.memoryUsage();
  if (!mem.heapTotal) return 0;
  return mem.heapUsed / mem.heapTotal;
}

function readEnvNumber(name) {
  const raw = process.env[name];
  if (raw == null) return null;
  const str = String(raw).trim();
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

function statusFromMemory(ratio) {
  const warningRatio = readEnvNumber('ADMIN_HEAP_WARNING_RATIO');
  const criticalRatio = readEnvNumber('ADMIN_HEAP_CRITICAL_RATIO');
  if (warningRatio == null && criticalRatio == null) return 'unknown';
  if (criticalRatio != null && ratio >= criticalRatio) return 'critical';
  if (warningRatio != null && ratio >= warningRatio) return 'warning';
  return 'healthy';
}

function statusFromLoad(load1, cpus) {
  const warningPerCore = readEnvNumber('ADMIN_CPU_PER_CORE_WARNING');
  const criticalPerCore = readEnvNumber('ADMIN_CPU_PER_CORE_CRITICAL');
  const perCore = load1 / Math.max(cpus, 1);
  if (warningPerCore == null && criticalPerCore == null) return 'unknown';
  if (criticalPerCore != null && perCore >= criticalPerCore) return 'critical';
  if (warningPerCore != null && perCore >= warningPerCore) return 'warning';
  return 'healthy';
}

function statusFromUptime() {
  const warningSeconds = readEnvNumber('ADMIN_API_UPTIME_WARNING_SECONDS');
  if (warningSeconds == null) return 'unknown';
  return process.uptime() > warningSeconds ? 'healthy' : 'warning';
}

export const loginAdmin = async (req, res) => {
  try {
    if (!isAdminConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in server .env.',
      });
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const inputEmail = String(email).trim().toLowerCase();
    const adminDoc = await SystemAdmin.findOne({ where: { email: inputEmail } });

    let verified = false;

    if (adminDoc) {
      verified = await bcrypt.compare(String(password), adminDoc.passwordHash);
    } else {
      verified = verifyAdminCredentials(email, password);
    }

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const configured = getAdminCredentials();
    const tokenEmail = adminDoc?.email || configured.email.toLowerCase();

    // If the admin record doesn't exist yet, create it from the env credentials once.
    if (!adminDoc) {
      const bcryptCostRaw = process.env.ADMIN_BCRYPT_COST;
      const bcryptCost = Number.isFinite(Number(bcryptCostRaw)) ? Number(bcryptCostRaw) : 12;
      const salt = await bcrypt.genSalt(bcryptCost);
      const passwordHash = await bcrypt.hash(String(configured.password), salt);
      await SystemAdmin.upsert({
        email: configured.email.toLowerCase(),
        passwordHash,
      });
    }

    const token = jwt.sign(
      {
        type: 'admin',
        role: 'admin',
        email: tokenEmail,
      },
      process.env.JWT_SECRET || 'fallback_secret_key_for_development',
      { expiresIn: process.env.ADMIN_JWT_EXPIRE || '8h' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        email: tokenEmail,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('loginAdmin:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAdminProfile = async (req, res) => {
  return res.json({
    success: true,
    data: {
      email: req.admin?.email,
      role: 'admin',
      lastLoginAt: new Date().toISOString(),
    },
  });
};

export const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const today = todayDateOnly();

    let mysqlConnected = false;
    try {
      await sequelize.authenticate();
      mysqlConnected = true;
    } catch {
      mysqlConnected = false;
    }

    const mem = process.memoryUsage();
    const heapRatio = heapHealthRatio();
    const load = os.loadavg();
    const cpus = os.cpus().length;

    const [
      studentsTotal,
      facultyTotal,
      complaintsOpen,
      complaintsTotal,
      mealsToday,
      outingPermissionsTotal,
      outingMembersTotal,
      studentsPendingPayment,
    ] = await Promise.all([
      Student.count(),
      Faculty.count(),
      Complaint.count({ where: { status: { [Op.in]: ['open', 'in_review'] } } }),
      Complaint.count(),
      MealSelection.count({ where: { date: today } }),
      OutingPermission.count(),
      OutingPermissionMember.count(),
      Student.count({ where: { paymentStatus: { [Op.ne]: 'Done' } } }),
    ]);

    const mysqlStatus = statusFromMysql(mysqlConnected);
    const memoryStatus = statusFromMemory(heapRatio);
    const cpuStatus = statusFromLoad(load[0], cpus);
    const uptimeStatus = statusFromUptime();

    const checks = [
      {
        id: 'mysql',
        label: 'MySQL',
        status: mysqlStatus,
        detail: mysqlConnected ? 'connected' : 'disconnected',
      },
      {
        id: 'memory',
        label: 'Node heap',
        status: memoryStatus,
        detail: `${(heapRatio * 100).toFixed(1)}% used`,
      },
      {
        id: 'cpu',
        label: 'CPU load (1m)',
        status: cpuStatus,
        detail: `${load[0].toFixed(2)} / ${cpus} cores`,
      },
      {
        id: 'uptime',
        label: 'API uptime',
        status: uptimeStatus,
        detail: `${Math.floor(process.uptime())}s`,
      },
    ];

    const knownCritical = checks.some((c) => c.status === 'critical');
    const knownWarning = checks.some((c) => c.status === 'warning');

    const integrations = {
      mysql: mysqlStatus === 'healthy',
      salesquared: isSalesquaredConfigured(),
      email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      jwtSecretSet: !!String(process.env.JWT_SECRET || '').trim(),
    };

    const health = {
      overall:
        mysqlStatus === 'critical' || knownCritical
          ? 'critical'
          : knownWarning
            ? 'warning'
            : 'healthy',
      checks,
    };

    return res.json({
      success: true,
      data: {
        generatedAt: now.toISOString(),
        environment: process.env.NODE_ENV || 'development',
        server: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: `${os.platform()} ${os.release()}`,
          hostname: os.hostname(),
          port: Number(process.env.PORT || 5000),
        },
        system: {
          memory: {
            rss: formatBytes(mem.rss),
            heapUsed: formatBytes(mem.heapUsed),
            heapTotal: formatBytes(mem.heapTotal),
            heapUsedPercent: Number((heapRatio * 100).toFixed(1)),
          },
          loadAverage: {
            '1m': Number(load[0].toFixed(2)),
            '5m': Number(load[1].toFixed(2)),
            '15m': Number(load[2].toFixed(2)),
          },
          cpuCores: cpus,
          freeMemory: formatBytes(os.freemem()),
          totalMemory: formatBytes(os.totalmem()),
        },
        health,
        integrations,
        metrics: {
          studentsTotal,
          facultyTotal,
          complaintsOpen,
          complaintsTotal,
          mealsToday,
          outingPermissionsTotal,
          outingMembersTotal,
          studentsPendingPayment,
        },
      },
    });
  } catch (error) {
    console.error('getAdminDashboard:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard metrics' });
  }
};

// In-memory OTP store (single-instance deployments). For multi-instance prod, use Redis.
const adminOtpStore = new Map();

function getEnvString(name) {
  const v = process.env[name];
  return v == null ? '' : String(v).trim();
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

export const requestAdminCredentialOtp = async (req, res) => {
  try {
    const { newEmail, changeEmail, changePassword } = req.body || {};

    const otpTo = getEnvString('ADMIN_OTP_TO_EMAIL');
    const otpFrom = getEnvString('ADMIN_OTP_FROM_EMAIL') || getEnvString('EMAIL_USER');
    if (!otpTo || !otpFrom) {
      return res.status(503).json({
        success: false,
        message: 'OTP email is not configured. Set ADMIN_OTP_TO_EMAIL and ADMIN_OTP_FROM_EMAIL in server .env.',
      });
    }

    const otpLength = readEnvNumber('ADMIN_OTP_LENGTH');
    const ttlMs = readEnvNumber('ADMIN_OTP_TTL_MS') ?? 120000;

    const adminEmailLower = String(req.admin?.email || '').trim().toLowerCase();
    if (!adminEmailLower) {
      return res.status(401).json({ success: false, message: 'Admin not authenticated.' });
    }

    const expectedNewEmail = changeEmail
      ? String(newEmail || '').trim().toLowerCase()
      : adminEmailLower;

    if (!expectedNewEmail) {
      return res.status(400).json({ success: false, message: 'New email is required.' });
    }

    const expectedChangePassword = !!changePassword;

    const otpCode = generateOtpCode(otpLength);
    const otpId = crypto.randomUUID();
    const expiresAt = Date.now() + ttlMs;

    adminOtpStore.set(otpId, {
      otpId,
      otpHash: hashSha256(otpCode),
      expiresAt,
      purpose: 'admin_credential_update',
      adminEmail: adminEmailLower,
      expectedNewEmail,
      expectedChangePassword,
    });

    try {
      await sendOtpEmail({
        to: otpTo,
        from: otpFrom,
        otp: otpCode,
        purpose: 'Admin credential update',
      });
    } catch (mailError) {
      adminOtpStore.delete(otpId);
      console.error('requestAdminCredentialOtp mail:', mailError);
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
    console.error('requestAdminCredentialOtp:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

export const verifyAdminCredentialOtp = async (req, res) => {
  try {
    const { otpId, otp } = req.body || {};
    if (!otpId || !otp) {
      return res.status(400).json({ success: false, message: 'otpId and otp are required.' });
    }

    const rec = adminOtpStore.get(otpId);
    if (!rec) {
      return res.status(400).json({ success: false, message: 'Invalid OTP request.' });
    }
    if (Date.now() > rec.expiresAt) {
      adminOtpStore.delete(otpId);
      return res.status(400).json({ success: false, message: 'OTP expired.' });
    }

    const ok = timingSafeEqualStrings(hashSha256(otp), rec.otpHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid OTP.' });
    }

    adminOtpStore.delete(otpId);

    const otpJwtExpire = getEnvString('ADMIN_OTP_JWT_EXPIRE') || '2m';
    const otpToken = jwt.sign(
      {
        type: 'admin_otp',
        purpose: 'admin_credential_update',
        otpId,
        adminEmail: rec.adminEmail,
        expectedNewEmail: rec.expectedNewEmail,
        expectedChangePassword: rec.expectedChangePassword,
      },
      process.env.JWT_SECRET || 'fallback_secret_key_for_development',
      { expiresIn: otpJwtExpire }
    );

    return res.json({ success: true, otpToken });
  } catch (error) {
    console.error('verifyAdminCredentialOtp:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
};

export const updateAdminCredentials = async (req, res) => {
  try {
    const { otpToken, newEmail, newPassword } = req.body || {};
    if (!otpToken) {
      return res.status(400).json({ success: false, message: 'otpToken is required.' });
    }

    const decoded = jwt.verify(
      otpToken,
      process.env.JWT_SECRET || 'fallback_secret_key_for_development'
    );

    if (decoded?.type !== 'admin_otp' || decoded?.purpose !== 'admin_credential_update') {
      return res.status(401).json({ success: false, message: 'Invalid otpToken.' });
    }

    const adminEmailLower = String(req.admin?.email || '').trim().toLowerCase();
    if (!adminEmailLower || adminEmailLower !== decoded.adminEmail) {
      return res.status(401).json({ success: false, message: 'Admin session mismatch.' });
    }

    const expectedNewEmail = String(decoded.expectedNewEmail || '').trim().toLowerCase();
    if (!expectedNewEmail) {
      return res.status(400).json({ success: false, message: 'Invalid expected email.' });
    }

    const changePassword = !!decoded.expectedChangePassword;
    const finalNewEmail = expectedNewEmail;

    const bcryptCostRaw = getEnvString('ADMIN_BCRYPT_COST');
    const bcryptCost = bcryptCostRaw ? Number(bcryptCostRaw) : 12;

    let passwordHash;
    if (changePassword) {
      if (!newPassword || String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password is required (min 6 characters).',
        });
      }
      const salt = await bcrypt.genSalt(Number.isFinite(bcryptCost) ? bcryptCost : 12);
      passwordHash = await bcrypt.hash(String(newPassword), salt);
    }

    const existing = await SystemAdmin.findOne({ where: { email: adminEmailLower } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Admin record not found.' });
    }

    await existing.update({
      ...(finalNewEmail ? { email: finalNewEmail } : {}),
      ...(passwordHash ? { passwordHash } : {}),
    });

    return res.json({ success: true, message: 'Admin credentials updated successfully.' });
  } catch (error) {
    console.error('updateAdminCredentials:', error);
    return res.status(500).json({ success: false, message: 'Failed to update credentials.' });
  }
};
