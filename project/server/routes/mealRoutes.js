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
