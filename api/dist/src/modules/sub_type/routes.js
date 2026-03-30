import { Router } from "express";
import * as SubmissionTypeRepo from "./repositories.js";
const router = Router();
router.get("/", SubmissionTypeRepo.GET);
router.post("/", SubmissionTypeRepo.POST);
router.put("/", SubmissionTypeRepo.PUT);
router.delete("/", SubmissionTypeRepo.DELETE);
export default router;
