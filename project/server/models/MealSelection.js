import mongoose from 'mongoose';

const mealSelectionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mealType: {
    type: String,
    enum: ['veg', 'non-veg'],
    required: true
  },
  weekNumber: {
    type: Number,
    required: true,
    default: () => {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const pastDaysOfYear = (now - startOfYear) / 86400000;
      return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    }
  }
}, { timestamps: true });

// Add index for faster queries
mealSelectionSchema.index({ studentId: 1, date: 1 }, { unique: true });

const MealSelection = mongoose.model('MealSelection', mealSelectionSchema);

export default MealSelection;
