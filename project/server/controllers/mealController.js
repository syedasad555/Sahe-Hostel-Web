import { fn, col, literal } from 'sequelize';
import MealSelection from '../models/MealSelection.js';
import Student from '../models/Student.js';
import { sendMealReportEmail } from '../utils/emailService.js';
import { isStudentOnOutgoingServicesList } from '../utils/outingEligibility.js';
import { toApiJson } from '../utils/apiSerialize.js';
import { parseId, todayDateOnly } from '../utils/queryHelpers.js';

const MEAL_BLOCKED_OUTING_MSG =
  'You are on the Outgoing Services list and cannot select meals until you are removed from that list.';

const MEAL_WINDOW_TZ = 'Asia/Kolkata';
const MEAL_WINDOW_START_HOUR = 6;
const MEAL_WINDOW_END_HOUR = 18;
const MEAL_SELECTION_DAYS = new Set([2, 6]);

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

export const isMealSelectionOpen = () => {
  if (process.env.MEAL_SELECTION_ALWAYS_OPEN === 'true') return true;

  const { day, hour, minute } = getMealWindowParts();
  if (!MEAL_SELECTION_DAYS.has(day)) return false;

  const minutesSinceMidnight = hour * 60 + minute;
  const start = MEAL_WINDOW_START_HOUR * 60;
  const end = MEAL_WINDOW_END_HOUR * 60;
  return minutesSinceMidnight >= start && minutesSinceMidnight < end;
};

function weekNumberFromDate(date = new Date()) {
  const now = date;
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now - startOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

async function getTodayMealStats() {
  const today = todayDateOnly();
  const rows = await MealSelection.findAll({
    attributes: ['mealType', [fn('COUNT', col('id')), 'count']],
    where: { date: today },
    group: ['mealType'],
    raw: true,
  });

  const result = { veg: 0, 'non-veg': 0, total: 0 };
  for (const row of rows) {
    const n = Number(row.count) || 0;
    result[row.mealType] = n;
    result.total += n;
  }
  return result;
}

export const submitMealSelection = async (req, res) => {
  try {
    if (!isMealSelectionOpen()) {
      return res.status(400).json({
        success: false,
        error: 'Meal selection is currently closed.',
      });
    }

    const { studentId, mealType } = req.body;
    const sid = parseId(studentId);

    if (!sid || !mealType) {
      return res.status(400).json({
        success: false,
        error: 'Student ID and meal type are required.',
      });
    }

    const student = await Student.findByPk(sid);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found.',
      });
    }

    if (await isStudentOnOutgoingServicesList(student.rollNumber)) {
      return res.status(403).json({
        success: false,
        error: MEAL_BLOCKED_OUTING_MSG,
        onOutgoingList: true,
      });
    }

    const today = todayDateOnly();
    const existingSelection = await MealSelection.findOne({
      where: { studentId: sid, date: today },
    });

    if (existingSelection) {
      return res.status(400).json({
        success: false,
        error: 'You have already made your meal selection for today.',
      });
    }

    const mealSelection = await MealSelection.create({
      studentId: sid,
      mealType,
      date: today,
      weekNumber: weekNumberFromDate(),
    });

    res.status(201).json({
      success: true,
      message: 'Meal selection submitted successfully!',
      data: toApiJson(mealSelection),
    });
  } catch (error) {
    console.error('Error submitting meal selection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit meal selection.',
    });
  }
};

export const checkMealSelection = async (req, res) => {
  try {
    const sid = parseId(req.query.studentId || req.params.studentId);

    if (!sid) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required.',
      });
    }

    const today = todayDateOnly();
    const student = await Student.findByPk(sid, { attributes: ['rollNumber'] });
    const onOutgoingList = student
      ? await isStudentOnOutgoingServicesList(student.rollNumber)
      : false;

    const existingSelection = await MealSelection.findOne({
      where: { studentId: sid, date: today },
    });

    res.status(200).json({
      success: true,
      data: {
        hasSelectedMeal: !!existingSelection,
        selection: existingSelection ? toApiJson(existingSelection) : null,
        onOutgoingList,
        canSelectMeal: !onOutgoingList,
      },
    });
  } catch (error) {
    console.error('Error checking meal selection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check meal selection.',
    });
  }
};

export const getMealStatistics = async (req, res) => {
  try {
    const result = await getTodayMealStats();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching meal statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meal statistics.',
    });
  }
};

export const sendDailyMealReport = async () => {
  try {
    const stats = await getTodayMealStats();
    const report = {
      ...stats,
      date: new Date(),
    };

    await sendMealReportEmail(report);

    return { success: true, data: report };
  } catch (error) {
    console.error('Error generating meal report:', error);
    return { success: false, error: error.message };
  }
};
