import { Router } from "express";
import * as ProductRepo from "./repositories.js";
const router = Router();
router.get("/", ProductRepo.GET);
router.post("/", ProductRepo.POST);
router.put("/", ProductRepo.PUT);
router.delete("/", ProductRepo.DELETE);
export default router;
