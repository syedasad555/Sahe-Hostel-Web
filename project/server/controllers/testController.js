import CSVUpload from '../models/CSVUpload.js';
import mongoose from 'mongoose';

export const testDatabaseConnection = async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    // Test MongoDB connection
    const dbState = mongoose.connection.readyState;
    console.log('MongoDB connection state:', dbState);
    
    // Test creating a simple document
    const testDoc = await CSVUpload.create({
      type: 'rollNumbers',
      numbers: ['TEST123', 'TEST456'],
      isActive: true
    });

    console.log('Test document created:', testDoc);

    // Find all documents
    const allDocs = await CSVUpload.find({});
    console.log('All CSVUpload documents:', allDocs.length);
    
    // Clean up test document
    await CSVUpload.deleteOne({ _id: testDoc._id });
    console.log('Test document cleaned up');

    res.status(200).json({
      success: true,
      message: 'Database connection test successful',
      totalDocuments: allDocs.length,
      testDocument: testDoc,
      dbState: dbState
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed: ' + error.message,
      error: error.toString()
    });
  }
};
