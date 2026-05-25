import express from 'express';
import { 
  isMealSelectionOpen,
  submitMealSelection,
  getMealStatistics,
  sendDailyMealReport,
  checkMealSelection
} from '../controllers/mealController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Check if meal selection is open
router.get('/status', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      isOpen: isMealSelectionOpen() 
    } 
  });
});

// Check if student has already selected a meal
router.get('/check', protect, checkMealSelection);

// Submit meal selection
router.post('/select', protect, submitMealSelection);

// Get meal statistics (protected - faculty only)
router.get('/stats', protect, getMealStatistics);

// Get all meal selections (for debugging - no date filter)
router.get('/all', protect, async (req, res) => {
  try {
    console.log('Fetching ALL meal selections for debugging...');
    const allSelections = await MealSelection.find({}).sort({ date: -1 });
    console.log('Total meal selections found:', allSelections.length);
    console.log('All selections:', allSelections);
    
    res.json({
      success: true,
      count: allSelections.length,
      data: allSelections
    });
  } catch (error) {
    console.error('Error fetching all meal selections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meal selections'
    });
  }
});

// Send daily meal report (for cron job)
router.post('/send-report', async (req, res) => {
  try {
    const result = await sendDailyMealReport();
    if (result.success) {
      res.json({ success: true, message: 'Meal report sent successfully' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending meal report:', error);
    res.status(500).json({ success: false, error: 'Failed to send meal report' });
  }
});

export default router;
