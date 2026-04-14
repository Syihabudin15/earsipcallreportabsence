import { Router } from "express";
import * as PayrollRepo from "./repositories.js";

const router = Router();

router.get("/", PayrollRepo.GET);
router.get("/:id", PayrollRepo.GET_DETAIL);
router.post("/calculate", PayrollRepo.CALCULATE);
router.post("/bulk-generate", PayrollRepo.GENERATE_BULK);
router.put("/:id/approve", PayrollRepo.APPROVE);
router.delete("/:id/reject", PayrollRepo.REJECT);

export default router;
