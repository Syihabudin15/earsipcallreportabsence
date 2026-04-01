import { Router } from "express";
import * as VisitStatusRepo from "./repositories.js";
const router = Router();
router.get("/", VisitStatusRepo.GET);
router.post("/", VisitStatusRepo.POST);
router.put("/", VisitStatusRepo.PUT);
router.delete("/", VisitStatusRepo.DELETE);
export default router;
