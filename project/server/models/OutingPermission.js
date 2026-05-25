import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    rollNumber: { type: String, required: true, trim: true },
    studentName: { type: String, default: '' },
    studentPhone: { type: String, default: '', trim: true },
    parentPhone: { type: String, default: '' },
    block: { type: String, default: '', trim: true },
    ok: { type: Boolean, default: false },
    feedback: { type: String, default: '' },
    requestId: { type: String, default: '' },
    httpStatus: { type: Number, default: null },
  },
  { _id: false }
);

const outingPermissionSchema = new mongoose.Schema(
  {
    outingOut: { type: Date, required: true },
    outingIn: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true }
);

outingPermissionSchema.index({ outingIn: 1, createdAt: -1 });
outingPermissionSchema.index({ 'members.rollNumber': 1 });

export default mongoose.model('OutingPermission', outingPermissionSchema);

