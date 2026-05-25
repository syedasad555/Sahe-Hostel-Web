import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  // Personal Information
  studentName: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: false, default: '' },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  
  // Academic Information
  branch: { type: String, required: true },
  year: { type: String, required: true, enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
  section: { type: String, required: true },
  rollNumber: { type: String, required: false, default: null },
  cgpa: { type: String },
  backlogs: { type: String, enum: ['yes', 'no'], default: 'no' },
  backlogCount: { type: Number, default: 0 },
  
  // Contact Information
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  
  // Parent Information
  parentPhone: { type: String, required: true },
  parentOccupation: { type: String, required: true },
  guardianName: { type: String },
  guardianPhone: { type: String },
  
  // Health Information
  bloodGroup: { type: String, required: true },
  allergies: { type: String, default: 'None' },
  medicalConditions: { type: String, default: 'None' },
  hasHealthIssues: { type: String, enum: ['yes', 'no'], default: 'no' },
  healthIssuesDescription: { type: String },
  emergencyContact: { type: String, required: true },
  
  // Identity Information
  aadharNumber: { type: String },
  
  // Documents
  studentPhoto: { type: String },
  parentPhoto: { type: String },
  tenthCertificate: { type: String },
  paymentReceipt: { type: String },
  aadharCard: { type: String },
  
  // System Fields
  paymentStatus: { type: String, required: true, enum: ['Done', 'Not Done'], default: 'Not Done' },
  /** Amount still pending when paymentStatus is "Not Done" */
  pendingAmount: { type: Number, default: null },
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

export default Student;
