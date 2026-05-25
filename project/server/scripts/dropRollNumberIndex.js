import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropRollNumberIndex = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected to MongoDB');
    
    // Get the students collection
    const db = mongoose.connection.db;
    const collection = db.collection('students');
    
    // Drop the rollNumber index
    try {
      await collection.dropIndex('rollNumber_1');
      console.log('Successfully dropped rollNumber_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('rollNumber_1 index does not exist, no need to drop');
      } else {
        console.log('Error dropping index:', error.message);
      }
    }
    
    // List all indexes to verify
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    console.log('Index operation completed');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

dropRollNumberIndex();
