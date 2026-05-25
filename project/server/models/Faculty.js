import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const facultySchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Faculty Details
  department: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  designation: { type: String, required: true },
  
  // Contact Information
  phone: { type: String, required: true },
  
  // System Fields
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  role: { type: String, enum: ['admin', 'faculty'], default: 'faculty' }
}, { timestamps: true });

// Hash password before saving
facultySchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
facultySchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
facultySchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

const Faculty = mongoose.model('Faculty', facultySchema);

export default Faculty;
