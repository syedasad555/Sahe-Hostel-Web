import MealSelection from '../models/MealSelection.js';
import Student from '../models/Student.js';
import { sendMealReportEmail } from '../utils/emailService.js';

// Check if current time is within meal selection window
export const isMealSelectionOpen = () => {
  // TEMPORARILY DISABLED: Always return true for unrestricted meal selection
  return true;
  
  // Original time restrictions (commented out for now)
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 2 is Tuesday, 3 is Wednesday
  const hours = now.getHours();
  
  // Tuesday 6 PM (18:00) to 11 PM (23:00)
  if (day === 2 && hours >= 18 && hours < 23) return true;
  
  // Wednesday 6 AM (6:00) to 11 AM (11:00)
  if (day === 3 && hours >= 6 && hours < 11) return true;
  
  return false;
};

// Submit meal selection
export const submitMealSelection = async (req, res) => {
  try {
    console.log('Submitting meal selection with data:', req.body);
    
    if (!isMealSelectionOpen()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Meal selection is currently closed.' 
      });
    }

    const { studentId, mealType } = req.body;

    if (!studentId || !mealType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student ID and meal type are required.' 
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found.' 
      });
    }

    // Check if student has already made a selection for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Checking for existing selection for student:', studentId, 'today:', today);
    
    const existingSelection = await MealSelection.findOne({
      studentId,
      date: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingSelection) {
      console.log('Student already has a selection:', existingSelection);
      return res.status(400).json({ 
        success: false, 
        error: 'You have already made your meal selection for today.' 
      });
    }

    // Create new meal selection
    const mealSelection = new MealSelection({
      studentId,
      mealType,
      date: new Date()
    });

    console.log('Creating new meal selection:', mealSelection);

    await mealSelection.save();

    console.log('Meal selection saved successfully:', mealSelection);

    res.status(201).json({ 
      success: true, 
      message: 'Meal selection submitted successfully!',
      data: mealSelection 
    });
  } catch (error) {
    console.error('Error submitting meal selection:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit meal selection.' 
    });
  }
};

// Check if student has already selected a meal for today
export const checkMealSelection = async (req, res) => {
  try {
    const studentId = req.query.studentId || req.params.studentId;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required.'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingSelection = await MealSelection.findOne({
      studentId,
      date: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    res.status(200).json({
      success: true,
      data: {
        hasSelectedMeal: !!existingSelection,
        selection: existingSelection
      }
    });
  } catch (error) {
    console.error('Error checking meal selection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check meal selection.'
    });
  }
};

// Get meal statistics
export const getMealStatistics = async (req, res) => {
  try {
    console.log('Fetching meal statistics...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Today date (midnight):', today);
    console.log('Tomorrow date (midnight):', new Date(today.getTime() + 24 * 60 * 60 * 1000));

    const stats = await MealSelection.aggregate([
      {
        $match: {
          date: { 
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: '$mealType',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Aggregated stats:', stats);

    // Convert array to object for easier access
    const result = {
      veg: 0,
      'non-veg': 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    console.log('Final result:', result);

    res.status(200).json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('Error fetching meal statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch meal statistics.' 
    });
  }
};

// Send meal report (to be called by scheduler)
export const sendDailyMealReport = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = await MealSelection.aggregate([
      {
        $match: {
          date: { 
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: '$mealType',
          count: { $sum: 1 }
        }
      }
    ]);

    const report = {
      veg: 0,
      'non-veg': 0,
      total: 0,
      date: today
    };

    stats.forEach(stat => {
      report[stat._id] = stat.count;
      report.total += stat.count;
    });

    // Send email with the report
    await sendMealReportEmail(report);
    
    return { success: true, data: report };
  } catch (error) {
    console.error('Error generating meal report:', error);
    return { success: false, error: error.message };
  }
};
