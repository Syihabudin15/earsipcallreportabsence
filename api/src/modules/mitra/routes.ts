import { Router } from "express";
import * as mitraRepo from "./repositories.js";

const router = Router();

router.get("/", mitraRepo.GET);
router.post("/", mitraRepo.POST);
router.put("/", mitraRepo.PUT);
router.delete("/", mitraRepo.DELETE);

export default router;
