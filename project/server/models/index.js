import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/sequelize.js';

export const Student = sequelize.define(
  'Student',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    studentName: { type: DataTypes.STRING(255), allowNull: false },
    fatherName: { type: DataTypes.STRING(255), allowNull: false },
    motherName: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
    gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: false },
    branch: { type: DataTypes.STRING(100), allowNull: false },
    year: {
      type: DataTypes.ENUM('1st Year', '2nd Year', '3rd Year', '4th Year'),
      allowNull: false,
    },
    section: { type: DataTypes.STRING(50), allowNull: false },
    rollNumber: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    cgpa: { type: DataTypes.STRING(20), allowNull: true },
    backlogs: { type: DataTypes.ENUM('yes', 'no'), defaultValue: 'no' },
    backlogCount: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    email: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: false },
    parentPhone: { type: DataTypes.STRING(20), allowNull: false },
    parentOccupation: { type: DataTypes.STRING(255), allowNull: false },
    guardianName: { type: DataTypes.STRING(255), allowNull: true },
    guardianPhone: { type: DataTypes.STRING(20), allowNull: true },
    feeAmount: { type: DataTypes.STRING(50), allowNull: true },
    bloodGroup: { type: DataTypes.STRING(10), allowNull: false },
    allergies: { type: DataTypes.STRING(500), defaultValue: 'None' },
    medicalConditions: { type: DataTypes.STRING(500), defaultValue: 'None' },
    hasHealthIssues: { type: DataTypes.ENUM('yes', 'no'), defaultValue: 'no' },
    healthIssuesDescription: { type: DataTypes.TEXT, allowNull: true },
    emergencyContact: { type: DataTypes.STRING(20), allowNull: false },
    aadharNumber: { type: DataTypes.STRING(20), allowNull: true },
    studentPhoto: { type: DataTypes.STRING(500), allowNull: true },
    parentPhoto: { type: DataTypes.STRING(500), allowNull: true },
    tenthCertificate: { type: DataTypes.STRING(500), allowNull: true },
    paymentReceipt: { type: DataTypes.STRING(500), allowNull: true },
    aadharCard: { type: DataTypes.STRING(500), allowNull: true },
    paymentStatus: {
      type: DataTypes.ENUM('Done', 'Not Done'),
      allowNull: false,
      defaultValue: 'Not Done',
    },
    pendingAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  },
  { tableName: 'students' }
);

export const Faculty = sequelize.define(
  'Faculty',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    department: { type: DataTypes.STRING(100), allowNull: false },
    employeeId: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    designation: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLogin: { type: DataTypes.DATE, allowNull: true },
    role: { type: DataTypes.ENUM('admin', 'faculty'), defaultValue: 'faculty' },
  },
  { tableName: 'faculty' }
);

Faculty.beforeCreate(async (faculty) => {
  if (faculty.password) {
    const salt = await bcrypt.genSalt(12);
    faculty.password = await bcrypt.hash(faculty.password, salt);
  }
});

Faculty.beforeUpdate(async (faculty) => {
  if (faculty.changed('password') && faculty.password) {
    const salt = await bcrypt.genSalt(12);
    faculty.password = await bcrypt.hash(faculty.password, salt);
  }
});

Faculty.prototype.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

Faculty.prototype.updateLastLogin = async function updateLastLogin() {
  this.lastLogin = new Date();
  return this.save();
};

export const Complaint = sequelize.define(
  'Complaint',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    rollNumber: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM('open', 'in_review', 'resolved'),
      defaultValue: 'open',
    },
  },
  { tableName: 'complaints' }
);

export const MealSelection = sequelize.define(
  'MealSelection',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    mealType: { type: DataTypes.ENUM('veg', 'non-veg'), allowNull: false },
    weekNumber: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    tableName: 'meal_selections',
    indexes: [{ unique: true, fields: ['student_id', 'date'] }],
  }
);

export const OutingPermission = sequelize.define(
  'OutingPermission',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    outingOut: { type: DataTypes.DATE, allowNull: false },
    outingIn: { type: DataTypes.DATE, allowNull: false },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  { tableName: 'outing_permissions' }
);

export const OutingPermissionMember = sequelize.define(
  'OutingPermissionMember',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    permissionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    rollNumber: { type: DataTypes.STRING(100), allowNull: false },
    studentName: { type: DataTypes.STRING(255), defaultValue: '' },
    studentPhone: { type: DataTypes.STRING(20), defaultValue: '' },
    parentPhone: { type: DataTypes.STRING(20), defaultValue: '' },
    block: { type: DataTypes.STRING(100), defaultValue: '' },
    ok: { type: DataTypes.BOOLEAN, defaultValue: false },
    feedback: { type: DataTypes.TEXT, defaultValue: '' },
    requestId: { type: DataTypes.STRING(255), defaultValue: '' },
    httpStatus: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'outing_permission_members' }
);

export const CSVUpload = sequelize.define(
  'CSVUpload',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.ENUM('rollNumbers', 'adminNumbers'), allowNull: false },
    numbers: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    uploadDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'csv_uploads' }
);

export const SystemAdmin = sequelize.define(
  'SystemAdmin',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  },
  { tableName: 'system_admins' }
);

Student.hasMany(MealSelection, { foreignKey: 'studentId', as: 'mealSelections' });
MealSelection.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Faculty.hasMany(OutingPermission, { foreignKey: 'createdBy', as: 'outingPermissions' });
OutingPermission.belongsTo(Faculty, { foreignKey: 'createdBy', as: 'creator' });

OutingPermission.hasMany(OutingPermissionMember, {
  foreignKey: 'permissionId',
  as: 'members',
  onDelete: 'CASCADE',
});
OutingPermissionMember.belongsTo(OutingPermission, {
  foreignKey: 'permissionId',
  as: 'permission',
});

export async function syncModels() {
  await sequelize.sync();
}

export default {
  sequelize,
  Student,
  Faculty,
  Complaint,
  MealSelection,
  OutingPermission,
  OutingPermissionMember,
  CSVUpload,
  SystemAdmin,
  syncModels,
};
