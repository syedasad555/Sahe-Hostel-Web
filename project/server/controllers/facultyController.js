import Faculty from '../models/Faculty.js';
import jwt from 'jsonwebtoken';

// @desc    Login faculty
// @route   POST /api/auth/faculty/login
// @access  Public
export const loginFaculty = async (req, res) => {
  try {
    console.log('Faculty login attempt:', req.body);
    
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
      console.log('Faculty not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await faculty.comparePassword(password);

    if (!isPasswordValid) {
      console.log('Invalid password for faculty:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await faculty.updateLastLogin();

    console.log('Faculty login successful:', faculty.name, 'Email:', faculty.email);

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
