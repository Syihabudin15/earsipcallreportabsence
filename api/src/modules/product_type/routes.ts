import { Router } from "express";
import * as ProductTypeRepo from "./repositories.js";

const router = Router();

router.get("/", ProductTypeRepo.GET);
router.post("/", ProductTypeRepo.POST);
router.put("/", ProductTypeRepo.PUT);
router.delete("/", ProductTypeRepo.DELETE);
router.patch("/", ProductTypeRepo.PATCH);

export default router;
