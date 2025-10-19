import cors from "cors";
import express from "express";
import router from "./src/v1/routes/index.route";
import dotenv from "dotenv";
import ApiError from "./utils/api-error";
import errorHandler from "./src/v1/middlewares/error-handler";
import { sequelize } from "./src/v1/models";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

sequelize
	.authenticate()
	.then(async () => {
		console.log("Database connected...");
	})
	.catch((err) => {
		console.log("Error connected to database: " + err);
	});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
	cors({
		origin: ["http://localhost:3000"],
		credentials: true,
	})
);

router(app);

app.use((req, res, next) => {
	next(new ApiError(404, "Not Found"));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`server is running at port ${PORT}`);
});
