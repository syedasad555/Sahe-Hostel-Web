import Student from '../models/Student.js';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { validateStudentNumber } from '../utils/csvValidation.js';
import { validateRegistrationContacts } from '../utils/contactValidation.js';
import {
  buildSalesquaredRegistrationMessage,
  isSalesquaredConfigured,
  sendSalesquaredSms,
} from '../utils/salesquared.js';
import { UPLOADS_DIR } from '../config/uploadsDir.js';
import { toApiJson, toApiJsonList } from '../utils/apiSerialize.js';
import { likePattern, parseId } from '../utils/queryHelpers.js';

const UPLOAD_FILE_FIELDS = [
  'studentPhoto',
  'parentPhoto',
  'tenthCertificate',
  'paymentReceipt',
  'aadharCard',
];

const REQUIRED_UPLOAD_FIELDS_ALL = new Set([
  'studentPhoto',
  'parentPhoto',
  'tenthCertificate',
]);

function getRequiredUploadFields(year) {
  const required = new Set(REQUIRED_UPLOAD_FIELDS_ALL);
  if (year === '1st Year') {
    required.add('aadharCard');
  }
  return required;
}

/** @returns {{ fileData?: Record<string, string>, error?: string }} */
function buildFileDataFromRequest(req, { requireAll = false, year } = {}) {
  const fileData = {};
  const requiredFields = requireAll ? getRequiredUploadFields(year) : new Set();
  if (!req.files) {
    if (requireAll && requiredFields.size > 0) {
      return { error: 'Missing required file uploads.' };
    }
    return { fileData };
  }

  for (const field of UPLOAD_FILE_FIELDS) {
    if (req.files[field]?.[0]) {
      fileData[field] = req.files[field][0].filename;
    } else if (requiredFields.has(field)) {
      return { error: `Missing required file: ${field}` };
    }
  }

  return { fileData };
}

function deleteStoredUpload(filename) {
  if (!filename) return;
  try {
    const fullPath = path.join(UPLOADS_DIR, path.basename(filename));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Error deleting upload:', error);
  }
}

function removeReplacedUploads(existingStudent, fileData) {
  for (const [field, newFilename] of Object.entries(fileData)) {
    const previous = existingStudent?.[field];
    if (previous && previous !== newFilename) {
      deleteStoredUpload(previous);
    }
  }
}

/** Non-blocking; failures are logged only (registration still succeeds). */
function notifyParentRegistrationSms(studentDoc) {
  if (!studentDoc?.parentPhone || !isSalesquaredConfigured()) return;
  const msg = buildSalesquaredRegistrationMessage(studentDoc);
  void sendSalesquaredSms(studentDoc.parentPhone, msg).then((r) => {
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
      existingStudent = await Student.findOne({ where: { rollNumber } });
      if (existingStudent) {
        const { fileData, error: fileError } = buildFileDataFromRequest(req, {
          requireAll: false,
        });
        if (fileError) {
          return res.status(400).json({ success: false, error: fileError });
        }

        if (Object.keys(fileData).length > 0) {
          removeReplacedUploads(existingStudent, fileData);
        }

        await existingStudent.update({
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
          ...fileData,
        });

        await existingStudent.reload();
        notifyParentRegistrationSms(existingStudent);

        return res.status(200).json({
          success: true,
          message: 'Registration updated successfully!',
          data: toApiJson(existingStudent),
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
    
    const { fileData, error: fileError } = buildFileDataFromRequest(req, {
      requireAll: true,
      year,
    });
    if (fileError) {
      return res.status(400).json({ success: false, error: fileError });
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
      data: toApiJson(student),
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
    const where = {};

    if (search) {
      const term = String(search).trim();
      where[Op.or] = [
        { studentName: likePattern(term) },
        { rollNumber: likePattern(term) },
        { phone: likePattern(term) },
        { email: likePattern(term) },
      ];
    }

    if (branch) where.branch = branch;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const offset = (pageNum - 1) * limitNum;

    const { rows: students, count } = await Student.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
      attributes: [
        'id',
        'studentName',
        'phone',
        'branch',
        'paymentStatus',
        'pendingAmount',
        'rollNumber',
        'year',
        'createdAt',
        'updatedAt',
      ],
    });

    res.status(200).json({
      success: true,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      count,
      data: toApiJsonList(students),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

export const getStudent = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const student = id ? await Student.findByPk(id) : null;

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: toApiJson(student),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const deletedStudent = id ? await Student.findByPk(id) : null;

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
      });
    }

    const filesToDelete = [
      deletedStudent.studentPhoto,
      deletedStudent.parentPhoto,
      deletedStudent.tenthCertificate,
      deletedStudent.paymentReceipt,
      deletedStudent.aadharCard,
    ];
    filesToDelete.forEach((filePath) => deleteStoredUpload(filePath));

    await deletedStudent.destroy();

    res.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete student. Please try again.',
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
      where: {
        rollNumber: rollNumber.trim(),
        year,
      },
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid roll/administration number or year. Please check your credentials and try again.',
      });
    }

    const token = jwt.sign(
      {
        id: String(student.id),
        rollNumber: student.rollNumber,
        name: student.studentName,
        year: student.year,
      },
      process.env.JWT_SECRET || 'fallback_secret_key_for_development',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      student: {
        _id: String(student.id),
        studentName: student.studentName,
        rollNumber: student.rollNumber,
        year: student.year,
        email: student.email,
        phone: student.phone,
      },
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
      where: {
        email: email,
        phone,
      },
    });

    if (!student) {
      return res.status(200).json({
        success: false,
        message: 'No student found with these credentials',
      });
    }

    res.json({
      success: true,
      student: {
        _id: String(student.id),
        email: student.email,
        name: student.studentName,
        phone: student.phone,
      },
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
