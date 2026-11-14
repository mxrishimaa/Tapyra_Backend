'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuario', 'whatsapp_opt_  in,', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('usuario', 'whatsapp_opt_in_em', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('usuario', 'whatsapp_opt_in_em');
    await queryInterface.removeColumn('usuario', 'whatsapp_opt_in');
  }
};