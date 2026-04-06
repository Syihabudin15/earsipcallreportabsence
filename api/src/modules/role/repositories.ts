import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const data = await prisma.role.findMany({
      where: {
        status: true,
        ...(search && {
          OR: [
            { name: { contains: search as string } },
            { id: { contains: search as string } },
          ],
        }),
      },
      skip: skip,
      take: limit,
    });

    const total = await prisma.role.count({
      where: {
        status: true,
        ...(search && {
          OR: [
            { name: { contains: search as string } },
            { id: { contains: search as string } },
          ],
        }),
      },
    });
    return ResponseServer(res, 200, {
      msg: "GET /role",
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
    const genId = await generateId();
    await prisma.role.create({
      data: {
        id: body.id && body.id !== "" ? body.id : genId,
        name: body.name,
        data_status: body.data_status || "ALL",
        status: body.status !== undefined ? body.status : true,
        permission: JSON.stringify(body.permission || []),
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
    const find = await prisma.role.findFirst({ where: { id: id as string } });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.role.update({
      where: { id: find.id },
      data: {
        name: body.name,
        data_status: body.data_status || "ALL",
        status: body.status !== undefined ? body.status : true,
        permission: JSON.stringify(body.permission),
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
    const find = await prisma.role.findFirst({ where: { id: id as string } });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.role.update({
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
  const prefix = "RL";
  const padLength = 2;
  const lastRecord = await prisma.role.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
