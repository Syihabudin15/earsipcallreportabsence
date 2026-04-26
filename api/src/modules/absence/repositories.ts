import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { Prisma } from "@prisma/client";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, date } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.AbsenceWhereInput = {
      ...(date && {
        check_in: {
          gte: moment(date as string)
            .startOf("day")
            .toDate(),
          lte: moment(date as string)
            .endOf("day")
            .toDate(),
        },
        ...(req.user?.Role.data_status === "USER" && { userId: req.user.id }),
      }),
      ...(search && {
        OR: [
          { method: { contains: search as string } },
          {
            User: {
              OR: [
                { fullname: { contains: search as string } },
                { id: { contains: search as string } },
                { nik: { contains: search as string } },
                { nip: { contains: search as string } },
                { email: { contains: search as string } },
                { phone: { contains: search as string } },
              ],
            },
          },
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
    const { id, User, ...saved } = body;
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

export const SELF_TODAY = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    return ResponseServer(res, 401, { msg: "Unauthorized" });
  }

  try {
    const today = moment().startOf("day").toDate();
    const tomorrow = moment().endOf("day").toDate();

    // Get user with absen_method
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullname: true,
        absen_method: true,
      },
    });

    // Get today's attendance
    const todayAbsence = await prisma.absence.findFirst({
      where: {
        userId,
        check_in: {
          gte: today,
          lte: tomorrow,
        },
      },
    });

    return ResponseServer(res, 200, {
      data: {
        user,
        attendance: todayAbsence,
        checked_in: !!todayAbsence,
        checked_out: !!todayAbsence?.check_out,
      },
    });
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
  const { method, type = "CHECK_IN", lat, long } = req.body; // type: CHECK_IN or CHECK_OUT
  const userId = (req as any).user?.id; // Assuming user is set by auth middleware

  if (!userId) {
    return ResponseServer(res, 401, { msg: "Unauthorized" });
  }

  try {
    // Get absence config for geolocation validation
    const config = await prisma.absenceConfig.findFirst();

    // Validate geolocation if config requires it
    if (config?.geo_location && config?.meter_tolerance) {
      if (!lat || !long) {
        return ResponseServer(res, 400, {
          msg: "Lokasi diperlukan untuk absensi di tempat ini",
        });
      }

      const [configLat, configLong] = config.geo_location
        .split(",")
        .map(Number);
      const distance = calculateDistance(lat, long, configLat, configLong);

      if (distance > config.meter_tolerance) {
        return ResponseServer(res, 400, {
          msg: `Anda berada di luar zona absensi. Jarak: ${Math.round(distance)}m, Toleransi: ${config.meter_tolerance}m`,
          distance,
          tolerance: config.meter_tolerance,
        });
      }
    }

    // Get today's date range
    const today = moment().startOf("day").toDate();
    const tomorrow = moment().endOf("day").toDate();

    // Check if user has attendance record today
    let todayAbsence = await prisma.absence.findFirst({
      where: {
        userId,
        check_in: {
          gte: today,
          lte: tomorrow,
        },
      },
    });

    if (type === "CHECK_IN") {
      // Check-In: Create new record if not exists
      if (todayAbsence) {
        return ResponseServer(res, 400, {
          msg: "Sudah check-in hari ini",
          data: todayAbsence,
        });
      }

      const newAbsence = await prisma.absence.create({
        data: {
          method,
          check_in: new Date(),
          geo_in_lat: lat || null,
          geo_in_long: long || null,
          geo_in: lat && long ? `${lat},${long}` : null,
          userId,
          absence_status: "HADIR",
        },
      });

      return ResponseServer(res, 200, {
        msg: "Check-in berhasil",
        data: newAbsence,
      });
    } else if (type === "CHECK_OUT") {
      // Check-Out: Update existing record
      if (!todayAbsence) {
        return ResponseServer(res, 400, {
          msg: "Belum check-in hari ini",
        });
      }

      const updatedAbsence = await prisma.absence.update({
        where: { id: todayAbsence.id },
        data: {
          check_out: new Date(),
          geo_out_lat: lat || null,
          geo_out_long: long || null,
          geo_out: lat && long ? `${lat},${long}` : null,
        },
      });

      return ResponseServer(res, 200, {
        msg: "Check-out berhasil",
        data: updatedAbsence,
      });
    }

    return ResponseServer(res, 400, { msg: "Invalid type" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

// Helper function to calculate distance between two coordinates (in meters)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Return distance in meters
};

export const REPORT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { type, month, year, userId } = req.query; // type: 'daily' or 'monthly'

  try {
    let startDate, endDate;
    const reportMonth = month
      ? parseInt(month as string)
      : moment().month() + 1;
    const reportYear = year ? parseInt(year as string) : moment().year();

    // Format month and year properly
    const monthPadded = String(reportMonth).padStart(2, "0");
    const dateStr = `${reportYear}-${monthPadded}-01`;

    if (type === "monthly" || type === "daily") {
      startDate = moment(dateStr, "YYYY-MM-DD").startOf("month").toDate();
      endDate = moment(dateStr, "YYYY-MM-DD").endOf("month").toDate();
    } else {
      // Default to monthly for current month
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
      month: reportMonth,
      year: reportYear,
      data: Object.values(report),
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
