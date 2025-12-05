import { Response } from "express";
import { MyRequest } from "../middlewares/auth.middleware";
import { sequelize } from "../models";
import { QueryTypes } from "sequelize";
import { NoteModel } from "../models/note";

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

type TSort =
  | "best-matches"
  | "last-edited-newest"
  | "created-newest"
  | "created-oldest"
  | "last-edited-oldest";

export const search = async (req: MyRequest, res: Response) => {
  const query = req.query.query as string;
  const workspace_id = Number(req.query.workspace_id || 0);
  const user_id = req.user_id;

  const sort = req.query.sort as TSort | undefined;
  const created_by = req.query.created_by as string | undefined;
  const folders = req.query.folders as string | undefined;

  const cleanedQuery = clearString(query);

  if (!cleanedQuery && sort === "best-matches" && !created_by && !folders) {
    let extract_ids = [];

    const query_date = `
		SELECT n.id,n.title,n.slug,n.user_id,n.folder_id,n.createdAt,n.updatedAt FROM notes n
		JOIN note_logs nl ON nl.note_id = n.id
		JOIN folders f ON f.id = n.folder_id
		WHERE DATEDIFF(CURDATE(), nl.createdAt) = :day 
		AND f.workspace_id = :workspace_id 
		AND (n.user_id = :user_id OR f.is_in_teamspace IS TRUE) 
		AND n.deleted IS FALSE
		AND n.id NOT IN (:extract_ids)
		GROUP BY n.id, n.title, n.user_id, n.folder_id
	`;

    const notes_today = (await sequelize.query(query_date, {
      replacements: {
        workspace_id,
        user_id,
        day: 0,
        extract_ids: extract_ids.join(","),
      },
      type: QueryTypes.SELECT,
    })) as NoteModel[];

    extract_ids = Array.from(
      new Set(extract_ids.concat(notes_today.map((note: NoteModel) => note.id)))
    );

    const notes_yesterday = (await sequelize.query(query_date, {
      replacements: {
        workspace_id,
        user_id,
        day: 1,
        extract_ids: extract_ids.join(","),
      },
      type: QueryTypes.SELECT,
    })) as NoteModel[];

    extract_ids = Array.from(
      new Set(
        extract_ids.concat(notes_yesterday.map((note: NoteModel) => note.id))
      )
    );

    const notes_last_week = (await sequelize.query(query_date, {
      replacements: {
        workspace_id,
        user_id,
        day: 7,
        extract_ids: extract_ids.join(","),
      },
      type: QueryTypes.SELECT,
    })) as NoteModel[];

    extract_ids = Array.from(
      new Set(
        extract_ids.concat(notes_last_week.map((note: NoteModel) => note.id))
      )
    );

    const notes_last_month = (await sequelize.query(query_date, {
      replacements: {
        workspace_id,
        user_id,
        day: 30,
        extract_ids: extract_ids.join(","),
      },
      type: QueryTypes.SELECT,
    })) as NoteModel[];

    res.status(200).json({
      message: "Search success",
      success: true,
      status: 200,
      data: [
        {
          label: "Today",
          notes: notes_today,
        },
        {
          label: "Yesterday",
          notes: notes_yesterday,
        },
        {
          label: "Last 7 Days",
          notes: notes_last_week,
        },
        {
          label: "Last 30 Days",
          notes: notes_last_month,
        },
      ],
    });
    return;
  }

  let sortClause = "n.updatedAt DESC"; // Default sort
  if (sort === "created-newest") {
    sortClause = "n.createdAt DESC";
  }
  if (sort === "created-oldest") {
    sortClause = "n.createdAt ASC";
  }
  if (sort === "last-edited-oldest") {
    sortClause = "n.updatedAt ASC";
  }

  const notes = await sequelize.query(
    `
    SELECT n.id,n.title,n.slug,n.createdAt,n.updatedAt,n.folder_id,n.user_id FROM notes n
    JOIN folders f ON n.folder_id = f.id
    JOIN workspaces w ON f.workspace_id = w.id
    WHERE (n.user_id = :user_id OR f.is_in_teamspace) AND w.id = :workspace_id AND LOWER(
      (TRIM(n.title))
    ) LIKE :searchQuery
		AND n.deleted IS FALSE
		${created_by ? "AND n.user_id IN (:created_by)" : ""}
		${folders ? "AND n.folder_id IN (:folders)" : ""}
		ORDER BY ${sortClause}
    `,
    {
      replacements: {
        searchQuery: `%${cleanedQuery}%`,
        workspace_id,
        user_id,
        created_by: created_by,
        folders: folders,
      },
      type: QueryTypes.SELECT,
    }
  );

  const data = notes;

  res.status(200).json({
    message: "Search success",
    success: true,
    status: 200,
    data: [
      {
        label: "Best Matches",
        notes: data,
      },
    ],
  });
};
