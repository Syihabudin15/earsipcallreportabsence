import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, startDate, endDate } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: any = {};

    // Date range filter
    if (startDate && endDate) {
      where.created_at = {
        gte: moment(startDate as string)
          .startOf("day")
          .toDate(),
        lte: moment(endDate as string)
          .endOf("day")
          .toDate(),
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: "insensitive" } },
        { payload: { contains: search as string, mode: "insensitive" } },
        {
          User: {
            fullname: { contains: search as string, mode: "insensitive" },
          },
        },
        {
          User: {
            username: { contains: search as string, mode: "insensitive" },
          },
        },
      ];
    }

    const data = await prisma.logActivities.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: { User: true },
    });

    const total = await prisma.logActivities.count({ where });

    return ResponseServer(res, 200, {
      msg: "GET /log-activities",
      page,
      limit,
      search,
      startDate,
      endDate,
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
