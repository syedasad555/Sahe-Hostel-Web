import cron from 'node-cron';
import { sendDailyMealReport } from '../controllers/mealController.js';

/**
 * Embedded meal-report scheduler.
 * Run only ONE application replica while this is enabled — multiple replicas
 * would send duplicate report emails on the same cron schedule.
 */
const scheduleMealReportEmails = () => {
  const runReport = async (label) => {
    try {
      console.log(`Running ${label} meal report...`);
      const result = await sendDailyMealReport();
      if (!result.success) {
        console.error(`${label} meal report failed:`, result.error);
      }
    } catch (error) {
      console.error(`Error sending ${label} meal report:`, error.message);
    }
  };

  cron.schedule(
    '0 18 * * 2',
    () => {
      void runReport('Tuesday');
    },
    { timezone: 'Asia/Kolkata' }
  );

  cron.schedule(
    '0 18 * * 6',
    () => {
      void runReport('Saturday');
    },
    { timezone: 'Asia/Kolkata' }
  );

  console.log('Meal report scheduler initialized (single-replica only)');
};

export default scheduleMealReportEmails;
