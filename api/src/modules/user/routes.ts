import { Router } from "express";
import * as UserRepo from "./repositories.js";

const router = Router();

router.get("/", UserRepo.GET);
router.post("/", UserRepo.POST);
router.put("/", UserRepo.PUT);
router.put("/face", UserRepo.UPDATE_FACE);
router.delete("/", UserRepo.DELETE);
router.patch("/", UserRepo.PATCH);

export default router;
