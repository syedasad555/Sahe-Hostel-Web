/**
 * Reset a faculty password in MongoDB (forgot-password recovery).
 *
 * Usage (from project/server):
 *   node scripts/resetFacultyPassword.js <email> <newPassword>
 *
 * Example:
 *   node scripts/resetFacultyPassword.js saheadmin2025@sahe.ac.in "MyNewSecurePass1!"
 *
 * Requires MONGODB_URI in .env (same as the main app).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Faculty from '../models/Faculty.js';

dotenv.config();

const [, , emailArg, newPasswordArg] = process.argv;

async function main() {
  if (!emailArg || !newPasswordArg) {
    console.error('Usage: node scripts/resetFacultyPassword.js <email> <newPassword>');
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const newPassword = newPasswordArg;

  if (newPassword.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel-management';

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const faculty = await Faculty.findOne({ email });
    if (!faculty) {
      console.error(`No faculty found with email: ${email}`);
      process.exit(1);
    }

    faculty.password = newPassword;
    await faculty.save();

    console.log(`Password updated for: ${faculty.name} (${faculty.email})`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

main();
