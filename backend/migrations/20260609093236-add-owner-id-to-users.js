'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'owner_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users', 
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'owner_id');
  }
};
