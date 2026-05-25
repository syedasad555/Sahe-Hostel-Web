import cron from 'node-cron';
import axios from 'axios';

// Schedule tasks to be run on the server
const scheduleMealReportEmails = () => {
  // Schedule for Tuesday at 11:00 PM
  cron.schedule('0 23 * * 2', async () => {
    try {
      console.log('Running Tuesday night meal report...');
      await axios.post('http://localhost:5000/api/meals/send-report');
    } catch (error) {
      console.error('Error sending Tuesday meal report:', error.message);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  // Schedule for Wednesday at 11:00 AM
  cron.schedule('0 11 * * 3', async () => {
    try {
      console.log('Running Wednesday morning meal report...');
      await axios.post('http://localhost:5000/api/meals/send-report');
    } catch (error) {
      console.error('Error sending Wednesday meal report:', error.message);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('Meal report scheduler initialized');
};

export default scheduleMealReportEmails;
