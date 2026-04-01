import { Router } from "express";
import * as VisitRepo from "./repositories.js";
const router = Router();
router.get("/", VisitRepo.GET);
router.post("/", VisitRepo.POST);
router.put("/", VisitRepo.PUT);
router.delete("/", VisitRepo.DELETE);
router.patch("/", VisitRepo.PATCH);
export default router;
