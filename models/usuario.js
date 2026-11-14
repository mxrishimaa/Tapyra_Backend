'use strict';

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: DataTypes.STRING(255), allowNull: false },
      email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      senha: { type: DataTypes.STRING(255), allowNull: false },
      telefone: { type: DataTypes.STRING(20), allowNull: true },
      funcao: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'morador' },
      whatsapp_opt_in: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      whatsapp_opt_in_em: { type: DataTypes.DATE, allowNull: true },
      criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'usuario',
      timestamps: false,
      // por padrão a senha nunca sai do banco; no login use Usuario.scope('comSenha')
      defaultScope: { attributes: { exclude: ['senha'] } },
      scopes: { comSenha: {} },
    }
  );

  Usuario.associate = (models) => {
    Usuario.belongsToMany(models.Regiao, {
      through: models.UsuarioRegiao,
      foreignKey: 'usuario_id',
      otherKey: 'regiao_id',
      as: 'regioes',
    });
    Usuario.hasMany(models.UsuarioRegiao, { foreignKey: 'usuario_id', as: 'inscricoes' });
    Usuario.hasMany(models.Notificacao, { foreignKey: 'usuario_id', as: 'notificacoes' });
  };

  return Usuario;
};
