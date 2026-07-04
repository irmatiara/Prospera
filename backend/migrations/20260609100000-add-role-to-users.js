'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('Users', 'role', {
        type: Sequelize.ENUM('owner', 'kasir'),
        allowNull: false,
        defaultValue: 'owner'
      });
    } catch (error) {
      if (!error.message.includes("Duplicate column name")) {
        throw error;
      }
      console.log("Kolom 'role' sudah ada, melewati migrasi ini.");
    }
  },

  async down(queryInterface, Sequelize) {
    // Rollback: Hapus kolom 'role' dari tabel Users
    await queryInterface.removeColumn('Users', 'role');
  }
};
