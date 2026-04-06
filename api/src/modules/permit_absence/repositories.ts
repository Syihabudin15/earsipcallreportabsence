import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { EAbsenceStatus, EPermitStatus } from "@prisma/client";

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

  try {
    const data = await prisma.permitAbsence.findMany({
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
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.permitAbsence.update({
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
    const find = await prisma.permitAbsence.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.permitAbsence.delete({
      where: { id: find.id },
    });

    return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
