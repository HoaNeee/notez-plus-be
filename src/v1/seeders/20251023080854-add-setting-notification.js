"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await queryInterface.bulkInsert(
      "notification_settings",
      [
        {
          id: 1,
          setting_id: 1,
          is_activity: false,
          is_email: false,
          is_page_update: false,
          is_workspace: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          setting_id: 2,
          is_activity: false,
          is_email: false,
          is_page_update: false,
          is_workspace: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("notification_settings", null, {});
  },
};
