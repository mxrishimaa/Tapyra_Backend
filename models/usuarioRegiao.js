'use strict';

module.exports = (sequelize, DataTypes) => {
  const UsuarioRegiao = sequelize.define(
    'UsuarioRegiao',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuario_id: { type: DataTypes.INTEGER, allowNull: false },
      regiao_id: { type: DataTypes.INTEGER, allowNull: false },
      nivel_minimo: {
        type: DataTypes.ENUM('atencao', 'alerta', 'critico'),
        allowNull: false,
        defaultValue: 'atencao',
      },
      ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'usuario_regiao', timestamps: false }
  );

  UsuarioRegiao.associate = (models) => {
    UsuarioRegiao.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    UsuarioRegiao.belongsTo(models.Regiao, { foreignKey: 'regiao_id', as: 'regiao' });
  };

  return UsuarioRegiao;
};
