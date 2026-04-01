import { Router } from "express";
import * as VisitPurposeRepo from "./repositories.js";
const router = Router();
router.get("/", VisitPurposeRepo.GET);
router.post("/", VisitPurposeRepo.POST);
router.put("/", VisitPurposeRepo.PUT);
router.delete("/", VisitPurposeRepo.DELETE);
export default router;
