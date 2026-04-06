import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { UserCost } from "@prisma/client";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, roleId, positionId } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const data = await prisma.user.findMany({
      where: {
        status: true,
        ...(search && { name: { contains: search as string } }),
        ...(roleId && { roleId: roleId as string }),
        ...(positionId && { positionId: positionId as string }),
      },
      skip: skip,
      take: limit,
      include: {
        Role: true,
        Position: true,
        UserCost: true,
        Absence: {
          where: {
            created_at: {
              gte: moment().startOf("day").toDate(),
              lte: moment().endOf("day").toDate(),
            },
          },
        },
      },
    });

    const total = await prisma.user.count({
      where: {
        status: true,
        ...(search && { name: { contains: search as string } }),
        ...(roleId && { roleId: roleId as string }),
        ...(positionId && { positionId: positionId as string }),
      },
    });
    return ResponseServer(res, 200, {
      msg: "GET /user",
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
  const { id, UserCost, Absence, Position, Role, ...usersaved } = body;
  try {
    const genId = await generateId();
    const saved = await prisma.user.create({
      data: {
        ...usersaved,
        id: body.id && body.id !== "" ? body.id : genId,
      },
    });
    if (UserCost.length !== 0) {
      await prisma.userCost.createMany({
        data: UserCost.map((p: UserCost) => {
          return { ...p, userId: saved.id };
        }),
      });
    }
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
  const { UserCost, Absence, Position, Role, ...usersaved } = body;

  try {
    if (!id)
      return ResponseServer(res, 404, {
        msg: "ID Not found",
        params: req.params,
      });
    const find = await prisma.user.findFirst({ where: { id: id as string } });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    const saved = await prisma.user.update({
      where: { id: find.id },
      data: {
        ...usersaved,
        updated_at: new Date(),
      },
    });
    if (UserCost.length !== 0) {
      for (const p of UserCost) {
        const find = await prisma.userCost.findFirst({
          where: { id: p.id },
        });
        if (find) {
          await prisma.userCost.update({
            where: { id: p.id },
            data: { ...p, userId: saved.id },
          });
        } else {
          await prisma.userCost.create({
            data: { ...p, userId: saved.id },
          });
        }
      }
    }

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
    const find = await prisma.user.findFirst({ where: { id: id as string } });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.user.update({
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

export const PATCH = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query;

  if (!id) return ResponseServer(res, 404, { msg: "Not found data" });
  try {
    const find = await prisma.userCost.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });
    await prisma.userCost.update({
      where: { id: id as string },
      data: { end_at: new Date() },
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
  const prefix = "USR";
  const padLength = 3;
  const lastRecord = await prisma.user.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
