'use strict';

require('dotenv').config();

const databaseUrlVariable = process.env.DATABASE_URL
  ? 'DATABASE_URL'
  : process.env.MYSQL_URL
    ? 'MYSQL_URL'
    : undefined;

const databaseConfig = {
  username: process.env.DB_USERNAME || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
  ...(databaseUrlVariable ? { use_env_variable: databaseUrlVariable } : {}),
};

module.exports = {
  development: {
    ...databaseConfig,
    host: databaseConfig.host || 'localhost',
  },
  test: {
    ...databaseConfig,
    host: databaseConfig.host || 'localhost',
  },
  production: {
    ...databaseConfig,
  },
};