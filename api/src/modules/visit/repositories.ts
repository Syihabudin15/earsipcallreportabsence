import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { EPermitStatus } from "@prisma/client";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let {
    page = 1,
    limit = 50,
    search,
    visitCategoryId,
    visitStatusId,
    visitPurposeId,
    approve_status,
    submissionTypeId,
    backdate,
  } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const data = await prisma.visit.findMany({
      where: {
        status: true,
        ...(search && {
          OR: [
            { id: { contains: search as string } },
            {
              Debitur: {
                OR: [
                  { fullname: { contains: search as string } },
                  { cif: { contains: search as string } },
                  { nik: { contains: search as string } },
                  { id: { contains: search as string } },
                ],
              },
            },
          ],
        }),
        ...(visitCategoryId && { visitCategoryId: visitCategoryId as string }),
        ...(visitStatusId && { visitStatusId: visitStatusId as string }),
        ...(visitPurposeId && { visitPurposeId: visitPurposeId as string }),
        ...(approve_status && {
          approve_status: approve_status as EPermitStatus,
        }),
        ...(submissionTypeId && {
          Debitur: {
            submissionTypeId: submissionTypeId as string,
          },
        }),
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
      include: {
        Debitur: true,
        VisitCategory: true,
        VisitStatus: true,
        VisitPurpose: true,
        User: true,
      },
      skip: skip,
      take: limit,
    });

    const total = await prisma.visit.count({
      where: {
        status: true,
        ...(search && {
          OR: [
            { id: { contains: search as string } },
            {
              Debitur: {
                OR: [
                  { fullname: { contains: search as string } },
                  { cif: { contains: search as string } },
                  { nik: { contains: search as string } },
                  { id: { contains: search as string } },
                ],
              },
            },
          ],
        }),
        ...(visitCategoryId && { visitCategoryId: visitCategoryId as string }),
        ...(visitStatusId && { visitStatusId: visitStatusId as string }),
        ...(visitPurposeId && { visitPurposeId: visitPurposeId as string }),
        ...(approve_status && {
          approve_status: approve_status as EPermitStatus,
        }),
        ...(submissionTypeId && {
          Debitur: {
            submissionTypeId: submissionTypeId as string,
          },
        }),
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
      msg: "GET /visit",
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
    const { id, VisitCategory, VisitStatus, VisitPurpose, User, ...saved } =
      body;
    const genId = await generateId();
    await prisma.visit.create({
      data: {
        ...saved,
        id: body.id && body.id !== "" ? body.id : genId,
      },
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
    const find = await prisma.visit.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });
    const { VisitCategory, VisitStatus, VisitPurpose, User, ...saved } = body;

    await prisma.visit.update({
      where: { id: find.id },
      data: {
        ...saved,
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
    const find = await prisma.visit.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.visit.update({
      where: { id: find.id },
      data: { status: false },
    });

    return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

async function generateId() {
  const prefix = "VID";
  const padLength = 4;
  const lastRecord = await prisma.visit.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
