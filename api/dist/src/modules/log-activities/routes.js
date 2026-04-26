import { Router } from "express";
import * as LogController from "./repositories.js";
const router = Router();
router.get("/", LogController.GET);
export default router;
