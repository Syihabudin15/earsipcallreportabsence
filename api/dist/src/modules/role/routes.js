import { Router } from "express";
import * as RoleRepo from "./repositories.js";
const router = Router();
router.get("/", RoleRepo.GET);
router.post("/", RoleRepo.POST);
router.put("/", RoleRepo.PUT);
router.delete("/", RoleRepo.DELETE);
export default router;
