'use strict';

require('dotenv').config();

module.exports = {
  development: {
     username: process.env.DB_USERNAME='joao',
        password: process.env.DB_PASSWORD='JPVale120!',
        database: process.env.DB_NAME='tapyradevdb',
        host: process.env.DB_HOST='localhost',
        port: process.env.DB_PORT='3306',
        dialect: process.env.DB_DIALECT='mysql'
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
  },
};