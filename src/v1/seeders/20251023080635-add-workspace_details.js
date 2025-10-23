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
      "workspace_details",
      [
        {
          id: 1,
          workspace_id: 1,
          member_id: 1,
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          workspace_id: 2,
          member_id: 1,
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          workspace_id: 3,
          member_id: 2,
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 4,
          workspace_id: 3,
          member_id: 1,
          role: "member",
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
    await queryInterface.bulkDelete("workspace_details", null, {});
  },
};
