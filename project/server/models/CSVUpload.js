import mongoose from 'mongoose';

const csvUploadSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['rollNumbers', 'adminNumbers'],
    required: true
  },
  numbers: [{
    type: String,
    required: true
  }],
  uploadDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const CSVUpload = mongoose.model('CSVUpload', csvUploadSchema);

export default CSVUpload;
