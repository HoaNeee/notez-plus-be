import { Request, Response } from "express";
import { uploadCloud } from "../../../helpers/uploadCloud";
import ApiError from "../../../utils/api-error";

// [POST] /upload
export const upload = async (req: Request, res: Response) => {
	try {
		const { buffer } = req.file;
		const result = await uploadCloud(buffer);

		if (result instanceof ApiError) {
			throw result;
		}

		res.status(200).json({
			code: 200,
			message: "Upload image successfully",
			data: result.secure_url,
			success: true,
		});
	} catch (error) {
		const status = error.status || 500;
		const message = error.message || "Internal Server Error";

		res.statusMessage = message;

		res.status(status).json({
			code: status,
			message: message,
			success: false,
		});
	}
};

// [POST] /upload/multi
export const uploads = async (req: Request, res: Response) => {
	try {
		const files = req.files;

		const length = files.length;
		const arr = [];
		for (let i = 0; i < Number(length); i++) {
			arr.push(files[i]);
		}

		const response = await Promise.all(
			arr.map(async (file) => {
				return await uploadCloud(file.buffer);
			})
		);

		const isError = response.some((item) => item instanceof ApiError);

		if (isError) {
			throw new ApiError(500, "Upload image error");
		}

		const data = response.map(
			(file) => !(file instanceof ApiError) && file.secure_url
		);

		res.json({
			success: true,
			code: 200,
			message: "OK",
			data: data,
		});
	} catch (error) {
		res.json({
			success: false,
			code: 500,
			message: error.message,
		});
	}
};
