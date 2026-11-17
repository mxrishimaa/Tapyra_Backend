'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config')[env];
const db = {};

if (!config) {
  throw new Error(`Configuração de banco inexistente para NODE_ENV="${env}".`);
}

if (!config.use_env_variable) {
  const missingVariables = [
    ['DB_HOST', 'MYSQLHOST', config.host],
    ['DB_USERNAME', 'MYSQLUSER', config.username],
    ['DB_PASSWORD', 'MYSQLPASSWORD', config.password],
    ['DB_NAME', 'MYSQLDATABASE', config.database],
  ]
    .filter(([, , value]) => !value)
    .map(([primary, railway]) => `${primary} (ou ${railway})`);

  if (missingVariables.length > 0) {
    throw new Error(`Variáveis de banco ausentes: ${missingVariables.join(', ')}.`);
  }
}

let sequelize;
if (config.use_env_variable) {
  const connectionUrl = process.env[config.use_env_variable];
  if (!connectionUrl) {
    throw new Error(`A variável ${config.use_env_variable} está vazia.`);
  }
  sequelize = new Sequelize(connectionUrl, config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
