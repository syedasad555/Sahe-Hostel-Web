import './loadEnv.js';
import { Sequelize } from 'sequelize';

function buildMysqlConfig() {
  const url = String(process.env.DATABASE_URL || process.env.MYSQL_URI || '').trim();
  if (url) {
    return { url, dialect: 'mysql' };
  }

  return {
    dialect: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    database: process.env.MYSQL_DATABASE || 'hostel_management',
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  };
}

const mysqlConfig = buildMysqlConfig();

const sequelizeOptions = {
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
};

export const sequelize = mysqlConfig.url
  ? new Sequelize(mysqlConfig.url, sequelizeOptions)
  : new Sequelize(
      mysqlConfig.database,
      mysqlConfig.username,
      mysqlConfig.password,
      {
        host: mysqlConfig.host,
        port: mysqlConfig.port,
        ...sequelizeOptions,
      }
    );

export function getMysqlLabel() {
  if (mysqlConfig.url) return 'MySQL (DATABASE_URL)';
  return `MySQL ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`;
}
