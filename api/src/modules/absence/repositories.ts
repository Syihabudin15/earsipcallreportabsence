import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, date } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: any = {
      status: true,
      ...(date && {
        check_in: {
          gte: moment(date as string)
            .startOf("day")
            .toDate(),
          lte: moment(date as string)
            .endOf("day")
            .toDate(),
        },
      }),
      ...(search && {
        OR: [
          { method: { contains: search as string } },
          { absence_status: { contains: search as string } },
          { description: { contains: search as string } },
          { User: { fullname: { contains: search as string } } },
          { User: { nik: { contains: search as string } } },
          { User: { email: { contains: search as string } } },
          { User: { phone: { contains: search as string } } },
        ],
      }),
    };

    const data = await prisma.absence.findMany({
      where,
      skip,
      take: limit,
      orderBy: { check_in: "desc" },
      include: { User: true, PermitAbsence: true },
    });

    const total = await prisma.absence.count({ where });
    return ResponseServer(res, 200, {
      msg: "GET /absence",
      page,
      limit,
      search,
      date,
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

export const POST = async (req: Request, res: Response, next: NextFunction) => {
  let body = req.body;
  try {
    const { id, ...saved } = body;
    await prisma.absence.create({
      data: { ...saved, check_in: new Date() },
    });
    return ResponseServer(res, 200, { msg: "Data berhasil ditambahkan" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const PUT = async (req: Request, res: Response, next: NextFunction) => {
  let { id } = req.query;
  let body = req.body;

  try {
    if (!id)
      return ResponseServer(res, 404, {
        msg: "ID Not found",
        params: req.params,
      });
    const find = await prisma.absence.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.absence.update({
      where: { id: find.id },
      data: {
        ...body,
        updated_at: new Date(),
      },
    });

    return ResponseServer(res, 200, { msg: "Data berhasil dirubah" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const DELETE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let { id } = req.query;

  try {
    if (!id) return ResponseServer(res, 404, { msg: "Not found data" });
    const find = await prisma.absence.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.$transaction(async (tx) => {
      await tx.permitAbsence.deleteMany({ where: { absenceId: find.id } });
      await tx.absence.delete({ where: { id: find.id } });
    });

    return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const SELF_ATTEND = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { method } = req.body;
  const userId = (req as any).user?.id; // Assuming user is set by auth middleware

  if (!userId) {
    return ResponseServer(res, 401, { msg: "Unauthorized" });
  }

  try {
    // Check if already attended today
    const today = moment().startOf("day").toDate();
    const tomorrow = moment().endOf("day").toDate();

    const existingAbsence = await prisma.absence.findFirst({
      where: {
        userId,
        check_in: {
          gte: today,
          lte: tomorrow,
        },
      },
    });

    if (existingAbsence) {
      return ResponseServer(res, 400, { msg: "Sudah absen hari ini" });
    }

    // Create absence
    await prisma.absence.create({
      data: {
        method,
        check_in: new Date(),
        userId,
        absence_status: "HADIR",
      },
    });

    return ResponseServer(res, 200, { msg: "Absen berhasil" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const REPORT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { type, month, year, userId } = req.query; // type: 'daily' or 'monthly'

  try {
    let startDate, endDate;

    if (type === "monthly") {
      startDate = moment(`${year}-${month}-01`).startOf("month").toDate();
      endDate = moment(`${year}-${month}-01`).endOf("month").toDate();
    } else {
      // Daily report for current month
      startDate = moment().startOf("month").toDate();
      endDate = moment().endOf("month").toDate();
    }

    const absences = await prisma.absence.findMany({
      where: {
        status: true,
        check_in: {
          gte: startDate,
          lte: endDate,
        },
        ...(userId && { userId: userId as string }),
      },
      include: { User: true },
      orderBy: { check_in: "asc" },
    });

    // Group by user and calculate summary
    const report = absences.reduce((acc: any, absence) => {
      const userId = absence.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: absence.User,
          totalDays: 0,
          presentDays: 0,
          lateDays: 0,
          absentDays: 0,
          details: [],
        };
      }

      acc[userId].totalDays += 1;
      if (absence.absence_status === "HADIR") {
        acc[userId].presentDays += 1;
      } else if (absence.absence_status === "TERLAMBAT") {
        acc[userId].lateDays += 1;
      } else {
        acc[userId].absentDays += 1;
      }

      acc[userId].details.push(absence);
      return acc;
    }, {});

    return ResponseServer(res, 200, {
      msg: "Report absensi",
      type,
      month,
      year,
      data: Object.values(report),
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
