import { Response } from "express";
import { MyRequest } from "../middlewares/auth.middleware";
import { sequelize } from "../models";
import { QueryTypes } from "sequelize";

function clearString(input: string): string {
	const newInput = input
		.trim()
		.normalize("NFD") // Normalize to decompose combined characters
		.replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
		.replace(/đ/g, "d") // Replace specific characters
		.replace(/\s+/g, " ") // Replace multiple spaces with a single space
		.toLowerCase(); // Convert to lowercase

	return newInput;
}

export const search = async (req: MyRequest, res: Response) => {
	const query = req.query.query as string;
	const workspace_id = Number(req.query.workspace_id || 0);
	const user_id = req.user_id;

	const cleanedQuery = clearString(query);

	const notes = await sequelize.query(
		`
    SELECT n.id,n.title,n.slug,n.createdAt,n.updatedAt,n.folder_id,n.user_id FROM notes n
    JOIN folders f ON n.folder_id = f.id
    JOIN workspaces w ON f.workspace_id = w.id
    WHERE (n.user_id = :user_id OR f.is_in_teamspace) AND w.id = :workspace_id AND LOWER(
      (TRIM(n.title))
    ) LIKE :searchQuery
    `,
		{
			replacements: { searchQuery: `%${cleanedQuery}%`, workspace_id, user_id },
			type: QueryTypes.SELECT,
		}
	);

	const data = notes;

	res.status(200).json({
		message: "Search success",
		success: true,
		status: 200,
		data: data,
	});
};
