import cron from 'node-cron';
import axios from 'axios';

// Schedule tasks to be run on the server
const scheduleMealReportEmails = () => {
  // After Tuesday selection window closes (6:00 PM IST)
  cron.schedule('0 18 * * 2', async () => {
    try {
      console.log('Running Tuesday meal report...');
      await axios.post('http://localhost:5000/api/meals/send-report');
    } catch (error) {
      console.error('Error sending Tuesday meal report:', error.message);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  // After Saturday selection window closes (6:00 PM IST)
  cron.schedule('0 18 * * 6', async () => {
    try {
      console.log('Running Saturday meal report...');
      await axios.post('http://localhost:5000/api/meals/send-report');
    } catch (error) {
      console.error('Error sending Saturday meal report:', error.message);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('Meal report scheduler initialized');
};

export default scheduleMealReportEmails;
