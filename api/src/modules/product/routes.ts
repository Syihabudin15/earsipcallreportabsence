import { Router } from "express";
import * as productRepo from "./repositories.js";

const router = Router();

router.get("/", productRepo.GET);
router.post("/", productRepo.POST);
router.put("/", productRepo.PUT);
router.delete("/", productRepo.DELETE);

export default router;
