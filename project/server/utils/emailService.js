import { getMailTransporter } from './mailTransport.js';

export const sendMealReportEmail = async (report) => {
  try {
    const { veg, 'non-veg': nonVeg, total, date } = report;
    const reportTo = String(process.env.MEAL_REPORT_EMAIL || process.env.EMAIL_USER || '').trim();
    if (!reportTo) {
      throw new Error('MEAL_REPORT_EMAIL or EMAIL_USER must be set to send meal reports');
    }

    const transporter = await getMailTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: reportTo,
      subject: `Daily Meal Report - ${date.toDateString()}`,
      html: `
        <h2>Daily Meal Selection Report</h2>
        <p>Date: ${date.toDateString()}</p>
        <h3>Meal Selections:</h3>
        <ul>
          <li>Veg Meals: ${veg}</li>
          <li>Non-Veg Meals: ${nonVeg}</li>
          <li><strong>Total Selections:</strong> ${total}</li>
        </ul>
        <p>This is an automated message. Please do not reply.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Meal report email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
