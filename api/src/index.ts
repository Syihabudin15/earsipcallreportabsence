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

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);
app.use(express.json());
app.use("/auth", authRoute);
app.use("/role", middleware, roleRoute);
app.use("/position", middleware, posRoute);
app.use("/user", middleware, userRoute);
app.use("/sub_type", middleware, subTypeRoute);
app.use("/product_type", middleware, productTypeRoute);
app.use("/product", middleware, productRoute);
app.use("/submission", middleware, submissionRoute);

const PORT = process.env.APP_PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at port: ${PORT}`);
});
