import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { Prisma } from "@prisma/client";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, startDate, endDate } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.LogActivitiesWhereInput = {
      ...(startDate &&
        endDate && {
          created_at: {
            gte: moment(startDate as string)
              .startOf("day")
              .toDate(),
            lte: moment(endDate as string)
              .endOf("day")
              .toDate(),
          },
        }),
      ...(search && {
        OR: [
          { method: { contains: search as string } },
          {
            User: {
              OR: [
                { fullname: { contains: search as string } },
                { username: { contains: search as string } },
                { id: { contains: search as string } },
                { nik: { contains: search as string } },
                { nip: { contains: search as string } },
              ],
            },
          },
        ],
      }),
      ...(req.user?.Role.data_status && { userId: req.user.id }),
    };

    const [data, total] = await Promise.all([
      prisma.logActivities.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: { User: true },
      }),
      prisma.logActivities.count({ where }),
    ]);

    return ResponseServer(res, 200, {
      data,
      total,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
