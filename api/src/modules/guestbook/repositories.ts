import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { EGBookStatus, Prisma } from "@prisma/client";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let {
    page = 1,
    limit = 50,
    search,
    backdate,
    status_come,
    gBookTypeId,
  } = req.query;

  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.GuestBookWhereInput = {
      status: true,
      ...(status_come && { status_come: status_come as EGBookStatus }),
      ...(gBookTypeId && { gBookTypeId: gBookTypeId as string }),
      ...(backdate && {
        OR: [
          {
            created_at: {
              gte: moment(backdate as string)
                .startOf("day")
                .toDate(),
              lte: moment(backdate as string)
                .endOf("day")
                .toDate(),
            },
          },
          {
            date: {
              gte: moment(backdate as string)
                .startOf("day")
                .toDate(),
              lte: moment(backdate as string)
                .endOf("day")
                .toDate(),
            },
          },
        ],
      }),
      ...(search && {
        OR: [
          { name: { contains: search as string } },
          { description: { contains: search as string } },
          { GBookType: { name: { contains: search as string } } },
          {
            Participant: {
              some: {
                OR: [
                  { name: { contains: search as string } },
                  { phone: { contains: search as string } },
                  { email: { contains: search as string } },
                ],
              },
            },
          },
        ],
      }),
    };

    const data = await prisma.guestBook.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        GBookType: true,
        Participant: true,
      },
    });

    const total = await prisma.guestBook.count({ where });

    return ResponseServer(res, 200, {
      msg: "GET /guestbook",
      page,
      limit,
      search,
      backdate,
      status_come,
      gBookTypeId,
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
  const body = req.body;
  try {
    const { id, Participant, GBookType, ...saved } = body;

    const data = await prisma.guestBook.create({
      data: {
        ...saved,
        ...(Participant.length > 0 && {
          Participant: {
            create: Participant.map((p: any) => ({
              name: p.name,
              phone: p.phone,
              email: p.email,
              note: p.note,
            })),
          },
        }),
      },
      include: {
        Participant: true,
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
  const { Participant, GBookType, ...saved } = req.body;

  try {
    if (!id)
      return ResponseServer(res, 404, {
        msg: "ID Not found",
        params: req.params,
      });

    const find = await prisma.guestBook.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.$transaction(async (tx) => {
      await tx.guestBook.update({ where: { id: find.id }, data: { ...saved } });
      await tx.participant.deleteMany({ where: { guestBookId: find.id } });
      await tx.participant.createMany({
        data: Participant.map((p: any) => ({
          name: p.name,
          phone: p.phone,
          email: p.email,
          note: p.note,
          guestBookId: find.id,
        })),
      });
      return true;
    });

    return ResponseServer(res, 200, {
      msg: "Data berhasil dirubah",
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
    const find = await prisma.guestBook.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.guestBook.update({
      where: { id: find.id },
      data: { status: false, updated_at: new Date() },
    });

    return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
