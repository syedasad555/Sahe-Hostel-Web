import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Faculty from '../models/Faculty.js';

dotenv.config();

const seedFaculty = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel-management');
    console.log('Connected to MongoDB');

    // Clear existing faculty collection (optional - remove if you want to keep existing data)
    await Faculty.deleteMany({});
    console.log('Cleared existing faculty collection');

    // Create default admin faculty
    const defaultFaculty = [
      {
        name: 'SAHE Administrator',
        email: 'saheadmin2025@sahe.ac.in',
        password: 'sahosahe111#', // This will be hashed automatically
        department: 'Administration',
        employeeId: 'ADMIN001',
        designation: 'System Administrator',
        phone: '1234567890',
        role: 'admin',
        isActive: true
      },
      {
        name: 'John Doe',
        email: 'john.faculty@sahe.ac.in',
        password: 'faculty123',
        department: 'Computer Science',
        employeeId: 'FAC001',
        designation: 'Assistant Professor',
        phone: '9876543210',
        role: 'faculty',
        isActive: true
      }
    ];

    // Insert faculty records
    const insertedFaculty = await Faculty.insertMany(defaultFaculty);
    console.log('Faculty records created:');
    insertedFaculty.forEach(faculty => {
      console.log(`- ${faculty.name} (${faculty.email}) - ${faculty.role}`);
    });

    console.log('\nFaculty seeding completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('Admin: saheadmin2025@sahe.ac.in / sahosahe111#');
    console.log('Faculty: john.faculty@sahe.ac.in / faculty123');

  } catch (error) {
    console.error('Error seeding faculty:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the seeding function
seedFaculty();
