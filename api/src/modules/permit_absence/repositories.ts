import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { EAbsenceStatus, EPermitStatus } from "@prisma/client";

// Helper: Generate date range between two dates
const generateDateRange = (startDate: Date, endDate?: Date): Date[] => {
  const dates: Date[] = [];
  const start = moment(startDate).startOf("day");
  const end = endDate
    ? moment(endDate).endOf("day")
    : moment(startDate).endOf("day");

  while (start.isSameOrBefore(end)) {
    dates.push(start.toDate());
    start.add(1, "day");
  }
  return dates;
};

// Helper: Check if permit overlaps with existing approved permits
const checkOverlapPermit = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  excludeId?: string,
): Promise<boolean> => {
  const overlaps = await prisma.permitAbsence.findMany({
    where: {
      Absence: { userId },
      permis_status: "APPROVED",
      ...(excludeId && { id: { not: excludeId } }),
      OR: [
        {
          absence_date: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          end_date: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          AND: [
            { absence_date: { lte: startDate } },
            { end_date: { gte: endDate } },
          ],
        },
      ],
    },
  });
  return overlaps.length > 0;
};

// Helper: Generate Absence records for approved permit with date range
const generateAbsenceRecords = async (permitAbsence: any, userId: string) => {
  const dates = generateDateRange(
    permitAbsence.absence_date,
    permitAbsence.end_date,
  );

  for (const date of dates) {
    // Check if absence already exists for this user on this date
    const existingAbsence = await prisma.absence.findFirst({
      where: {
        userId,
        check_in: {
          gte: moment(date).startOf("day").toDate(),
          lte: moment(date).endOf("day").toDate(),
        },
      },
    });

    if (!existingAbsence) {
      // Create new absence record
      const absence = await prisma.absence.create({
        data: {
          userId,
          method: "PERMIT",
          check_in: moment(date).startOf("day").toDate(),
          absence_status: permitAbsence.type as EAbsenceStatus,
          description: permitAbsence.description,
        },
      });

      // Link permit absence to first generated absence (for tracking)
      if (!permitAbsence.absenceId) {
        await prisma.permitAbsence.update({
          where: { id: permitAbsence.id },
          data: { absenceId: absence.id },
        });
      }
    }
  }
};

// Helper: Delete generated Absence records for rejected permit
const deleteGeneratedAbsences = async (permitAbsence: any) => {
  if (!permitAbsence.absenceId) return;

  const dates = generateDateRange(
    permitAbsence.absence_date,
    permitAbsence.end_date,
  );

  for (const date of dates) {
    await prisma.absence.deleteMany({
      where: {
        userId: permitAbsence.Absence?.userId,
        check_in: {
          gte: moment(date).startOf("day").toDate(),
          lte: moment(date).endOf("day").toDate(),
        },
        absence_status: permitAbsence.type as EAbsenceStatus,
        method: "PERMIT",
      },
    });
  }
};

// Helper: Create or update UserCost for deduction tracking
const trackDeduction = async (
  userId: string,
  permitAbsence: any,
  isRejected: boolean = false,
) => {
  if (permitAbsence.deduction <= 0) return;

  const description = isRejected
    ? `Penghapusan deduction: ${permitAbsence.type}`
    : `Deduction ${permitAbsence.type}: ${permitAbsence.description}`;

  // Create UserCost record for tracking
  await prisma.userCost.create({
    data: {
      userId,
      name: description,
      type: "DEDUCTION",
      nominal: isRejected ? -permitAbsence.deduction : permitAbsence.deduction,
      nominal_type: "RUPIAH",
      start_at: permitAbsence.absence_date,
      end_at: permitAbsence.end_date,
    },
  });
};

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let {
    page = 1,
    limit = 50,
    search,
    type,
    permit_status,
    backdate,
  } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;
  const currentUserId = (req as any).user?.id;

  try {
    // Check if current user's role has data_status restriction
    let userIdFilter: any = undefined;
    if (currentUserId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { Role: true },
      });

      if (currentUser?.Role?.data_status === "USER") {
        // If role is USER, can only see own permit absence data
        userIdFilter = currentUserId;
      }
    }

    const data = await prisma.permitAbsence.findMany({
      where: {
        status: true,
        ...(userIdFilter && { Absence: { userId: userIdFilter } }),
        ...(search && {
          Absence: {
            User: {
              OR: [
                { fullname: { contains: search as string } },
                { nik: { contains: search as string } },
                { nip: { contains: search as string } },
                { email: { contains: search as string } },
                { phone: { contains: search as string } },
                { id: { contains: search as string } },
              ],
            },
          },
        }),
        ...(type && { type: type as EAbsenceStatus }),
        ...(permit_status && { permit_status: permit_status as EPermitStatus }),
        ...(backdate && {
          created_at: {
            gte: moment((backdate as string).split(",")[0])
              .startOf("date")
              .toDate(),
            lte: moment((backdate as string).split(",")[1])
              .endOf("day")
              .toDate(),
          },
        }),
      },
      skip: skip,
      take: limit,
      include: {
        Absence: {
          include: { User: { include: { Position: true } } },
        },
      },
    });

    const total = await prisma.permitAbsence.count({
      where: {
        status: true,
        ...(search && {
          Absence: {
            User: {
              OR: [
                { fullname: { contains: search as string } },
                { nik: { contains: search as string } },
                { nip: { contains: search as string } },
                { email: { contains: search as string } },
                { phone: { contains: search as string } },
                { id: { contains: search as string } },
              ],
            },
          },
        }),
        ...(type && { type: type as EAbsenceStatus }),
        ...(permit_status && { permit_status: permit_status as EPermitStatus }),
        ...(backdate && {
          created_at: {
            gte: moment((backdate as string).split(",")[0])
              .startOf("date")
              .toDate(),
            lte: moment((backdate as string).split(",")[1])
              .endOf("day")
              .toDate(),
          },
        }),
      },
    });
    return ResponseServer(res, 200, {
      msg: "GET /permit_absence",
      page,
      limit,
      search,
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
    const data = await prisma.permitAbsence.create({
      data: {
        ...body,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    return ResponseServer(res, 200, {
      msg: "Data berhasil ditambahkan",
      data,
    });
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

    const find = await prisma.permitAbsence.findFirst({
      where: { id: id as string },
      include: { Absence: { include: { User: true } } },
    });

    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    const userId = find.Absence?.userId;
    const oldStatus = find.permis_status;
    const newStatus = body.permis_status as EPermitStatus;

    // Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check for overlapping permits if changing to APPROVED
      if (newStatus === "APPROVED" && oldStatus !== "APPROVED") {
        const hasOverlap = await tx.permitAbsence.findMany({
          where: {
            Absence: { userId },
            permis_status: "APPROVED",
            id: { not: find.id },
            OR: [
              {
                absence_date: {
                  gte: find.absence_date,
                  lte: find.end_date || find.absence_date,
                },
              },
              {
                end_date: {
                  gte: find.absence_date,
                  lte: find.end_date || find.absence_date,
                },
              },
            ],
          },
        });

        if (hasOverlap.length > 0) {
          throw new Error(
            `Tidak bisa approve: Ada izin tumpang tindih untuk tanggal yang sama`,
          );
        }
      }

      // 2. Handle APPROVED status
      if (newStatus === "APPROVED" && oldStatus !== "APPROVED") {
        // Generate absence records for date range
        const dates = generateDateRange(find.absence_date, find.end_date);

        for (const date of dates) {
          // Check if absence already exists for this date
          const existingAbsence = await tx.absence.findFirst({
            where: {
              userId,
              check_in: {
                gte: moment(date).startOf("day").toDate(),
                lte: moment(date).endOf("day").toDate(),
              },
            },
          });

          if (!existingAbsence) {
            const absence = await tx.absence.create({
              data: {
                userId,
                method: "PERMIT",
                check_in: moment(date).startOf("day").toDate(),
                absence_status: find.type as EAbsenceStatus,
                description: find.description,
              },
            });

            // Update absence_id for first generated record
            if (!find.absenceId) {
              await tx.permitAbsence.update({
                where: { id: find.id },
                data: { absenceId: absence.id },
              });
            }
          }
        }

        // Create UserCost record for deduction tracking
        if (find.deduction > 0 && userId) {
          await tx.userCost.create({
            data: {
              userId,
              name: `Deduction ${find.type}: ${find.description || ""}`.trim(),
              type: "DEDUCTION",
              nominal: find.deduction,
              nominal_type: "RUPIAH",
              start_at: find.absence_date,
              end_at: find.end_date,
            },
          });
        }

        // Create UserCost record for allowance if any
        if (find.allowance > 0 && userId) {
          await tx.userCost.create({
            data: {
              userId,
              name: `Allowance ${find.type}: ${find.description || ""}`.trim(),
              type: "ALLOWANCE",
              nominal: find.allowance,
              nominal_type: "RUPIAH",
              start_at: find.absence_date,
              end_at: find.end_date,
            },
          });
        }
      }

      // 3. Handle REJECTED status
      if (newStatus === "REJECTED" && oldStatus !== "REJECTED") {
        // Delete generated absence records
        const dates = generateDateRange(find.absence_date, find.end_date);

        for (const date of dates) {
          await tx.absence.deleteMany({
            where: {
              userId,
              check_in: {
                gte: moment(date).startOf("day").toDate(),
                lte: moment(date).endOf("day").toDate(),
              },
              method: "PERMIT",
              absence_status: find.type as EAbsenceStatus,
            },
          });
        }

        // Create reverse UserCost entries for deduction/allowance
        if (find.deduction > 0 && userId) {
          await tx.userCost.create({
            data: {
              userId,
              name: `Pembatalan deduction ${find.type}: ${find.description || ""}`.trim(),
              type: "DEDUCTION",
              nominal: -find.deduction,
              nominal_type: "RUPIAH",
              start_at: new Date(),
            },
          });
        }

        if (find.allowance > 0 && userId) {
          await tx.userCost.create({
            data: {
              userId,
              name: `Pembatalan allowance ${find.type}: ${find.description || ""}`.trim(),
              type: "ALLOWANCE",
              nominal: -find.allowance,
              nominal_type: "RUPIAH",
              start_at: new Date(),
            },
          });
        }
      }

      // 4. Update permit absence record
      return await tx.permitAbsence.update({
        where: { id: find.id },
        data: {
          ...body,
          updated_at: new Date(),
        },
      });
    });

    return ResponseServer(res, 200, {
      msg: `Data berhasil dirubah menjadi ${newStatus}`,
      data: result,
    });
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

    const find = await prisma.permitAbsence.findFirst({
      where: { id: id as string },
      include: { Absence: true },
    });

    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.$transaction(async (tx) => {
      // If permit was APPROVED, clean up generated absence records
      if (find.permis_status === "APPROVED" && find.Absence?.userId) {
        const dates = generateDateRange(find.absence_date, find.end_date);

        for (const date of dates) {
          await tx.absence.deleteMany({
            where: {
              userId: find.Absence.userId,
              check_in: {
                gte: moment(date).startOf("day").toDate(),
                lte: moment(date).endOf("day").toDate(),
              },
              method: "PERMIT",
              absence_status: find.type as EAbsenceStatus,
            },
          });
        }

        // Remove related UserCost entries
        if (find.deduction > 0 || find.allowance > 0) {
          await tx.userCost.deleteMany({
            where: {
              userId: find.Absence.userId,
              OR: [
                {
                  name: {
                    contains: `Deduction ${find.type}`,
                  },
                },
                {
                  name: {
                    contains: `Allowance ${find.type}`,
                  },
                },
              ],
            },
          });
        }
      }

      // Delete permit absence
      await tx.permitAbsence.delete({
        where: { id: find.id },
      });
    });

    return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
