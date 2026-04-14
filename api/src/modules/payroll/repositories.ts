import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { EPayrollStatus } from "@prisma/client";

// Helper: Calculate attendance stats for a user in a specific month
const calculateAttendanceStats = async (
  userId: string,
  month: number,
  year: number,
) => {
  const startDate = moment(`${year}-${String(month).padStart(2, "0")}-01`)
    .startOf("month")
    .toDate();
  const endDate = moment(`${year}-${String(month).padStart(2, "0")}-01`)
    .endOf("month")
    .toDate();

  const absences = await prisma.absence.findMany({
    where: {
      userId,
      check_in: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const stats = {
    total_days: getDaysInMonth(month, year),
    hadir: 0,
    terlambat: 0,
    sakit: 0,
    cuti: 0,
    perdin: 0,
    alpha: 0,
    absences,
  };

  absences.forEach((absence) => {
    switch (absence.absence_status) {
      case "HADIR":
        stats.hadir++;
        break;
      case "TERLAMBAT":
        stats.terlambat++;
        break;
      case "SAKIT":
        stats.sakit++;
        break;
      case "CUTI":
        stats.cuti++;
        break;
      case "PERDIN":
        stats.perdin++;
        break;
      default:
        stats.alpha++;
    }
  });

  // Alpha = days in month that have no attendance record
  stats.alpha = stats.total_days - absences.length;

  return stats;
};

// Helper: Get number of days in a month
const getDaysInMonth = (month: number, year: number) => {
  return moment(`${year}-${String(month).padStart(2, "0")}-01`).daysInMonth();
};

// Helper: Calculate deductions based on absence config
const calculateDeductions = async (
  absenceStats: any,
  absenceConfig: any,
  userId: string,
  month: number,
  year: number,
): Promise<{
  amount: number;
  details: Array<{ desc: string; amount: number }>;
}> => {
  const details: Array<{ desc: string; amount: number }> = [];
  let totalDeduction = 0;

  // Terlambat deduction
  if (absenceStats.terlambat > 0 && absenceConfig.late_eduction > 0) {
    const latePenalty = absenceStats.terlambat * absenceConfig.late_eduction;
    details.push({
      desc: `Potongan Terlambat (${absenceStats.terlambat} hari x Rp ${absenceConfig.late_eduction})`,
      amount: latePenalty,
    });
    totalDeduction += latePenalty;
  }

  // Alpha deduction
  if (absenceStats.alpha > 0 && absenceConfig.alpha_deduction > 0) {
    const alphaPenalty = absenceStats.alpha * absenceConfig.alpha_deduction;
    details.push({
      desc: `Potongan Alpha (${absenceStats.alpha} hari x Rp ${absenceConfig.alpha_deduction})`,
      amount: alphaPenalty,
    });
    totalDeduction += alphaPenalty;
  }

  // Get UserCost deductions (BPJS, asuransi, potongan lainnya)
  const startDate = moment(`${year}-${String(month).padStart(2, "0")}-01`)
    .startOf("month")
    .toDate();
  const endDate = moment(`${year}-${String(month).padStart(2, "0")}-01`)
    .endOf("month")
    .toDate();

  const userDeductions = await prisma.userCost.findMany({
    where: {
      userId,
      type: "DEDUCTION",
      start_at: {
        lte: endDate,
      },
      OR: [
        { end_at: null },
        {
          end_at: {
            gte: startDate,
          },
        },
      ],
    },
  });

  userDeductions.forEach((deduction) => {
    const amount = deduction.nominal_type === "PERCENT" ? 0 : deduction.nominal;
    details.push({
      desc: deduction.name,
      amount,
    });
    totalDeduction += amount;
  });

  return { amount: totalDeduction, details };
};

// Helper: Calculate allowances and bonuses
const calculateAllowancesAndBonuses = async (
  userId: string,
  month: number,
  year: number,
): Promise<{
  amount: number;
  details: Array<{ desc: string; amount: number }>;
}> => {
  const details: Array<{ desc: string; amount: number }> = [];
  let totalBonus = 0;

  const startDate = moment(`${year}-${String(month).padStart(2, "0")}-01`)
    .startOf("month")
    .toDate();
  const endDate = moment(`${year}-${String(month).padStart(2, "0")}-01`)
    .endOf("month")
    .toDate();

  // Get UserCost allowances
  const userAllowances = await prisma.userCost.findMany({
    where: {
      userId,
      type: "ALLOWANCE",
      start_at: {
        lte: endDate,
      },
      OR: [
        { end_at: null },
        {
          end_at: {
            gte: startDate,
          },
        },
      ],
    },
  });

  userAllowances.forEach((allowance) => {
    const amount = allowance.nominal_type === "PERCENT" ? 0 : allowance.nominal;
    details.push({
      desc: allowance.name,
      amount,
    });
    totalBonus += amount;
  });

  return { amount: totalBonus, details };
};

// Helper: Calculate net salary
const calculateNetSalary = (
  baseSalary: number,
  totalDeduction: number,
  totalAllowance: number,
): number => {
  return baseSalary + totalAllowance - totalDeduction;
};

// Main calculation function
const calculatePayroll = async (
  userId: string,
  month: number,
  year: number,
): Promise<any> => {
  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  // Get or create absence config
  let config = await prisma.absenceConfig.findFirst();
  if (!config) {
    config = await prisma.absenceConfig.create({
      data: {
        late_eduction: 50000,
        alpha_deduction: 100000,
      },
    });
  }

  // Calculate attendance
  const attendanceStats = await calculateAttendanceStats(userId, month, year);

  // Calculate deductions
  const deductions = await calculateDeductions(
    attendanceStats,
    config,
    userId,
    month,
    year,
  );

  // Calculate allowances and bonuses
  const allowancesBonus = await calculateAllowancesAndBonuses(
    userId,
    month,
    year,
  );

  // Calculate net salary
  const netSalary = calculateNetSalary(
    user.salary,
    deductions.amount,
    allowancesBonus.amount,
  );

  return {
    user,
    month,
    year,
    baseSalary: user.salary,
    deductions,
    allowances: allowancesBonus,
    netSalary,
    attendanceStats,
  };
};

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, month, year, status, userId } = req.query;
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
        userIdFilter = currentUserId;
      }
    }

    const where: any = {
      ...(userIdFilter && { userId: userIdFilter }),
      ...(userId && { userId: userId as string }),
      ...(month && { month: Number(month) }),
      ...(year && { year: Number(year) }),
      ...(status && { status: status as EPayrollStatus }),
    };

    if (search) {
      where.User = {
        OR: [
          { fullname: { contains: search as string } },
          { nik: { contains: search as string } },
          { nip: { contains: search as string } },
          { email: { contains: search as string } },
        ],
      };
    }

    const data = await prisma.payroll.findMany({
      where,
      skip,
      take: limit,
      include: {
        User: { include: { Position: true } },
        PayrollDetail: true,
      },
      orderBy: { created_at: "desc" },
    });

    const total = await prisma.payroll.count({ where });

    return ResponseServer(res, 200, {
      msg: "GET /payroll",
      page,
      limit,
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

export const CALCULATE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { userId, month, year } = req.body;

  try {
    if (!userId || !month || !year) {
      return ResponseServer(res, 400, {
        msg: "userId, month, dan year harus diisi",
      });
    }

    // Check if payroll already exists
    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        userId,
        month: Number(month),
        year: Number(year),
      },
    });

    if (existingPayroll) {
      return ResponseServer(res, 400, {
        msg: `Payroll untuk bulan ${month}/${year} sudah ada`,
        data: existingPayroll,
      });
    }

    // Calculate payroll
    const calculation = await calculatePayroll(
      userId,
      Number(month),
      Number(year),
    );

    // Create payroll record
    const payroll = await prisma.$transaction(async (tx) => {
      const created = await tx.payroll.create({
        data: {
          userId,
          month: Number(month),
          year: Number(year),
          base_salary: calculation.baseSalary,
          bonus_incentive: calculation.allowances.amount,
          total_deduction: calculation.deductions.amount,
          net_salary: calculation.netSalary,
          status: "CALCULATED",
        },
      });

      // Create detail records
      const allDetails = [
        ...calculation.deductions.details.map((d: any) => ({
          description: d.desc,
          type: "DEDUCTION",
          amount: d.amount,
          payrollId: created.id,
        })),
        ...calculation.allowances.details.map((a: any) => ({
          description: a.desc,
          type: "ALLOWANCE",
          amount: a.amount,
          payrollId: created.id,
        })),
      ];

      await tx.payrollDetail.createMany({
        data: allDetails,
      });

      return created;
    });

    return ResponseServer(res, 200, {
      msg: "Payroll berhasil dihitung",
      data: {
        payroll,
        calculation,
      },
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const GET_DETAIL = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query;

  try {
    if (!id) {
      return ResponseServer(res, 400, { msg: "ID harus diisi" });
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id: id as string },
      include: {
        User: { include: { Position: true } },
        PayrollDetail: true,
      },
    });

    if (!payroll) {
      return ResponseServer(res, 404, { msg: "Payroll tidak ditemukan" });
    }

    return ResponseServer(res, 200, {
      msg: "GET /payroll/:id",
      data: payroll,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const APPROVE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query;
  const approverId = (req as any).user?.id;

  try {
    if (!id) {
      return ResponseServer(res, 400, { msg: "ID harus diisi" });
    }

    if (!approverId) {
      return ResponseServer(res, 401, { msg: "Unauthorized" });
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id: id as string },
    });

    if (!payroll) {
      return ResponseServer(res, 404, { msg: "Payroll tidak ditemukan" });
    }

    if (
      payroll.status === "APPROVED" ||
      payroll.status === "PAYROLL_GENERATED"
    ) {
      return ResponseServer(res, 400, {
        msg: "Payroll sudah disetujui atau sudah di-payroll",
      });
    }

    const updated = await prisma.payroll.update({
      where: { id: payroll.id },
      data: {
        status: "APPROVED",
        approved_at: new Date(),
        approved_by: approverId,
      },
      include: {
        User: true,
        PayrollDetail: true,
      },
    });

    return ResponseServer(res, 200, {
      msg: "Payroll berhasil disetujui",
      data: updated,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const REJECT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    if (!id) {
      return ResponseServer(res, 400, { msg: "ID harus diisi" });
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id: id as string },
    });

    if (!payroll) {
      return ResponseServer(res, 404, { msg: "Payroll tidak ditemukan" });
    }

    // Delete payroll and its details
    await prisma.$transaction(async (tx) => {
      await tx.payrollDetail.deleteMany({
        where: { payrollId: payroll.id },
      });
      await tx.payroll.delete({
        where: { id: payroll.id },
      });
    });

    return ResponseServer(res, 200, {
      msg: "Payroll berhasil dihapus",
      data: { id: payroll.id },
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const GENERATE_BULK = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { month, year } = req.body;

  try {
    if (!month || !year) {
      return ResponseServer(res, 400, {
        msg: "month dan year harus diisi",
      });
    }

    // Get all active users
    const users = await prisma.user.findMany({
      where: { status: true },
    });

    const results: any[] = [];
    const errors: any[] = [];

    for (const user of users) {
      try {
        // Check if payroll already exists
        const existing = await prisma.payroll.findFirst({
          where: {
            userId: user.id,
            month: Number(month),
            year: Number(year),
          },
        });

        if (existing) {
          results.push({
            userId: user.id,
            status: "SKIP",
            msg: `Payroll sudah ada`,
          });
          continue;
        }

        const calculation = await calculatePayroll(
          user.id,
          Number(month),
          Number(year),
        );

        await prisma.$transaction(async (tx) => {
          const created = await tx.payroll.create({
            data: {
              userId: user.id,
              month: Number(month),
              year: Number(year),
              base_salary: calculation.baseSalary,
              bonus_incentive: calculation.allowances.amount,
              total_deduction: calculation.deductions.amount,
              net_salary: calculation.netSalary,
              status: "CALCULATED",
            },
          });

          const allDetails = [
            ...calculation.deductions.details.map((d: any) => ({
              description: d.desc,
              type: "DEDUCTION",
              amount: d.amount,
              payrollId: created.id,
            })),
            ...calculation.allowances.details.map((a: any) => ({
              description: a.desc,
              type: "ALLOWANCE",
              amount: a.amount,
              payrollId: created.id,
            })),
          ];

          await tx.payrollDetail.createMany({
            data: allDetails,
          });
        });

        results.push({
          userId: user.id,
          fullname: user.fullname,
          status: "SUCCESS",
        });
      } catch (error) {
        errors.push({
          userId: user.id,
          fullname: user.fullname,
          error: (error as any).message,
        });
      }
    }

    return ResponseServer(res, 200, {
      msg: "Generate bulk payroll selesai",
      total: users.length,
      success: results.filter((r) => r.status === "SUCCESS").length,
      skipped: results.filter((r) => r.status === "SKIP").length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
