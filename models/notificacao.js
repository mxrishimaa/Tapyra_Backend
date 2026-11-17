'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notificacao = sequelize.define(
    'Notificacao',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuario_id: { type: DataTypes.INTEGER, allowNull: false },
      alerta_fogo_id: { type: DataTypes.INTEGER, allowNull: true },
      canal: {
        type: DataTypes.ENUM('whatsapp', 'telegram', 'sms', 'email'),
        allowNull: false,
        defaultValue: 'whatsapp',
      },
      status: {
        type: DataTypes.ENUM('pendente', 'enviada', 'entregue', 'lida', 'falhou'),
        allowNull: false,
        defaultValue: 'pendente',
      },
      data_envio: { type: DataTypes.DATE, allowNull: true },
      wa_message_id: { type: DataTypes.STRING(120), allowNull: true },
      erro: { type: DataTypes.STRING(300), allowNull: true },
    },
    { tableName: 'notificacao', timestamps: false }
  );

  Notificacao.associate = (models) => {
    Notificacao.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Notificacao.belongsTo(models.AlertaFogo, { foreignKey: 'alerta_fogo_id', as: 'alerta' });
  };

  return Notificacao;
};
