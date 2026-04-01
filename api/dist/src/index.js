import "dotenv/config";
import cors from "cors";
import { middleware } from "./middlewares/middleware.js";
import express from "express";
import roleRoute from "./modules/role/routes.js";
import posRoute from "./modules/position/routes.js";
import userRoute from "./modules/user/routes.js";
import authRoute from "./modules/auth/routes.js";
import subTypeRoute from "./modules/sub_type/routes.js";
import productTypeRoute from "./modules/product_type/routes.js";
import productRoute from "./modules/product/routes.js";
import submissionRoute from "./modules/submission/routes.js";
import visitCategoryRoute from "./modules/visit_category/routes.js";
import visitStatusRoute from "./modules/visit_status/routes.js";
import visitPurposeRoute from "./modules/visit_purpose/routes.js";
import visitRoute from "./modules/visit/routes.js";
import debiturRoute from "./modules/debitur/routes.js";
import absConfigRoute from "./modules/absence_config/routes.js";
import absenceRoute from "./modules/absence_config/routes.js";
import fileRoute from "./modules/file/routes.js";
const app = express();
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
}));
// ROOT APP
app.use(express.json());
app.use("/auth", authRoute);
app.use("/role", middleware, roleRoute);
app.use("/position", middleware, posRoute);
app.use("/user", middleware, userRoute);
app.use("/debitur", middleware, debiturRoute);
app.use("/file", middleware, fileRoute);
// EARSIP
app.use("/sub_type", middleware, subTypeRoute);
app.use("/producttype", middleware, productTypeRoute);
app.use("/product", middleware, productRoute);
app.use("/submission", middleware, submissionRoute);
// CALLREPORT
app.use("/visit_category", middleware, visitCategoryRoute);
app.use("/visit_status", middleware, visitStatusRoute);
app.use("/visit_purpose", middleware, visitPurposeRoute);
app.use("/visit", middleware, visitRoute);
// ABSENSI
app.use("/absence_config", middleware, absConfigRoute);
app.use("/absence", middleware, absenceRoute);
const PORT = process.env.APP_PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server ready at port: ${PORT}`);
});
