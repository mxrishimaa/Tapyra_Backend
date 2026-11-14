'use strict';

module.exports = (sequelize, DataTypes) => {
  const Regiao = sequelize.define(
    'Regiao',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      estado: { type: DataTypes.STRING(50), allowNull: false },
      codigo_estado: { type: DataTypes.STRING(10), allowNull: false },
      nome_regiao: { type: DataTypes.STRING(100), allowNull: false },
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      raio_km: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50 },
    },
    { tableName: 'regiao', timestamps: false }
  );

  Regiao.associate = (models) => {
    Regiao.belongsToMany(models.Usuario, {
      through: models.UsuarioRegiao,
      foreignKey: 'regiao_id',
      otherKey: 'usuario_id',
      as: 'usuarios',
    });
    Regiao.hasMany(models.UsuarioRegiao, { foreignKey: 'regiao_id', as: 'inscricoes' });
    Regiao.hasMany(models.AlertaFogo, { foreignKey: 'regiao_id', as: 'alertas' });
  };

  return Regiao;
};
