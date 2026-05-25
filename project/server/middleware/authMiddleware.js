import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';

// Protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token based on type
      if (decoded.type === 'faculty') {
        req.user = await Faculty.findById(decoded.id).select('-password');
      } else {
        req.user = await Student.findById(decoded.id).select('-password');
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Protect faculty routes specifically
const protectFaculty = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'faculty') {
      return res.status(401).json({ message: 'Not authorized, faculty access required' });
    }

    req.user = await Faculty.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Faculty not found' });
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

export { protect, protectFaculty, admin };
