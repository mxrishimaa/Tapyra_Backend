'use strict';

module.exports = (sequelize, DataTypes) => {
  const AlertaFogo = sequelize.define(
    'AlertaFogo',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      regiao_id: { type: DataTypes.INTEGER, allowNull: false },
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
      gravidade: { type: DataTypes.ENUM('atencao', 'alerta', 'critico'), allowNull: false },
      qtd_focos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      distancia_km: { type: DataTypes.DECIMAL(6, 1), allowNull: true },
      fonte: { type: DataTypes.STRING(150), allowNull: true },
      data_deteccao: { type: DataTypes.DATE, allowNull: false },
      status: { type: DataTypes.ENUM('ativo', 'encerrado'), allowNull: false, defaultValue: 'ativo' },
      criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'alerta_fogo', timestamps: false }
  );

  AlertaFogo.associate = (models) => {
    AlertaFogo.belongsTo(models.Regiao, { foreignKey: 'regiao_id', as: 'regiao' });
    AlertaFogo.hasMany(models.Notificacao, { foreignKey: 'alerta_fogo_id', as: 'notificacoes' });
  };

  return AlertaFogo;
};
