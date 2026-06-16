import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import { toApiJson } from '../utils/apiSerialize.js';
import { parseId } from '../utils/queryHelpers.js';

function jwtSecret() {
  return process.env.JWT_SECRET || 'fallback_secret_key_for_development';
}

async function loadUserFromToken(decoded) {
  const id = parseId(decoded.id);
  if (!id) return null;

  if (decoded.type === 'faculty') {
    const faculty = await Faculty.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
    return faculty ? toApiJson(faculty) : null;
  }

  const student = await Student.findByPk(id);
  return student ? toApiJson(student) : null;
}

const protect = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret());
    req.user = await loadUserFromToken(decoded);
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    return next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const protectFaculty = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret());

    if (decoded.type !== 'faculty') {
      return res.status(401).json({ message: 'Not authorized, faculty access required' });
    }

    const id = parseId(decoded.id);
    const faculty = id
      ? await Faculty.findByPk(id, { attributes: { exclude: ['password'] } })
      : null;

    if (!faculty) {
      return res.status(401).json({ message: 'Faculty not found' });
    }

    req.user = toApiJson(faculty);
    return next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const protectAdmin = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret());

    if (decoded.type !== 'admin' || decoded.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Admin access required' });
    }

    req.admin = {
      email: decoded.email,
      role: 'admin',
    };
    return next();
  } catch (error) {
    console.error('protectAdmin:', error);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export { protect, protectFaculty, admin, protectAdmin };
