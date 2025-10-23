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
      "editor_settings",
      [
        {
          id: 1,
          setting_id: 1,
          is_auto_save: true,
          fontStyle: "Tahoma",
          tabSize: "4",
          is_code_highlighting: true,
          is_auto_wrap_code: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          setting_id: 2,
          is_auto_save: true,
          fontStyle: "Tahoma",
          tabSize: "4",
          is_code_highlighting: true,
          is_auto_wrap_code: false,
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
    await queryInterface.bulkDelete("editor_settings", null, {});
  },
};
