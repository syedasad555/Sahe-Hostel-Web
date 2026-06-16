import React, { useState, useEffect, useRef } from 'react';
import { Camera, User, FileText, CreditCard, CheckCircle2, Clock, ChevronRight, ChevronLeft, ChevronDown, Upload, Heart, Home, GraduationCap, Users, AlertCircle, Loader2, X } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

function normalizePhoneDigits(value) {
  if (value === undefined || value === null) return '';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('91')) return digits.slice(-10);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

function isValidIndianMobile(value) {
  const d = normalizePhoneDigits(value);
  return /^[6-9]\d{9}$/.test(d);
}

function isValidEmailStrict(value) {
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

/** Returns alert message string or null if no duplicate vs student phone */
function phoneDuplicateAgainstStudent(studentPhone, otherPhones) {
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
      return `${label} cannot be the same as your student phone number.`;
    }
  }
  return null;
}

function getInlineEmailError(email) {
  if (!email || !String(email).trim()) return '';
  if (!isValidEmailStrict(email)) {
    return 'Enter a valid email address (e.g. name@domain.com).';
  }
  return '';
}

function getInlineStudentPhoneError(phone) {
  if (!phone || !String(phone).trim()) return '';
  if (!isValidIndianMobile(phone)) {
    return 'Enter exactly 10 digits; Indian mobile starts with 6–9 (+91 optional).';
  }
  return '';
}

/** Parent, guardian, or emergency: duplicate vs student first, then format */
function getInlineOtherPhoneError(fieldValue, studentPhone) {
  if (!fieldValue || !String(fieldValue).trim()) return '';
  const sDig = normalizePhoneDigits(studentPhone);
  const fDig = normalizePhoneDigits(fieldValue);
  if (
    sDig.length === 10 &&
    /^[6-9]\d{9}$/.test(sDig) &&
    fDig === sDig &&
    fDig.length === 10
  ) {
    return 'Must be different from your student phone number.';
  }
  if (!isValidIndianMobile(fieldValue)) {
    return 'Enter exactly 10 digits; Indian mobile starts with 6–9 (+91 optional).';
  }
  return '';
}

function FieldErrorMsg({ text }) {
  if (!text) return null;
  return (
    <p
      style={{ marginTop: 6, fontSize: '13px', color: '#dc2626', lineHeight: 1.4 }}
      role="alert"
    >
      {text}
    </p>
  );
}

function SectionSelect({ value, onChange, options, selectStyle, placeholder = 'Select Section' }) {
  const [open, setOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState(null);
  const rootRef = useRef(null);
  const menuItems = [{ label: placeholder, value: '' }, ...options.map((option) => ({ label: option, value: option }))];

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open) setHoveredValue(null);
  }, [open]);

  return (
    <div ref={rootRef} className="student-reg-section-select" style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="student-reg-section-select-trigger"
        style={{
          ...selectStyle,
          width: '100%',
          textAlign: 'left',
          backgroundColor: '#ffffff',
          color: value ? '#0f172a' : '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          boxSizing: 'border-box',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{value || placeholder}</span>
        <ChevronDown size={16} style={{ flexShrink: 0, color: '#0f172a' }} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="student-reg-section-select-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
            backgroundColor: '#ffffff',
            border: '1px solid #64748b',
            borderRadius: 0,
            boxShadow: 'none',
            listStyle: 'none',
            zIndex: 100,
            maxHeight: '240px',
            overflowY: 'auto',
          }}
        >
          {menuItems.map((item) => {
            const isHighlighted = hoveredValue !== null
              ? hoveredValue === item.value
              : value === item.value;

            return (
              <li
                key={item.value || '__placeholder__'}
                role="option"
                aria-selected={value === item.value}
                onMouseEnter={() => setHoveredValue(item.value)}
                onMouseLeave={() => setHoveredValue(null)}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: 'clamp(14px, 2.5vw, 15px)',
                  lineHeight: 1.4,
                  color: isHighlighted ? '#ffffff' : '#0f172a',
                  backgroundColor: isHighlighted ? '#2563eb' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const StudentRegister = ({ onRegistered }) => {
  const successRedirectTimerRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    dateOfBirth: '',
    gender: '',
    branch: '',
    year: '',
    section: '',
    backlogs: '',
    backlogCount: '',
    cgpa: '',
    rollNumber: '',
    email: '',
    phone: '',
    address: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    guardianName: '',
    guardianPhone: '',
    roomSharing: '',
    feeAmount: 0,
    bloodGroup: '',
    allergies: '',
    medicalConditions: '',
    emergencyContact: '',
    paymentStatus: 'Not Done',
    pendingAmount: '',
    hasHealthIssues: '',
    healthIssuesDescription: '',
    aadharNumber: ''
  });

  const [files, setFiles] = useState({
    studentPhoto: null,
    parentPhoto: null,
    tenthCertificate: null,
    aadharCard: null,
    paymentReceipt: null
  });

  const [previewUrls, setPreviewUrls] = useState({
    studentPhoto: null,
    parentPhoto: null,
    tenthCertificate: null,
    aadharCard: null,
    paymentReceipt: null
  });

  const isFirstYearStudent = formData.year === '1st Year';

  useEffect(() => {
    setIsVisible(true);
    return () => {
      if (successRedirectTimerRef.current) {
        clearTimeout(successRedirectTimerRef.current);
        successRedirectTimerRef.current = null;
      }
    };
  }, []);

  const branches = [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
  ];

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'NA'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'rollNumber' ? value.toUpperCase() : value;

    if (name === 'paymentStatus') {
      setFormData(prev => ({
        ...prev,
        paymentStatus: value,
        ...(value === 'Done' ? { pendingAmount: '' } : {}),
      }));
      return;
    }

    if (name === 'year') {
      if (value === '1st Year') {
        setFormData(prev => ({
          ...prev,
          year: value,
          cgpa: '',
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          year: value,
        }));
        setFiles(prev => ({ ...prev, aadharCard: null }));
        setPreviewUrls(prev => ({ ...prev, aadharCard: null }));
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: nextValue
    }));

    if (name === 'roomSharing') {
      setFormData(prev => ({
        ...prev,
        feeAmount: feeStructure[value] || 0
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, and PDF files are allowed');
        return;
      }

      setFiles(prev => ({
        ...prev,
        [name]: file
      }));

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrls(prev => ({
            ...prev,
            [name]: e.target.result
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrls(prev => ({
          ...prev,
          [name]: null
        }));
      }
    }
  };

  const validateStep1 = () => {
    const requiredFields = [
      'studentName', 'fatherName', 'dateOfBirth', 'gender',
      'branch', 'year', 'section', 'backlogs', 'email', 'phone', 'address',
      'parentPhone', 'parentOccupation'
    ];

    for (let field of requiredFields) {
      if (!formData[field]) {
        alert(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Check if backlogs is yes and backlogCount is required
    if (formData.backlogs === 'yes' && !formData.backlogCount) {
      alert('Please specify the number of backlogs');
      return false;
    }

    // Make roll number required for non-1st year students
    if (formData.year !== '1st Year' && !formData.rollNumber) {
      alert('Please enter your roll number');
      return false;
    }

    if (!files.studentPhoto || !files.parentPhoto || !files.tenthCertificate) {
      alert('Please upload all required documents');
      return false;
    }

    if (!isValidEmailStrict(formData.email)) {
      alert('Please enter a valid email address.');
      return false;
    }

    if (!isValidIndianMobile(formData.phone)) {
      alert('Student phone must be a valid 10-digit Indian mobile number (starting with 6–9).');
      return false;
    }

    if (!isValidIndianMobile(formData.parentPhone)) {
      alert('Parent phone must be a valid 10-digit Indian mobile number (starting with 6–9).');
      return false;
    }

    if (formData.guardianPhone && String(formData.guardianPhone).trim() !== '') {
      if (!isValidIndianMobile(formData.guardianPhone)) {
        alert('Guardian phone must be a valid 10-digit Indian mobile number, or leave it blank.');
        return false;
      }
    }

    let dupEarly = phoneDuplicateAgainstStudent(formData.phone, {
      parentPhone: formData.parentPhone,
      guardianPhone: formData.guardianPhone,
      emergencyContact: '',
    });
    if (dupEarly) {
      alert(dupEarly);
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const requiredFields = ['bloodGroup', 'emergencyContact', 'paymentStatus', 'aadharNumber'];

    for (let field of requiredFields) {
      if (!formData[field]) {
        alert(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    if (formData.paymentStatus === 'Done' && !files.paymentReceipt) {
      alert('Please upload payment receipt');
      return false;
    }

    if (formData.paymentStatus === 'Not Done') {
      const p = Number(formData.pendingAmount);
      if (formData.pendingAmount === '' || !Number.isFinite(p) || p < 0) {
        alert('Please enter a valid pending amount (₹) when payment is pending.');
        return false;
      }
    }

    if (formData.year === '1st Year' && !files.aadharCard) {
      alert('Please upload your Aadhar card photo');
      return false;
    }

    if (!isValidIndianMobile(formData.emergencyContact)) {
      alert(
        'Emergency contact must be a valid 10-digit Indian mobile number (starting with 6–9).'
      );
      return false;
    }

    const dupLate = phoneDuplicateAgainstStudent(formData.phone, {
      parentPhone: formData.parentPhone,
      guardianPhone: formData.guardianPhone,
      emergencyContact: formData.emergencyContact,
    });
    if (dupLate) {
      alert(dupLate);
      return false;
    }

    return true;
  };

  const isStepValid = (step) => {
    switch(step) {
      case 1:
        const baseFieldsValid = (
          formData.studentName &&
          formData.fatherName &&
          formData.dateOfBirth &&
          formData.gender &&
          formData.branch &&
          formData.year &&
          formData.section &&
          formData.backlogs &&
          (formData.backlogs === 'no' || (formData.backlogs === 'yes' && formData.backlogCount)) &&
          formData.email &&
          formData.phone &&
          formData.address &&
          formData.parentPhone &&
          formData.parentOccupation &&
          files.studentPhoto &&
          files.parentPhoto &&
          files.tenthCertificate
        );
        
        // Roll number is required only for non-1st year students
        const rollNumberValid = formData.year === '1st Year' || formData.rollNumber;

        const emailPhoneOk =
          isValidEmailStrict(formData.email || '') &&
          isValidIndianMobile(formData.phone) &&
          isValidIndianMobile(formData.parentPhone) &&
          (!String(formData.guardianPhone || '').trim() ||
            isValidIndianMobile(formData.guardianPhone)) &&
          phoneDuplicateAgainstStudent(formData.phone, {
            parentPhone: formData.parentPhone,
            guardianPhone: formData.guardianPhone,
            emergencyContact: '',
          }) === null;

        return baseFieldsValid && rollNumberValid && emailPhoneOk;
      case 2: {
        const pendingOk =
          formData.paymentStatus !== 'Not Done' ||
          (formData.pendingAmount !== '' &&
            Number.isFinite(Number(formData.pendingAmount)) &&
            Number(formData.pendingAmount) >= 0);
        const receiptOk = formData.paymentStatus !== 'Done' || !!files.paymentReceipt;
        const emergencyOk =
          isValidIndianMobile(formData.emergencyContact) &&
          phoneDuplicateAgainstStudent(formData.phone, {
            parentPhone: formData.parentPhone,
            guardianPhone: formData.guardianPhone,
            emergencyContact: formData.emergencyContact,
          }) === null;
        return (
          formData.bloodGroup &&
          formData.aadharNumber &&
          receiptOk &&
          pendingOk &&
          emergencyOk &&
          (formData.year !== '1st Year' || files.aadharCard) &&
          formData.hasHealthIssues !== '' &&
          (formData.hasHealthIssues === 'no' ||
            (formData.hasHealthIssues === 'yes' && formData.healthIssuesDescription))
        );
      }
      default:
        return true;
    }
  };

  const hasRegistrationInlineErrors = (step) => {
    switch (step) {
      case 1:
        return !!(
          getInlineEmailError(formData.email) ||
          getInlineStudentPhoneError(formData.phone) ||
          getInlineOtherPhoneError(formData.parentPhone, formData.phone) ||
          getInlineOtherPhoneError(formData.guardianPhone, formData.phone)
        );
      case 2:
        return !!getInlineOtherPhoneError(formData.emergencyContact, formData.phone);
      default:
        return false;
    }
  };

  const registrationStepReady =
    isStepValid(currentStep) && !hasRegistrationInlineErrors(currentStep);

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    if (isStepValid(currentStep) && !hasRegistrationInlineErrors(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClosePopup = () => {
    if (successRedirectTimerRef.current) {
      clearTimeout(successRedirectTimerRef.current);
      successRedirectTimerRef.current = null;
    }
    setShowSuccessPopup(false);
    resetRegistrationForm();
    onRegistered?.();
  };

  function resetRegistrationForm() {
    setFormData({
      studentName: '', fatherName: '', dateOfBirth: '',
      gender: '', branch: '', year: '', section: '', backlogs: '',
      backlogCount: '', cgpa: '', rollNumber: '', email: '',
      phone: '', address: '', parentName: '', parentPhone: '',
      parentEmail: '', parentOccupation: '', guardianName: '', guardianPhone: '',
      roomSharing: '', feeAmount: 0, bloodGroup: '', allergies: '', medicalConditions: '',
      emergencyContact: '', paymentStatus: 'Not Done', pendingAmount: '', hasHealthIssues: '',
      healthIssuesDescription: '', aadharNumber: ''
    });
    setFiles({
      studentPhoto: null, parentPhoto: null,
      tenthCertificate: null, aadharCard: null, paymentReceipt: null
    });
    setPreviewUrls({
      studentPhoto: null, parentPhoto: null,
      tenthCertificate: null, aadharCard: null, paymentReceipt: null
    });
    setCurrentStep(1);
    setSubmitStatus(null);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasRegistrationInlineErrors(1) || hasRegistrationInlineErrors(2)) {
      return;
    }

    // Validate administration number for 1st year students
    if (formData.year === '1st Year') {
      if (!formData.rollNumber || formData.rollNumber.trim() === '' || formData.rollNumber === 'N/A') {
        alert('Please enter your admission number (not N/A)');
        return;
      }
    } else if (!formData.rollNumber) {
      alert('Please enter your roll number');
      return;
    }

    if (!validateStep1()) {
      return;
    }

    if (!validateStep2()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Create FormData object to send files and form data
      const formDataToSend = new FormData();
      
      // Add all form data to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, value);
        }
      });
      formDataToSend.append('motherName', '');
      
      // Add files to FormData if they exist
      if (files.studentPhoto) {
        formDataToSend.append('studentPhoto', files.studentPhoto);
      }
      if (files.parentPhoto) {
        formDataToSend.append('parentPhoto', files.parentPhoto);
      }
      if (files.tenthCertificate) {
        formDataToSend.append('tenthCertificate', files.tenthCertificate);
      }
      if (formData.year === '1st Year' && files.aadharCard) {
        formDataToSend.append('aadharCard', files.aadharCard);
      }
      if (files.paymentReceipt) {
        formDataToSend.append('paymentReceipt', files.paymentReceipt);
      }



      // Send data to backend API
      const response = await fetch('/api/students', {
        method: 'POST',
        body: formDataToSend,
        // Don't set Content-Type header, let the browser set it with the correct boundary
      });


      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error response:', errorData);
        let apiMsg = '';
        try {
          const parsed = JSON.parse(errorData);
          apiMsg = parsed?.error || parsed?.message || '';
        } catch (_) {
          /* not JSON */
        }
        throw new Error(
          apiMsg || `Registration failed (${response.status}). Please check your details and try again.`
        );
      }

      const responseData = await response.json();

      setShowSuccessPopup(true);

      if (successRedirectTimerRef.current) {
        clearTimeout(successRedirectTimerRef.current);
      }
      successRedirectTimerRef.current = setTimeout(() => {
        successRedirectTimerRef.current = null;
        setShowSuccessPopup(false);
        resetRegistrationForm();
        onRegistered?.();
      }, 2600);

    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        type: 'error',
        message:
          error?.message && typeof error.message === 'string'
            ? error.message
            : 'Registration failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Popup Component
  const SuccessPopup = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      }}>
        <button 
          onClick={handleClosePopup}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'color 0.2s ease',
          }}
          aria-label="Close popup"
        >
          <X size={24} />
        </button>
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f0fdf4',
            color: '#22c55e',
            margin: '0 auto 20px',
            animation: 'scaleIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
          }}>
            <CheckCircle2 size={64} style={{
              animation: 'checkmark 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both',
              transform: 'scale(0)',
              transformOrigin: 'center',
            }} />
          </div>
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '16px',
        }}>Registration Successful!</h2>
        <p style={{
          fontSize: '16px',
          color: '#475569',
          lineHeight: '1.6',
          marginBottom: '32px',
        }}>
          Welcome to SAHE Hostelers family. Your registration has been completed successfully.
        </p>
        <button 
          onClick={handleClosePopup}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="student-reg-root" style={styles.container}>
      <ConfirmationDialog
        isOpen={showSuccessPopup}
        onClose={handleClosePopup}
        onConfirm={handleClosePopup}
        title="Success"
        message="Your registration has been submitted successfully! Returning you to the home page."
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        input, select, textarea {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: brightness(0) saturate(100%) invert(45%) sepia(8%) saturate(719%) hue-rotate(183deg) brightness(92%) contrast(87%);
          cursor: pointer;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
        }

        .student-reg-root .student-reg-form,
        .student-reg-root .student-reg-section,
        .student-reg-root .student-reg-grid {
          overflow: visible;
        }

        .student-reg-section-select-trigger {
          appearance: none;
          -webkit-appearance: none;
        }

        /* Mobile-friendly registration layout */
        @media (max-width: 640px) {
          .student-reg-root .student-reg-hero {
            padding: 64px 12px 44px !important;
          }
          .student-reg-root .student-reg-hero-title {
            font-size: clamp(1.35rem, 6vw, 1.85rem) !important;
            margin-bottom: 10px !important;
          }
          .student-reg-root .student-reg-hero-sub {
            font-size: 0.95rem !important;
          }
          .student-reg-root .student-reg-hero-desc {
            font-size: 0.8125rem !important;
            line-height: 1.5 !important;
          }
          .student-reg-root .student-reg-main {
            padding: 20px 0 !important;
          }
          .student-reg-root .student-reg-form {
            padding: 16px 12px !important;
            border-radius: 16px !important;
          }
          .student-reg-root .student-reg-progress-steps {
            flex-direction: column !important;
            gap: 14px !important;
          }
          .student-reg-root .student-reg-step-head {
            margin-bottom: 28px !important;
          }
          .student-reg-root .student-reg-step-title {
            font-size: 1.25rem !important;
            line-height: 1.25 !important;
          }
          .student-reg-root .student-reg-step-head p {
            font-size: 0.8125rem !important;
            line-height: 1.45 !important;
          }
          .student-reg-root .student-reg-section {
            padding: 16px 12px !important;
            margin-bottom: 22px !important;
          }
          .student-reg-root .student-reg-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .student-reg-root .student-reg-upload-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .student-reg-root .student-reg-payment-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .student-reg-root .student-reg-actions {
            flex-direction: column-reverse !important;
            align-items: stretch !important;
            gap: 10px !important;
            margin-top: 22px !important;
          }
          .student-reg-root .student-reg-actions button {
            width: 100% !important;
            justify-content: center !important;
            box-sizing: border-box !important;
          }
          .student-reg-root .student-reg-aadhar-upload {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Hero Section */}
      <div className="student-reg-hero" style={styles.hero}>
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent} className={isVisible ? 'fade-in-up' : ''}>
          <h1 className="student-reg-hero-title" style={styles.heroTitle}>
            Student <span style={styles.gradient}>Registration</span>
          </h1>
          <p className="student-reg-hero-sub" style={styles.heroSubtitle}>Join the SAHE Hostelers Family</p>
          <p className="student-reg-hero-desc" style={styles.heroDescription}>
            Complete the registration process in just two simple steps and become part of our vibrant community
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="student-reg-main" style={styles.mainContent}>
        <div className="student-reg-form" style={styles.formContainer}>
          {/* Progress Indicator */}
          <div style={styles.progressSection} className={isVisible ? 'fade-in-up' : ''}>
            <div style={styles.progressBar}>
              <div style={{...styles.progressFill, width: `${(currentStep / 2) * 100}%`}} />
            </div>
            <div className="student-reg-progress-steps" style={styles.progressSteps}>
              <div style={{...styles.stepItem, ...(currentStep >= 1 ? styles.stepActive : {})}}>
                <div style={{...styles.stepCircle, ...(currentStep >= 1 ? styles.stepCircleActive : {})}}>
                  <User size={20} />
                </div>
                <span style={styles.stepLabel}>Personal Details</span>
              </div>
              <div style={{...styles.stepItem, ...(currentStep >= 2 ? styles.stepActive : {})}}>
                <div style={{...styles.stepCircle, ...(currentStep >= 2 ? styles.stepCircleActive : {})}}>
                  <Home size={20} />
                </div>
                <span style={styles.stepLabel}>Health & Payment</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form noValidate onSubmit={handleSubmit} style={styles.form}>
            {currentStep === 1 && (
              <div style={styles.formStep} className={isVisible ? 'fade-in-up' : ''}>
                <div className="student-reg-step-head" style={styles.stepHeader}>
                  <h2 className="student-reg-step-title" style={styles.stepTitle}>Personal & Academic Details</h2>
                  <p style={styles.stepDescription}>Please provide your personal information and academic details</p>
                </div>

                {/* Student Information */}
                <div className="student-reg-section" style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <GraduationCap size={22} style={styles.sectionIcon} />
                    <h3 style={styles.sectionTitle}>Student Information</h3>
                  </div>

                  <div className="student-reg-grid" style={styles.grid}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Full Name *</label>
                      <input
                        type="text"
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Father's Name *</label>
                      <input
                        type="text"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Date of Birth *</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Gender *</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        style={styles.select}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={{
                          ...styles.input,
                          ...(getInlineEmailError(formData.email)
                            ? styles.inputHasError
                            : {}),
                        }}
                        placeholder="name@gmail.com"
                        autoComplete="email"
                        inputMode="email"
                        title="Enter a valid email address (e.g. name@domain.com)."
                        required
                      />
                      <FieldErrorMsg text={getInlineEmailError(formData.email)} />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={{
                          ...styles.input,
                          ...(getInlineStudentPhoneError(formData.phone)
                            ? styles.inputHasError
                            : {}),
                        }}
                        placeholder="10-digit mobile"
                        autoComplete="tel"
                        title="Indian mobile only: 10 digits starting with 6–9 (+91 prefix is optional)."
                        required
                      />
                      <FieldErrorMsg text={getInlineStudentPhoneError(formData.phone)} />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <br></br>
                    <label style={styles.label}>Complete Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      style={styles.textarea}
                      rows="3"
                      required
                    />
                  </div>
                </div>

                {/* Academic Information */}
                <div className="student-reg-section" style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <GraduationCap size={22} style={styles.sectionIcon} />
                    <h3 style={styles.sectionTitle}>Academic Information</h3>
                  </div>

                  <div className="student-reg-grid" style={styles.grid}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Branch *</label>
                      <select
                        name="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        style={styles.select}
                        required
                      >
                        <option value="">Select Branch</option>
                        {branches.map(branch => (
                          <option key={branch} value={branch}>{branch}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Year *</label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        style={styles.select}
                        required
                      >
                        <option value="">Select Year</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>
                        {formData.year === '1st Year' ? 'Admission Number *' : 'Roll Number *'}
                      </label>
                      <input
                        type="text"
                        name="rollNumber"
                        value={formData.rollNumber}
                        onChange={handleInputChange}
                        style={{ ...styles.input, textTransform: 'uppercase' }}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        required
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Section *</label>
                      <SectionSelect
                        value={formData.section}
                        onChange={(section) => setFormData((prev) => ({ ...prev, section }))}
                        options={sections}
                        selectStyle={styles.select}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>
                        {formData.year === '1st Year' ? 'Intermediate Marks (in %)' : 'CGPA (up to last semester)'}
                      </label>
                      <input
                        type="number"
                        name="cgpa"
                        value={formData.cgpa}
                        onChange={handleInputChange}
                        style={styles.input}
                        step={formData.year === '1st Year' ? '0.1' : '0.01'}
                        min={formData.year === '1st Year' ? '35' : '0'}
                        max={formData.year === '1st Year' ? '100' : '10'}
                        placeholder={formData.year === '1st Year' ? 'e.g., 85.5' : 'e.g., 8.5'}
                        required={formData.year === '1st Year'}
                      />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <br></br>
                    <label style={styles.label}>Do you have any backlogs? *</label>
                    <div style={styles.radioGroup}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginRight: '20px',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="radio"
                          name="backlogs"
                          value="yes"
                          checked={formData.backlogs === 'yes'}
                          onChange={() => setFormData(prev => ({ ...prev, backlogs: 'yes' }))}
                          style={{
                            width: '18px',
                            height: '18px',
                            marginRight: '8px',
                            cursor: 'pointer'
                          }}
                          required
                        />
                        <span>Yes</span>
                      </label>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="radio"
                          name="backlogs"
                          value="no"
                          checked={formData.backlogs === 'no'}
                          onChange={() => setFormData(prev => ({ ...prev, backlogs: 'no', backlogCount: '' }))}
                          style={{
                            width: '18px',
                            height: '18px',
                            marginRight: '8px',
                            cursor: 'pointer'
                          }}
                          required
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {formData.backlogs === 'yes' && (
                      <div style={{ width: '100%', marginTop: '12px' }}>
                        <label style={{...styles.label, marginBottom: '8px', display: 'block'}}>How many backlogs? *</label>
                        <input
                          type="number"
                          name="backlogCount"
                          value={formData.backlogCount}
                          onChange={handleInputChange}
                          style={styles.input}
                          min="1"
                          placeholder="Enter number of backlogs"
                          required={true}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Parent Information */}
                <div className="student-reg-section" style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <Users size={22} style={styles.sectionIcon} />
                    <h3 style={styles.sectionTitle}>Parent Information</h3>
                  </div>

                  <div className="student-reg-grid" style={styles.grid}>
                

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Parent Phone *</label>
                      <input
                        type="tel"
                        name="parentPhone"
                        value={formData.parentPhone}
                        onChange={handleInputChange}
                        style={{
                          ...styles.input,
                          ...(getInlineOtherPhoneError(formData.parentPhone, formData.phone)
                            ? styles.inputHasError
                            : {}),
                        }}
                        placeholder="Different from student number"
                        autoComplete="tel"
                        title="Must be valid 10-digit Indian mobile and different from student phone."
                        required
                      />
                      <FieldErrorMsg text={getInlineOtherPhoneError(formData.parentPhone, formData.phone)} />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Parent Occupation *</label>
                      <input
                        type="text"
                        name="parentOccupation"
                        value={formData.parentOccupation}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Guardian Name</label>
                      <input
                        type="text"
                        name="guardianName"
                        value={formData.guardianName}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Guardian Phone</label>
                      <input
                        type="tel"
                        name="guardianPhone"
                        value={formData.guardianPhone}
                        onChange={handleInputChange}
                        style={{
                          ...styles.input,
                          ...(getInlineOtherPhoneError(formData.guardianPhone, formData.phone)
                            ? styles.inputHasError
                            : {}),
                        }}
                        autoComplete="tel"
                        title="Must differ from student phone if entered."
                      />
                      <FieldErrorMsg text={getInlineOtherPhoneError(formData.guardianPhone, formData.phone)} />
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div className="student-reg-section" style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <Upload size={22} style={styles.sectionIcon} />
                    <h3 style={styles.sectionTitle}>Document Upload</h3>
                  </div>

                  <div className="student-reg-upload-grid" style={styles.uploadGrid}>
                    <label style={styles.uploadBox}>
                      <input
                        type="file"
                        name="studentPhoto"
                        onChange={handleFileChange}
                        accept="image/*"
                        style={styles.fileInput}
                        required
                      />
                      {previewUrls.studentPhoto ? (
                        <img src={previewUrls.studentPhoto} alt="Student" style={styles.previewImage} />
                      ) : (
                        <div style={styles.uploadContent}>
                          <Camera size={32} style={styles.uploadIcon} />
                          <span style={styles.uploadTitle}>Student Photo</span>
                          <span style={styles.uploadSubtitle}>JPG, PNG (Max 5MB)</span>
                        </div>
                      )}
                    </label>

                    <label style={styles.uploadBox}>
                      <input
                        type="file"
                        name="parentPhoto"
                        onChange={handleFileChange}
                        accept="image/*"
                        style={styles.fileInput}
                        required
                      />
                      {previewUrls.parentPhoto ? (
                        <img src={previewUrls.parentPhoto} alt="Parent" style={styles.previewImage} />
                      ) : (
                        <div style={styles.uploadContent}>
                          <User size={32} style={styles.uploadIcon} />
                          <span style={styles.uploadTitle}>Guardian Photo</span>
                          <span style={styles.uploadSubtitle}>JPG, PNG (Max 5MB)</span>
                        </div>
                      )}
                    </label>

                    <label style={styles.uploadBox}>
                      <input
                        type="file"
                        name="tenthCertificate"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        style={styles.fileInput}
                        required
                      />
                      <div style={styles.uploadContent}>
                        <FileText size={32} style={styles.uploadIcon} />
                        <span style={styles.uploadTitle}>10th Certificate</span>
                        <span style={styles.uploadSubtitle}>PDF, JPG, PNG (Max 5MB)</span>
                        {files.tenthCertificate && (
                          <span style={styles.fileName}>{files.tenthCertificate.name}</span>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div className="student-reg-actions" style={styles.actions}>
                  <button 
                    type="button" 
                    onClick={nextStep} 
                    style={{
                      ...styles.btnPrimary,
                      opacity: registrationStepReady ? 1 : 0.6,
                      cursor: registrationStepReady ? 'pointer' : 'not-allowed'
                    }}
                    disabled={!registrationStepReady}
                  >
                    <span>Next Step</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div style={styles.formStep} className={isVisible ? 'fade-in-up' : ''}>
                <div className="student-reg-step-head" style={styles.stepHeader}>
                  <h2 className="student-reg-step-title" style={styles.stepTitle}>Health & Payment Details</h2>
                  <p style={styles.stepDescription}>Provide health information and payment details</p>
                </div>

                {/* Health Information */}
                <div className="student-reg-section" style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <Heart size={22} style={styles.sectionIcon} />
                    <h3 style={styles.sectionTitle}>Health Information</h3>
                  </div>

                  <div className="student-reg-grid" style={styles.grid}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Blood Group *</label>
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleInputChange}
                        style={styles.select}
                        required
                      >
                        <option value="">Select Blood Group</option>
                        {bloodGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Any health issues? *</label>
                      <div style={styles.radioGroup}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginRight: '20px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="radio"
                            name="hasHealthIssues"
                            value="yes"
                            checked={formData.hasHealthIssues === 'yes'}
                            onChange={() => setFormData(prev => ({ ...prev, hasHealthIssues: 'yes' }))}
                            style={{
                              width: '18px',
                              height: '18px',
                              marginRight: '8px',
                              cursor: 'pointer'
                            }}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="radio"
                            name="hasHealthIssues"
                            value="no"
                            checked={formData.hasHealthIssues === 'no'}
                            onChange={() => setFormData(prev => ({ ...prev, hasHealthIssues: 'no', healthIssuesDescription: '' }))}
                            style={{
                              width: '18px',
                              height: '18px',
                              marginRight: '8px',
                              cursor: 'pointer'
                            }}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                      {formData.hasHealthIssues === 'yes' && (
                        <div style={{ width: '100%', marginTop: '12px' }}>
                          <label style={{...styles.label, marginBottom: '8px', display: 'block'}}>Please describe the health issues *</label>
                          <textarea
                            name="healthIssuesDescription"
                            value={formData.healthIssuesDescription || ''}
                            onChange={handleInputChange}
                            style={styles.textarea}
                            rows="3"
                            placeholder="Please provide details about your health issues"
                            required={true}
                          />
                        </div>
                      )}
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Emergency Contact *</label>
                      <input
                        type="tel"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        style={{
                          ...styles.input,
                          ...(getInlineOtherPhoneError(
                            formData.emergencyContact,
                            formData.phone
                          )
                            ? styles.inputHasError
                            : {}),
                        }}
                        required
                        placeholder="10-digit, different from your number"
                        autoComplete="tel"
                        title="Must be valid 10-digit Indian mobile and different from student phone."
                      />
                      <FieldErrorMsg
                        text={getInlineOtherPhoneError(formData.emergencyContact, formData.phone)}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Aadhar Number *</label>
                      <input
                        type="text"
                        name="aadharNumber"
                        value={formData.aadharNumber}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                        placeholder="XXXX XXXX XXXX"
                        maxLength="12"
                        pattern="[0-9]{12}"
                      />

                      {isFirstYearStudent && (
                        <label
                          className="student-reg-aadhar-upload"
                          style={styles.aadharUploadBox}
                        >
                          <input
                            type="file"
                            name="aadharCard"
                            onChange={handleFileChange}
                            accept="image/*,.pdf"
                            style={styles.fileInput}
                            required
                          />
                          {previewUrls.aadharCard ? (
                            <img
                              src={previewUrls.aadharCard}
                              alt="Aadhar"
                              style={styles.aadharPreviewImage}
                            />
                          ) : (
                            <CreditCard size={18} style={styles.uploadIcon} />
                          )}
                          <div style={styles.aadharUploadText}>
                            <span style={styles.aadharUploadTitle}>Aadhar Card Photo *</span>
                            <span style={styles.aadharUploadSubtitle}>PDF, JPG, PNG (max 5MB)</span>
                            {files.aadharCard && (
                              <span style={styles.aadharFileName}>{files.aadharCard.name}</span>
                            )}
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                </div>

                {/* Payment Information */}
                <div className="student-reg-section" style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <CreditCard size={22} style={styles.sectionIcon} />
                    <h3 style={styles.sectionTitle}>Payment Information</h3>
                  </div>

                  <div className="student-reg-payment-grid" style={styles.paymentGrid}>
                    <label
                      style={{
                        ...styles.paymentCard,
                        ...(formData.paymentStatus === 'Done' ? styles.paymentCardSelected : {})
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentStatus"
                        value="Done"
                        checked={formData.paymentStatus === 'Done'}
                        onChange={handleInputChange}
                        style={styles.radioInput}
                      />
                      <CheckCircle2 size={32} style={styles.paymentIcon} />
                      <span style={styles.paymentLabel}>Payment Completed</span>
                    </label>

                    <label
                      style={{
                        ...styles.paymentCard,
                        ...(formData.paymentStatus === 'Not Done' ? styles.paymentCardSelected : {})
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentStatus"
                        value="Not Done"
                        checked={formData.paymentStatus === 'Not Done'}
                        onChange={handleInputChange}
                        style={styles.radioInput}
                      />
                      <Clock size={32} style={styles.paymentIcon} />
                      <span style={styles.paymentLabel}>Payment Pending</span>
                    </label>
                  </div>

                  {formData.paymentStatus === 'Not Done' && (
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Pending amount (₹) *</label>
                      <input
                        type="number"
                        name="pendingAmount"
                        value={formData.pendingAmount}
                        onChange={handleInputChange}
                        style={styles.input}
                        min="0"
                        step="any"
                        placeholder="e.g. 15000"
                        required
                      />
                      <p style={{ marginTop: 6, fontSize: '13px', color: '#64748b' }}>
                        Enter how much hostel fee is still pending to be paid.
                      </p>
                    </div>
                  )}

                  {formData.paymentStatus === 'Done' && (
                    <label style={styles.receiptUpload}>
                      <input
                        type="file"
                        name="paymentReceipt"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        style={styles.fileInput}
                        required
                      />
                      <div style={styles.uploadContent}>
                        <FileText size={32} style={styles.uploadIcon} />
                        <span style={styles.uploadTitle}>Upload Payment Receipt</span>
                        <span style={styles.uploadSubtitle}>PDF, JPG, PNG (Max 5MB)</span>
                        {files.paymentReceipt && (
                          <span style={styles.fileName}>{files.paymentReceipt.name}</span>
                        )}
                      </div>
                    </label>
                  )}
                </div>

                {submitStatus && (
                  <div style={{
                    ...styles.statusMessage,
                    ...(submitStatus.type === 'success' ? styles.statusSuccess : styles.statusError)
                  }}>
                    {submitStatus.type === 'success' ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <AlertCircle size={20} />
                    )}
                    <span>{submitStatus.message}</span>
                  </div>
                )}

                <div className="student-reg-actions" style={styles.actions}>
                  <button type="button" onClick={prevStep} style={styles.btnSecondary}>
                    <ChevronLeft size={20} />
                    <span>Previous</span>
                  </button>
                  <button 
                    type="submit" 
                    style={{
                      ...styles.btnPrimary,
                      opacity: registrationStepReady ? 1 : 0.6,
                      cursor: registrationStepReady ? 'pointer' : 'not-allowed'
                    }}
                    disabled={isSubmitting || !registrationStepReady}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={20} style={styles.spinner} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span>Submit Application</span>
                        <CheckCircle2 size={20} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  hero: {
    position: 'relative',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: 'clamp(48px, 12vw, 100px) clamp(12px, 4vw, 20px) clamp(44px, 10vw, 80px)',
    textAlign: 'center',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: 'clamp(1.5rem, 4vw + 0.75rem, 3rem)',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '16px',
    lineHeight: '1.2',
  },
  gradient: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: 'clamp(0.95rem, 2.2vw, 1.25rem)',
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: '12px',
  },
  heroDescription: {
    fontSize: 'clamp(0.8125rem, 1.8vw, 1rem)',
    color: '#cbd5e1',
    lineHeight: '1.6',
    maxWidth: '600px',
    margin: '0 auto',
  },
  mainContent: {
    padding: 'clamp(24px, 5vw, 60px) clamp(12px, 4vw, 20px)',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 'clamp(14px, 2.5vw, 24px)',
    padding: 'clamp(18px, 4vw, 48px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  progressSection: {
    marginBottom: '48px',
  },
  progressBar: {
    height: '4px',
    backgroundColor: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '32px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
    transition: 'width 0.4s ease',
  },
  progressSteps: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '24px',
  },
  stepItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    opacity: 0.5,
    transition: 'opacity 0.3s ease',
  },
  stepActive: {
    opacity: 1,
  },
  stepCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    transition: 'all 0.3s ease',
  },
  stepCircleActive: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: '#ffffff',
    transform: 'scale(1.05)',
  },
  stepLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  formStep: {
    width: '100%',
  },
  stepHeader: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  stepTitle: {
    fontSize: 'clamp(1.25rem, 3vw, 2rem)',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '12px',
  },
  stepDescription: {
    fontSize: '16px',
    color: '#64748b',
  },
  section: {
    marginBottom: 'clamp(24px, 4vw, 40px)',
    padding: 'clamp(18px, 3vw, 32px)',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  sectionIcon: {
    color: '#3b82f6',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
    gap: 'clamp(12px, 2vw, 20px)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#334155',
  },
  input: {
    padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 16px)',
    fontSize: 'clamp(14px, 2.5vw, 15px)',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    color: '#0f172a',
  },
  inputHasError: {
    borderColor: '#f87171',
    boxShadow: '0 0 0 1px #fecaca',
  },
  select: {
    padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 16px)',
    fontSize: 'clamp(14px, 2.5vw, 15px)',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  textarea: {
    padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 16px)',
    fontSize: 'clamp(14px, 2.5vw, 15px)',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    color: '#0f172a',
    resize: 'vertical',
    minHeight: '100px',
    width: '100%',
    boxSizing: 'border-box',
  },
  radioGroup: {
    display: 'flex',
    gap: '24px',
    margin: '8px 0 16px',
    flexWrap: 'wrap',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    cursor: 'pointer',
    position: 'relative',
    paddingLeft: '32px',
    userSelect: 'none',
    '&:hover input ~ span': {
      borderColor: '#3b82f6',
    },
  },
  radioInput: {
    position: 'absolute',
    opacity: 0,
    cursor: 'pointer',
    height: '20px',
    width: '20px',
    zIndex: 1,
  },
  radioCustom: {
    position: 'relative',
    display: 'inline-block',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #94a3b8',
    marginRight: '8px',
    transition: 'all 0.2s ease',
    pointerEvents: 'none',
  },
  radioText: {
    marginLeft: '8px',
    fontSize: '15px',
    color: '#334155',
    userSelect: 'none',
    fontFamily: 'inherit',
  },
  'input[type="radio"]:checked + span': {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  'input[type="radio"]:focus + span': {
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
  },
  'input[type="radio"]:checked + span::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'white',
  },
  uploadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
    gap: 'clamp(12px, 2vw, 20px)',
  },
  uploadBox: {
    position: 'relative',
    aspectRatio: '1',
    border: '2px dashed #cbd5e1',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  fileInput: {
    display: 'none',
  },
  uploadContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px',
    textAlign: 'center',
  },
  uploadIcon: {
    color: '#3b82f6',
  },
  uploadTitle: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#334155',
  },
  uploadSubtitle: {
    fontSize: '13px',
    color: '#64748b',
  },
  fileName: {
    fontSize: '12px',
    color: '#3b82f6',
    marginTop: '4px',
    fontWeight: '500',
    wordBreak: 'break-all',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  aadharUploadBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
    padding: '10px 12px',
    border: '1.5px dashed #cbd5e1',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#f8fafc',
    maxWidth: '100%',
  },
  aadharPreviewImage: {
    width: '44px',
    height: '44px',
    borderRadius: '6px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  aadharUploadText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  aadharUploadTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    lineHeight: 1.3,
  },
  aadharUploadSubtitle: {
    fontSize: '11px',
    color: '#64748b',
    lineHeight: 1.3,
  },
  aadharFileName: {
    fontSize: '11px',
    color: '#3b82f6',
    fontWeight: '500',
    wordBreak: 'break-all',
    lineHeight: 1.3,
  },
  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  roomCard: {
    position: 'relative',
    padding: '24px',
    border: '2px solid #e2e8f0',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff',
  },
  roomCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.2)',
  },
  roomContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  roomIcon: {
    color: '#3b82f6',
    marginBottom: '4px',
  },
  roomType: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
  },
  roomPrice: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#3b82f6',
  },
  priceUnit: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
  },
  roomFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '8px',
    alignItems: 'center',
  },
  feature: {
    fontSize: '13px',
    color: '#475569',
  },
  feeSummary: {
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  feeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
  },
  feeLabel: {
    fontSize: '15px',
    color: '#64748b',
  },
  feeValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#334155',
  },
  feeDivider: {
    height: '1px',
    backgroundColor: '#e2e8f0',
    margin: '12px 0',
  },
  feeLabelTotal: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#1e293b',
  },
  feeValueTotal: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#3b82f6',
  },
  paymentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    gap: 'clamp(12px, 2vw, 20px)',
    marginBottom: '24px',
  },
  paymentCard: {
    padding: '32px 24px',
    border: '2px solid #e2e8f0',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  paymentCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.2)',
  },
  paymentIcon: {
    color: '#3b82f6',
  },
  paymentLabel: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#334155',
  },
  receiptUpload: {
    display: 'block',
    padding: '32px',
    border: '2px dashed #cbd5e1',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff',
  },
  statusMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '15px',
    fontWeight: '500',
  },
  statusSuccess: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    border: '1px solid #86efac',
  },
  statusError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
  },
  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'flex-end',
    marginTop: '32px',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
};

export default StudentRegister;