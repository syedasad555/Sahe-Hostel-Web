/**
 * Reset a faculty password in MySQL (forgot-password recovery).
 *
 * Usage (from project/server):
 *   node scripts/resetFacultyPassword.js <email> <newPassword>
 */
import '../config/loadEnv.js';
import connectDB, { sequelize } from '../config/db.js';
import Faculty from '../models/Faculty.js';

const [, , emailArg, newPasswordArg] = process.argv;

async function main() {
  if (!emailArg || !newPasswordArg) {
    console.error('Usage: node scripts/resetFacultyPassword.js <email> <newPassword>');
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const newPassword = newPasswordArg;

  if (newPassword.length < 10) {
    console.error('Password must be at least 10 characters.');
    process.exit(1);
  }

  try {
    await connectDB();

    const faculty = await Faculty.findOne({ where: { email } });
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
    await sequelize.close();
    console.log('Connection closed');
  }
}

main();
