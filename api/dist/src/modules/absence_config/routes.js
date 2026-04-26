import { Router } from "express";
import * as AbsenceConfigRepo from "./repositories.js";
const router = Router();
router.get("/", AbsenceConfigRepo.GET);
router.post("/", AbsenceConfigRepo.POST);
router.put("/", AbsenceConfigRepo.PUT);
router.delete("/", AbsenceConfigRepo.DELETE);
export default router;
