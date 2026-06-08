import MealSelection from '../models/MealSelection.js';
import Student from '../models/Student.js';
import { sendMealReportEmail } from '../utils/emailService.js';
import { isStudentOnOutgoingServicesList } from '../utils/outingEligibility.js';

const MEAL_BLOCKED_OUTING_MSG =
  'You are on the Outgoing Services list and cannot select meals until you are removed from that list.';

const MEAL_WINDOW_TZ = 'Asia/Kolkata';
const MEAL_WINDOW_START_HOUR = 6;
const MEAL_WINDOW_END_HOUR = 18; // 6:00 PM — window closes at 18:00
const MEAL_SELECTION_DAYS = new Set([2, 6]); // Tuesday, Saturday

function getMealWindowParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MEAL_WINDOW_TZ,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value);

  return {
    day: dayMap[weekday] ?? -1,
    hour: Number.isFinite(hour) ? hour : -1,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

// Check if current time is within meal selection window (IST)
export const isMealSelectionOpen = () => {
  if (process.env.MEAL_SELECTION_ALWAYS_OPEN === 'true') return true;

  const { day, hour, minute } = getMealWindowParts();
  if (!MEAL_SELECTION_DAYS.has(day)) return false;

  const minutesSinceMidnight = hour * 60 + minute;
  const start = MEAL_WINDOW_START_HOUR * 60;
  const end = MEAL_WINDOW_END_HOUR * 60;
  return minutesSinceMidnight >= start && minutesSinceMidnight < end;
};

// Submit meal selection
export const submitMealSelection = async (req, res) => {
  try {
    
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

    if (await isStudentOnOutgoingServicesList(student.rollNumber)) {
      return res.status(403).json({
        success: false,
        error: MEAL_BLOCKED_OUTING_MSG,
        onOutgoingList: true,
      });
    }

    // Check if student has already made a selection for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    
    const existingSelection = await MealSelection.findOne({
      studentId,
      date: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingSelection) {
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


    await mealSelection.save();


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
    
    const student = await Student.findById(studentId).select('rollNumber');
    const onOutgoingList = student
      ? await isStudentOnOutgoingServicesList(student.rollNumber)
      : false;

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
        selection: existingSelection,
        onOutgoingList,
        canSelectMeal: !onOutgoingList,
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
