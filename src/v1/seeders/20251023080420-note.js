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

		const content = `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"The editor is a demo environment.","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}`;

		const content1 = `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"The playground is a demo environment built with ","type":"text","version":1},{"detail":0,"format":16,"mode":"normal","style":"","text":"@lexical/react","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":". Try typing in ","type":"text","version":1},{"detail":0,"format":1,"mode":"normal","style":"","text":"some text","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" with ","type":"text","version":1},{"detail":0,"format":2,"mode":"normal","style":"","text":"different","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" formats.","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Make sure to check out the various plugins in the toolbar. You can also use #hashtags or @-mentions too!","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"color:#383A42","text":"If you","type":"code-highlight","version":1},{"detail":0,"format":0,"mode":"normal","style":"color:#50A14F","text":"'d like to find out more about Lexical, you can:sieuhoad","type":"code-highlight","version":1},{"detail":0,"format":0,"mode":"normal","style":"color:white","text":"z","type":"code-highlight","version":1}],"direction":null,"format":"","indent":0,"type":"code","version":1,"textStyle":"color:#383A42","language":"javascript","theme":"one-light"},{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Visit the ","type":"text","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lexical website","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"link","version":1,"rel":null,"target":null,"title":null,"url":"https://lexical.dev/"},{"detail":0,"format":0,"mode":"normal","style":"","text":" for documentation and more information.","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"listitem","version":1,"value":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Check out the code on our ","type":"text","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"GitHub repository","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"link","version":1,"rel":null,"target":null,"title":null,"url":"https://github.com/facebook/lexical"},{"detail":0,"format":0,"mode":"normal","style":"","text":".","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"listitem","version":1,"value":2},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Playground code can be found ","type":"text","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"here","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"link","version":1,"rel":null,"target":null,"title":null,"url":"https://github.com/facebook/lexical/tree/main/packages/lexical-playground"},{"detail":0,"format":0,"mode":"normal","style":"","text":".","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"listitem","version":1,"value":3},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Join our ","type":"text","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Discord Server","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"link","version":1,"rel":null,"target":null,"title":null,"url":"https://discord.com/invite/KmG4wQnnD9"},{"detail":0,"format":0,"mode":"normal","style":"","text":" and chat with the team.","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"listitem","version":1,"value":4}],"direction":null,"format":"","indent":0,"type":"list","version":1,"listType":"bullet","start":1,"tag":"ul"},{"children":[{"detail":0,"format":1,"mode":"normal","style":"","text":"Lorem Ipsum","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.","type":"text","version":1}],"direction":null,"format":"justify","indent":0,"type":"paragraph","version":1,"textFormat":1,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Why do we use it?","type":"text","version":1}],"direction":null,"format":"left","indent":0,"type":"heading","version":1,"tag":"h2"},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).","type":"text","version":1}],"direction":null,"format":"justify","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lastly, we're constantly adding cool new features to this playground. So make sure you check back here joasjdojoasjdjasodjaosjdajsdojasodjoasjd when you next get a chance","type":"text","version":1},{"type":"image","version":1,"altText":"image","caption":{"editorState":{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"this is the caption","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}},"height":0,"maxWidth":500,"showCaption":true,"src":"https://playground.lexical.dev/assets/yellow-flower-vav9Hsve.jpg","width":0,"status":"success"},{"type":"image","version":1,"altText":"computer.png","caption":{"editorState":{"root":{"children":[],"direction":null,"format":"","indent":0,"type":"root","version":1}}},"height":0,"maxWidth":500,"showCaption":false,"src":"https://images.ctfassets.net/hrltx12pl8hq/28ECAQiPJZ78hxatLTa7Ts/2f695d869736ae3b0de3e56ceaca3958/free-nature-images.jpg?fit=fill&w=1200&h=630","width":0,"status":"success"},{"detail":0,"format":0,"mode":"normal","style":"","text":" asidhioashdiyas8dy","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"jasodjopasdojasopdjopasjdoasldjaopsjdopjasd","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"jasjdopjasiodhioashfiohasdkohaioshdiohaspdo","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"ajsdopjasdopasjdopjasopdjoapsd","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1,"textStyle":"color:#383A42"}}`;

		// const ids = `["ruuvy"]`;
		const ids = `["1"]`;

		const content2 = `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"The playground is a demo environment built with ","type":"text","version":1},{"detail":0,"format":16,"mode":"normal","style":"","text":"@lexical/react","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":". Try typing in ","type":"text","version":1},{"detail":0,"format":1,"mode":"normal","style":"","text":"some text","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" with ","type":"text","version":1},{"detail":0,"format":2,"mode":"normal","style":"","text":"different","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" formats.","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Make sure to check out the various ","type":"text","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"plugins ","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"mark","version":1,"ids":${ids}},{"detail":0,"format":0,"mode":"normal","style":"","text":"in the toolbar. You can also use #hashtags or @-mentions too!","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}`;

		await queryInterface.bulkInsert(
			"notes",
			[
				{
					id: 1,
					title: "Note A",
					user_id: 1,
					folder_id: 1,
					content: content1,
					slug: "Note-A-1",
					status: "public",
					status_permission: "view",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					title: "Note B",
					user_id: 1,
					folder_id: 2,
					content,
					slug: "Note-B-2",
					status: "private",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					title: "Note V",
					user_id: 1,
					folder_id: 1,
					content: content2,
					slug: "Note-V-3",
					status: "private",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 4,
					title: "Note D",
					user_id: 2,
					status: "private",
					folder_id: 5,
					content,
					slug: "Note-D-4",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 5,
					title: "Note E",
					user_id: 3,
					folder_id: 6,
					content,
					slug: "Note-E-5",
					status: "shared",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 6,
					title: "Teamspace Note default A",
					user_id: 2,
					folder_id: 7,
					status: "private",
					content,
					slug: "Teamspace-Note-default-A-6",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 7,
					title: "Getting Started",
					user_id: 1,
					folder_id: 8,
					status: "private",
					content,
					slug: "Getting-Started-7",
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
		await queryInterface.bulkDelete("notes", null, {});
	},
};
