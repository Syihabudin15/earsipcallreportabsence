import { Router } from "express";
import * as AbsenceConfigRepo from "./repositories.js";
const router = Router();
router.get("/", AbsenceConfigRepo.GET);
router.put("/", AbsenceConfigRepo.PUT);
export default router;
