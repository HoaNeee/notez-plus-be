import { Request, Response, NextFunction } from "express";

export interface MyRequest extends Request {
	user_id: number;
	root_folder_id: number;
}

export const isAccess = (req: MyRequest, res: Response, next: NextFunction) => {
	req.user_id = 1;
	req.root_folder_id = 1;
	next();
};
