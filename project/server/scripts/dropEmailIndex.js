import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const dropEmailIndex = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected to MongoDB');
    
    // Get students collection
    const db = mongoose.connection.db;
    const collection = db.collection('students');
    
    // Drop email index
    try {
      await collection.dropIndex('email_1');
      console.log('Successfully dropped email_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('email_1 index does not exist, no need to drop');
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

dropEmailIndex();
