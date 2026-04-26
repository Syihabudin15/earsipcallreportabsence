import { Router } from "express";
import * as GuestBookRepo from "./repositories.js";
const router = Router();
router.get("/", GuestBookRepo.GET);
router.post("/", GuestBookRepo.POST);
router.put("/", GuestBookRepo.PUT);
router.delete("/", GuestBookRepo.DELETE);
export default router;
