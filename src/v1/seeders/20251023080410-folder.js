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
      "folders",
      [
        {
          id: 1,
          title: "New Folder",
          user_id: 1,
          parent_id: null,
          workspace_id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: "New Folder",
          user_id: 1,
          parent_id: 1,
          workspace_id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          title: "New Folder",
          user_id: 1,
          parent_id: 1,
          workspace_id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 4,
          title: "Folder A",
          user_id: 1,
          parent_id: 1,
          workspace_id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 5,
          title: "Folder E",
          user_id: 2,
          parent_id: null,
          workspace_id: 3,
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
    await queryInterface.bulkDelete("folders", null, {});
  },
};
