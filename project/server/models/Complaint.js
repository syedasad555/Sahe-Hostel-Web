import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved'],
      default: 'open',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Complaint', complaintSchema);
