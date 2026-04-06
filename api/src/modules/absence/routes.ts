import { Router } from "express";
import * as AbsenceRepo from "./repositories.js";

const router = Router();

router.get("/", AbsenceRepo.GET);
router.post("/", AbsenceRepo.POST);
router.put("/", AbsenceRepo.PUT);
router.delete("/", AbsenceRepo.DELETE);
router.post("/self", AbsenceRepo.SELF_ATTEND);
router.get("/report", AbsenceRepo.REPORT);

export default router;
