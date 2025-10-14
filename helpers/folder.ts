import { Folder } from "../src/v1/models";
import ApiError from "../utils/api-error";

const findExistFolder = async (id: number, user_id: number) => {
	try {
		const exist = await Folder.findByPk(id, {});
		if (!exist) {
			return new ApiError(404, "Folder not found");
		}

		if (exist.user_id !== user_id) {
			return new ApiError(403);
		}
		return exist;
	} catch (error) {
		return new ApiError(500, error.message || "Internal server error");
	}
};

export { findExistFolder };
