import { Router } from "express";
import * as PositionRepo from "./repositories.js";
const router = Router();
router.get("/", PositionRepo.GET);
router.post("/", PositionRepo.POST);
router.put("/", PositionRepo.PUT);
router.delete("/", PositionRepo.DELETE);
export default router;
