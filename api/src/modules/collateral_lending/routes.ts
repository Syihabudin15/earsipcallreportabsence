import { Router } from "express";
import * as collateralRepo from "./repositories.js";

const router = Router();

router.get("/", collateralRepo.GET);
router.post("/", collateralRepo.POST);
router.put("/", collateralRepo.PUT);
router.delete("/", collateralRepo.DELETE);
router.patch("/", collateralRepo.PATCH);

export default router;
