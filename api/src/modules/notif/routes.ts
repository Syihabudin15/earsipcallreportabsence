import { Router } from "express";
import * as notifRepo from "./repositories.js";

const router = Router();

router.get("/", notifRepo.GET);

export default router;
