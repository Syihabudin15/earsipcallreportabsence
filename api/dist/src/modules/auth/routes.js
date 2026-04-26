import { Router } from "express";
import * as AuthController from "./repositories.js";
const router = Router();
router.get("/", AuthController.GET);
router.post("/", AuthController.POST);
router.patch("/", AuthController.PATCH);
router.delete("/", AuthController.DELETE);
export default router;
