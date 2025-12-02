import { MyRequest } from "../middlewares/auth.middleware";
import { Response } from "express";
import { EditorSetting, NotificationSetting, Setting } from "../models";
import ApiError from "../../../utils/api-error";

export const getSettingOfUser = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;

	const setting = await Setting.findOne({ where: { user_id } });

	if (!setting) {
		//handle create default setting later
		throw new ApiError(404, "Setting of user not found");
	}

	const [editorSetting, notificationSetting] = await Promise.all([
		EditorSetting.findOne({
			where: { setting_id: setting.id },
		}),
		NotificationSetting.findOne({
			where: { setting_id: setting.id },
		}),
	]);

	res.status(200).json({
		success: true,
		message: "Get setting successful",
		data: {
			editorSetting,
			notificationSetting,
		},
	});
};
export const updateSettingOfUser = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;

	const setting = await Setting.findOne({ where: { user_id } });
	const action = req.params.action;
	const body = req.body;

	if (!setting) {
		throw new ApiError(404, "Setting of user not found");
	}

	if (action === "editor") {
		await EditorSetting.update(body, { where: { setting_id: setting.id } });
	}

	if (action === "notification") {
		await NotificationSetting.update(body, {
			where: { setting_id: setting.id },
		});
	}

	res.status(200).json({
		success: true,
		message: "Update setting successful",
	});
};
