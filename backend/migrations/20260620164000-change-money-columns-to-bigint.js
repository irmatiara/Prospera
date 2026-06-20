'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Products
    await queryInterface.changeColumn('Products', 'product_cost', {
      type: Sequelize.BIGINT,
      allowNull: false
    });
    await queryInterface.changeColumn('Products', 'product_price', {
      type: Sequelize.BIGINT,
      allowNull: false
    });

    // Transactions
    await queryInterface.changeColumn('Transactions', 'total_amount', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    });

    // Transaction_details
    await queryInterface.changeColumn('Transaction_details', 'capital_cost', {
      type: Sequelize.BIGINT,
      allowNull: false
    });
    await queryInterface.changeColumn('Transaction_details', 'selling_price', {
      type: Sequelize.BIGINT,
      allowNull: false
    });
    await queryInterface.changeColumn('Transaction_details', 'sub_total', {
      type: Sequelize.BIGINT,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Products
    await queryInterface.changeColumn('Products', 'product_cost', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    await queryInterface.changeColumn('Products', 'product_price', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    // Transactions
    await queryInterface.changeColumn('Transactions', 'total_amount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Transaction_details
    await queryInterface.changeColumn('Transaction_details', 'capital_cost', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    await queryInterface.changeColumn('Transaction_details', 'selling_price', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    await queryInterface.changeColumn('Transaction_details', 'sub_total', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};
