import { Router } from "express";
import * as AuthController from "./repositories.js";
const router = Router();
router.get("/", AuthController.GET);
router.post("/", AuthController.POST);
export default router;
