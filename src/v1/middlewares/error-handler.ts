import { Request, Response, NextFunction } from "express";
import ApiError from "../../../utils/api-error";
import dotenv from "dotenv";
dotenv.config();

const errorHandler = async (
	err: ApiError,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const statusCode = err.statusCode || 500;
	const message = err.message || getTypeError(statusCode);
	const isProduction = process.env.NODE_ENV === "production";

	if (!isProduction) {
		console.log(err);
	}

	res.statusMessage = message;
	res.status(statusCode).json({
		success: false,
		status: statusCode,
		message,
		stack: !isProduction ? err.stack : undefined,
	});
};

const getTypeError = (status: number) => {
	switch (status) {
		case 400:
			return "Bad Request";
		case 401:
			return "Unauthorized";
		case 403:
			return "Forbidden";
		case 404:
			return "Not Found";
		default:
			return "Internal Server Error";
	}
};

export default errorHandler;
