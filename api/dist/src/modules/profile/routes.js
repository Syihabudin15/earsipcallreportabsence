import { Router } from "express";
import * as UserRepo from "./repositories.js";
const router = Router();
router.post("/", UserRepo.POST);
router.put("/", UserRepo.UPDATE_FACE);
export default router;
