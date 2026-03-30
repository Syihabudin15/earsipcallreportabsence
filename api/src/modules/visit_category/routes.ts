import { Router } from "express";
import * as VisitCategoryRepo from "./repositories.js";

const router = Router();

router.get("/", VisitCategoryRepo.GET);
router.post("/", VisitCategoryRepo.POST);
router.put("/", VisitCategoryRepo.PUT);
router.delete("/", VisitCategoryRepo.DELETE);

export default router;
