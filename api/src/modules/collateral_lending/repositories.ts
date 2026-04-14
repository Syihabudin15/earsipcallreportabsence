import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { EGuaranteeStatus } from "@prisma/client";
import { decode } from "../../libs/auth.js";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, status } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const data = await prisma.collateralLending.findMany({
      where: {
        status: true,
        ...(search && {
          OR: [
            { id: { contains: search as string } },
            {
              Submission: {
                OR: [
                  { id: { contains: search as string } },
                  {
                    Debitur: {
                      OR: [
                        { id: { contains: search as string } },
                        { fullname: { contains: search as string } },
                        { nik: { contains: search as string } },
                        { cif: { contains: search as string } },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        }),
      },
      include: {
        Submission: {
          include: {
            Debitur: true,
            Product: { include: { ProductType: true } },
          },
        },
        CreatedBy: true,
        ApproverBy: true,
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip: skip,
    });

    const total = await prisma.collateralLending.count({
      where: {
        status: true,
        ...(search && {
          OR: [
            { id: { contains: search as string } },
            {
              Submission: {
                OR: [
                  { id: { contains: search as string } },
                  {
                    Debitur: {
                      OR: [
                        { id: { contains: search as string } },
                        { fullname: { contains: search as string } },
                        { nik: { contains: search as string } },
                        { cif: { contains: search as string } },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        }),
      },
    });

    return ResponseServer(res, 200, {
      msg: "Data Peminjaman Jaminan berhasil diambil",
      page,
      limit,
      search,
      data,
      total,
    });
  } catch (error) {
    console.log(error);
    return ResponseServer(res, 500, {
      msg: "Gagal mengambil data",
      error,
    });
  }
};

export const POST = async (req: Request, res: Response, next: NextFunction) => {
  const { submissionId, description, start_at, return_at, end_at } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  const user = decode(token as string);

  try {
    const collateral = await prisma.collateralLending.create({
      data: {
        submissionId,
        description,
        start_at: new Date(start_at),
        return_at: return_at ? new Date(return_at) : undefined,
        end_at: end_at ? new Date(end_at) : undefined,
        createdById: user?.id as string,
      },
      include: {
        Submission: true,
        CreatedBy: true,
      },
    });

    return ResponseServer(res, 201, {
      msg: "Peminjaman Jaminan berhasil dibuat",
      data: collateral,
    });
  } catch (error) {
    console.log(error);
    return ResponseServer(res, 500, {
      msg: "Gagal membuat Peminjaman Jaminan",
      error,
    });
  }
};

export const PUT = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.query;
  const { description, start_at, return_at, end_at, approverById } = req.body;

  try {
    const collateral = await prisma.collateralLending.update({
      where: { id: id as string },
      data: {
        ...(description && { description }),
        ...(start_at && { start_at: new Date(start_at) }),
        ...(return_at && { return_at: new Date(return_at) }),
        ...(end_at && { end_at: new Date(end_at) }),
        ...(approverById && { approverById }),
      },
      include: {
        Submission: true,
        CreatedBy: true,
        ApproverBy: true,
      },
    });

    return ResponseServer(res, 200, {
      msg: "Peminjaman Jaminan berhasil diperbarui",
      data: collateral,
    });
  } catch (error) {
    console.log(error);
    return ResponseServer(res, 500, {
      msg: "Gagal memperbarui Peminjaman Jaminan",
      error,
    });
  }
};

export const DELETE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query;

  try {
    await prisma.collateralLending.update({
      where: { id: id as string },
      data: { status: false },
    });

    return ResponseServer(res, 200, {
      msg: "Peminjaman Jaminan berhasil dihapus",
    });
  } catch (error) {
    console.log(error);
    return ResponseServer(res, 500, {
      msg: "Gagal menghapus Peminjaman Jaminan",
      error,
    });
  }
};

export const PATCH = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query;
  const { approverById } = req.body;

  try {
    const collateral = await prisma.collateralLending.update({
      where: { id: id as string },
      data: { approverById },
      include: {
        Submission: true,
        CreatedBy: true,
        ApproverBy: true,
      },
    });

    return ResponseServer(res, 200, {
      msg: "Persetujuan Peminjaman Jaminan berhasil",
      data: collateral,
    });
  } catch (error) {
    console.log(error);
    return ResponseServer(res, 500, {
      msg: "Gagal memperbarui persetujuan",
      error,
    });
  }
};
