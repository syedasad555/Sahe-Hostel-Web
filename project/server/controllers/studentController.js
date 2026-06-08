import Student from '../models/Student.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { validateStudentNumber } from '../utils/csvValidation.js';
import { validateRegistrationContacts } from '../utils/contactValidation.js';
import { isFast2smsConfigured, sendFast2sms } from '../utils/fast2sms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildParentRegistrationSms(student) {
  const name = String(student?.studentName || 'Student').trim();
  const year = String(student?.year || '').trim();
  const id = student?.rollNumber
    ? String(student.rollNumber).trim()
    : 'Admission / roll on record';
  return `SAHE Hostelers: Dear Parent, ${name}'s hostel registration is confirmed. Year: ${year}. ID: ${id}. Thank you.`;
}

/** Non-blocking; failures are logged only (registration still succeeds). */
function notifyParentRegistrationSms(studentDoc) {
  if (!studentDoc?.parentPhone || !isFast2smsConfigured()) return;
  const msg = buildParentRegistrationSms(studentDoc);
  void sendFast2sms(studentDoc.parentPhone, msg).then((r) => {
    if (!r.ok) {
      console.warn(
        '[Registration SMS] Failed for parent phone:',
        studentDoc.parentPhone,
        r.error
      );
    }
  });
}

function parsePendingAmount(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(String(raw).replace(/,/g, '').trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// @desc    Register a new student
// @route   POST /api/students
// @access  Public
export const registerStudent = async (req, res) => {
  try {
    
    // Extract all fields from request body
    const {
      studentName,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      branch,
      year,
      section,
      rollNumber,
      email,
      phone,
      address,
      parentPhone,
      parentOccupation,
      guardianName,
      guardianPhone,
      feeAmount,
      bloodGroup,
      allergies = 'None',
      medicalConditions = 'None',
      hasHealthIssues = 'no',
      healthIssuesDescription = '',
      emergencyContact,
      aadharNumber,
      cgpa,
      backlogs = 'no',
      backlogCount = 0,
      paymentStatus = 'Not Done',
      pendingAmount: pendingAmountRaw,
    } = req.body;

    const motherTrimmed = (motherName ?? '').trim();
    const pendingAmountParsed = parsePendingAmount(pendingAmountRaw);

    if (paymentStatus === 'Not Done') {
      if (pendingAmountParsed === null) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid pending amount (₹) when payment is pending.',
        });
      }
    }

    const contactValidationError = validateRegistrationContacts(
      email,
      phone,
      parentPhone,
      guardianPhone,
      emergencyContact
    );
    if (contactValidationError) {
      return res.status(400).json({
        success: false,
        error: contactValidationError,
      });
    }

    // Check if roll number already exists and update instead of failing
    let existingStudent = null;
    
    
    // Only check by roll number as primary key - no email checking
    if (rollNumber && rollNumber !== 'N/A' && rollNumber.trim() !== '') {
      existingStudent = await Student.findOne({ rollNumber: rollNumber });
      if (existingStudent) {
        
        // Update existing student by roll number (primary key)
        const updatedStudent = await Student.findByIdAndUpdate(
          existingStudent._id,
          {
            studentName,
            fatherName,
            ...(motherTrimmed ? { motherName: motherTrimmed } : {}),
            dateOfBirth,
            gender,
            branch,
            year,
            section,
            backlogs,
            cgpa,
            rollNumber: rollNumber || null,
            email,
            phone,
            address,
            parentPhone,
            parentOccupation,
            guardianName,
            guardianPhone,
            feeAmount,
            bloodGroup,
            emergencyContact,
            paymentStatus,
            pendingAmount: paymentStatus === 'Done' ? null : pendingAmountParsed,
            hasHealthIssues,
            aadharNumber,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        );


        notifyParentRegistrationSms(updatedStudent);

        return res.status(200).json({
          success: true,
          message: 'Registration updated successfully!',
          data: updatedStudent
        });
      }
    }

    // Validate roll number or administration number against CSV uploads
    const numberToValidate = rollNumber || 'N/A';
    
    // For 1st year students, they should have administration numbers, not N/A
    if (year === '1st Year') {
      if (numberToValidate === 'N/A' || !numberToValidate || numberToValidate.trim() === '') {
        return res.status(400).json({
          success: false,
          error: '1st Year students must provide an administration number (not N/A). Please contact faculty for your administration number.'
        });
      }
      // Validate administration number for 1st year students
      const validation = await validateStudentNumber(year, numberToValidate);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.message
        });
      } else {
      }
    } else {
      // For 2nd, 3rd, 4th year students - skip validation if N/A, otherwise validate roll number
      if (numberToValidate === 'N/A') {
      } else {
        // Validate roll number for senior students
        const validation = await validateStudentNumber(year, numberToValidate);
        
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: validation.message
          });
        } else {
        }
      }
    }
    
    // Handle file uploads
    const fileData = {};
    if (req.files) {
      
      const fileFields = [
        'studentPhoto',
        'parentPhoto',
        'tenthCertificate',
        'paymentReceipt',
        'aadharCard'
      ];
      
      fileFields.forEach(field => {
        if (req.files[field] && req.files[field][0]) {
          fileData[field] = req.files[field][0].filename;
        } else if (field !== 'paymentReceipt') { // paymentReceipt is optional
          if (field !== 'paymentReceipt') {
            return res.status(400).json({
              success: false,
              error: `Missing required file: ${field}`
            });
          }
        }
      });
    }

    // Prepare student data (omit motherName when absent so schema default applies)
    const studentData = {
      studentName: studentName.trim(),
      fatherName: fatherName.trim(),
      ...(motherTrimmed ? { motherName: motherTrimmed } : {}),
      dateOfBirth,
      gender,
      branch,
      year,
      section: section.trim(),
      rollNumber: rollNumber && rollNumber.trim() !== 'N/A' && rollNumber.trim() !== '' ? rollNumber.trim() : null,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address.trim(),
      parentPhone: parentPhone.trim(),
      parentOccupation: parentOccupation.trim(),
      guardianName: guardianName ? guardianName.trim() : null,
      guardianPhone: guardianPhone ? guardianPhone.trim() : null,
      bloodGroup,
      allergies: allergies.trim(),
      medicalConditions: medicalConditions.trim(),
      hasHealthIssues,
      healthIssuesDescription: healthIssuesDescription.trim(),
      emergencyContact: emergencyContact.trim(),
      aadharNumber: aadharNumber.trim(),
      cgpa: cgpa ? cgpa.toString().trim() : null,
      backlogs,
      backlogCount: backlogs === 'yes' ? Math.max(0, parseInt(backlogCount) || 0) : 0,
      paymentStatus,
      pendingAmount: paymentStatus === 'Done' ? null : pendingAmountParsed,
      ...fileData
    };

    
    const student = await Student.create(studentData);

    notifyParentRegistrationSms(student);

    res.status(201).json({
      success: true,
      message: 'Student registered successfully!',
      data: student
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get all students with search and filter
// @route   GET /api/students
// @access  Public
export const getStudents = async (req, res) => {
  try {
    const { search, branch, paymentStatus, page = 1, limit = 20 } = req.query;
    const query = {};

    // Search by name, roll number, phone, or email
    if (search) {
      const term = String(search).trim();
      const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { studentName: rx },
        { rollNumber: rx },
        { phone: rx },
        { email: rx },
      ];
    }

    // Filter by branch
    if (branch) {
      query.branch = branch;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('studentName phone branch paymentStatus pendingAmount rollNumber year');
    

    const count = await Student.countDocuments(query);

    res.status(200).json({
      success: true,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      count,
      data: students
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Public
export const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private
export const deleteStudent = async (req, res) => {
  
  try {
    // First try to find and delete the student in one operation
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    
    if (!deletedStudent) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }


    // Delete files if they exist (only if student was found and deleted)
    const deleteFile = (filePath) => {
      if (filePath) {
        try {
          const fullPath = path.join(process.cwd(), filePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
        }
      }
    };

    // Delete all associated files
    const filesToDelete = [
      deletedStudent.studentPhoto,
      deletedStudent.parentPhoto,
      deletedStudent.tenthCertificate,
      deletedStudent.paymentReceipt,
      deletedStudent.aadharCard
    ];

    filesToDelete.forEach(filePath => deleteFile(filePath));

    res.json({ 
      success: true,
      message: 'Student deleted successfully' 
    });
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete student. Please try again.'
    });
  }
};

// @desc    Login student with roll/administration number
// @route   POST /api/students/login
// @access  Public
export const loginStudent = async (req, res) => {
  try {
    
    const { rollNumber, year } = req.body;

    // Validate input
    if (!rollNumber || !year) {
      return res.status(400).json({
        success: false,
        message: 'Roll/administration number and year are required'
      });
    }

    // For 1st year students, they should have administration numbers, not N/A
    if (year === '1st Year') {
      if (rollNumber === 'N/A' || rollNumber.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '1st Year students must provide an administration number (not N/A)'
        });
      }
    }

    // Find student by roll number and year
    
    const student = await Student.findOne({ 
      rollNumber: rollNumber.trim(),
      year: year 
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid roll/administration number or year. Please check your credentials and try again.'
      });
    }


    // Create a proper JWT token
    const token = jwt.sign(
      { 
        id: student._id,
        rollNumber: student.rollNumber,
        name: student.studentName,
        year: student.year
      },
      process.env.JWT_SECRET || 'fallback_secret_key_for_development',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      student: {
        _id: student._id,
        studentName: student.studentName,
        rollNumber: student.rollNumber,
        year: student.year,
        email: student.email,
        phone: student.phone
      }
    });

  } catch (error) {
    console.error('Error in loginStudent:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify student (for existing functionality) credentials
// @route   GET /api/auth/verify
// @access  Public
export const verifyStudent = async (req, res) => {
  try {
    const { email, phone } = req.query;

    if (!email || !phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and phone are required' 
      });
    }

    const student = await Student.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }, 
      phone: phone 
    }).select('-password');

    if (!student) {
      return res.status(200).json({ 
        success: false,
        message: 'No student found with these credentials' 
      });
    }

    res.json({
      success: true,
      student: {
        _id: student._id,
        email: student.email,
        name: student.studentName,
        phone: student.phone
      }
    });
  } catch (error) {
    console.error('Error in verifyStudent:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
