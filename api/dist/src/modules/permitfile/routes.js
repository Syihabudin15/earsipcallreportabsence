import { Router } from "express";
import * as submissionRepo from "./repositories.js";
const router = Router();
router.get("/", submissionRepo.GET);
router.post("/", submissionRepo.POST);
router.put("/", submissionRepo.PUT);
router.delete("/", submissionRepo.DELETE);
router.patch("/", submissionRepo.PATCH);
export default router;
