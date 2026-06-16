import { sequelize, getMysqlLabel } from './sequelize.js';

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    const { syncModels } = await import('../models/index.js');
    await syncModels();
    console.log(`Database connected: ${getMysqlLabel()}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

export { sequelize };
