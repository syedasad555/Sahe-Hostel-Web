import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMealReportEmail = async (report) => {
  try {
    const { veg, 'non-veg': nonVeg, total, date } = report;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'saheadmin2025@sahe.ac.in', // Faculty email
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
