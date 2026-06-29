import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [downloads, deletes, absences] = await Promise.all([
      prisma.permitFile.count({
        where: { action: "download", permit_status: "PENDING", status: true },
      }),
      prisma.permitFile.count({
        where: { action: "delete", permit_status: "PENDING", status: true },
      }),
      prisma.permitAbsence.count({
        where: { permit_status: "PENDING", status: true },
      }),
    ]);
    return ResponseServer(res, 200, {
      msg: "GET /visit-status",
      downloads,
      deletes,
      absences,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
