import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import type { Prisma } from "@prisma/client";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, categoryId } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.LibraryWhereInput = {
      status: true,
      ...(search && {
        OR: [
          { name: { contains: search as string } },
          { code: { contains: search as string } },
          { drawer_code: { contains: search as string } },
        ],
      }),
      ...(categoryId && { libraryCategoryId: categoryId as string }),
    };
    const [data, total] = await Promise.all([
      prisma.library.findMany({
        where,
        skip: skip,
        take: limit,
      }),
      prisma.library.count({
        where,
      }),
    ]);
    return ResponseServer(res, 200, { data, total });
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
    const { id, LibraryCategory, ...saved } = body;
    const genId = await generateId();
    await prisma.library.create({ data: { id: genId, ...saved } });
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
    const find = await prisma.library.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    const { LibraryCategory, ...saved } = body;
    await prisma.library.update({
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
    const find = await prisma.library.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.library.update({
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
  const prefix = "LIB";
  const padLength = 4;
  const lastRecord = await prisma.library.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
