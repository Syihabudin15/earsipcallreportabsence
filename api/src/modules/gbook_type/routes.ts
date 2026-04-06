import { Router } from "express";
import * as GBookTypeRepo from "./repositories.js";

const router = Router();

router.get("/", GBookTypeRepo.GET);
router.post("/", GBookTypeRepo.POST);
router.put("/", GBookTypeRepo.PUT);
router.delete("/", GBookTypeRepo.DELETE);

export default router;
