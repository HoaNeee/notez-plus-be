import cloudinary from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";
import ApiError from "../utils/api-error";

dotenv.config();

// config cloud
cloudinary.v2.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});
//End config cloud

let streamUpload = async (buffer: any) => {
	return new Promise((resolve, reject) => {
		let stream = cloudinary.v2.uploader.upload_stream(
			{
				folder: "learn-node/dashboard",
			},
			(error, result) => {
				if (result) {
					resolve(result);
				} else {
					reject(error);
				}
			}
		);
		streamifier.createReadStream(buffer).pipe(stream);
	});
};

export const uploadCloud = async (buffer: any) => {
	try {
		let result = await streamUpload(buffer);
		return result as cloudinary.UploadApiResponse;
	} catch (error) {
		return new ApiError(500, "Upload image error");
	}
};
