import { Router } from "express";
import * as DebiturRepo from "./repositories.js";

const router = Router();

router.get("/", DebiturRepo.GET);
router.post("/", DebiturRepo.POST);
router.put("/", DebiturRepo.PUT);
router.delete("/", DebiturRepo.DELETE);
router.patch("/", DebiturRepo.PATCH);

export default router;
