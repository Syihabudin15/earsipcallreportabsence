import { Router } from "express";
import * as RoleController from "./repositories.js";
const router = Router();
router.get("/", RoleController.GET);
router.post("/", RoleController.POST);
router.put("/", RoleController.PUT);
router.delete("/", RoleController.DELETE);
export default router;
