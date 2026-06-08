/**
 * Create the initial faculty admin from environment variables only.
 * Never commit real passwords to the repo.
 *
 * Usage (from project/server):
 *   npm run seed-faculty
 *
 * Required in .env:
 *   FACULTY_SEED_EMAIL, FACULTY_SEED_PASSWORD, FACULTY_SEED_NAME,
 *   FACULTY_SEED_EMPLOYEE_ID, FACULTY_SEED_DEPARTMENT, FACULTY_SEED_PHONE
 *
 * Optional: FACULTY_SEED_RESET=true to clear all faculty before seeding (dev only).
 */
import '../config/loadEnv.js';
import mongoose from 'mongoose';
import Faculty from '../models/Faculty.js';

function requireEnv(name) {
  const value = String(process.env[name] ?? '').trim();
  if (!value) {
    console.error(`Missing ${name}. Set it in project/server/.env before running seed-faculty.`);
    process.exit(1);
  }
  return value;
}

const seedFaculty = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.FACULTY_SEED_ALLOW_PRODUCTION !== 'true') {
    console.error('Refusing to seed faculty in production. Set FACULTY_SEED_ALLOW_PRODUCTION=true only if you intend this.');
    process.exit(1);
  }

  const email = requireEnv('FACULTY_SEED_EMAIL').toLowerCase();
  const password = requireEnv('FACULTY_SEED_PASSWORD');
  const name = requireEnv('FACULTY_SEED_NAME');
  const employeeId = requireEnv('FACULTY_SEED_EMPLOYEE_ID');
  const department = requireEnv('FACULTY_SEED_DEPARTMENT');
  const phone = requireEnv('FACULTY_SEED_PHONE');

  if (password.length < 10) {
    console.error('FACULTY_SEED_PASSWORD must be at least 10 characters.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel-management');
    console.log('Connected to MongoDB');

    if (process.env.FACULTY_SEED_RESET === 'true') {
      await Faculty.deleteMany({});
      console.log('Cleared existing faculty collection (FACULTY_SEED_RESET=true).');
    }

    const existing = await Faculty.findOne({ email });
    if (existing) {
      console.log(`Faculty already exists for ${email}. No changes made.`);
      return;
    }

    const faculty = await Faculty.create({
      name,
      email,
      password,
      department,
      employeeId,
      designation: process.env.FACULTY_SEED_DESIGNATION || 'Administrator',
      phone,
      role: 'admin',
      isActive: true,
    });

    console.log(`Faculty admin created: ${faculty.name} (${faculty.email})`);
    console.log('Store credentials securely; they are not printed or saved in the repository.');
  } catch (error) {
    console.error('Error seeding faculty:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

seedFaculty();
