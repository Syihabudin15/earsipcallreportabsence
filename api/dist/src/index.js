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
app.use("/file", middleware, fileRoute);
// EARSIP
app.use("/sub_type", middleware, subTypeRoute);
app.use("/producttype", middleware, productTypeRoute);
app.use("/product", middleware, productRoute);
app.use("/submission", middleware, submissionRoute);
// CALLREPORT
// ABSENSI
const PORT = process.env.APP_PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server ready at port: ${PORT}`);
});
