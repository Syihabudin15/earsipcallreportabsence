import { Router } from "express";
import * as ParticipantRepo from "./repositories.js";

const router = Router();

router.get("/", ParticipantRepo.GET);
router.get("/:id", ParticipantRepo.GET_BY_ID);
router.post("/", ParticipantRepo.POST);
router.put("/:id", ParticipantRepo.PUT);
router.delete("/:id", ParticipantRepo.DELETE);

export default router;
