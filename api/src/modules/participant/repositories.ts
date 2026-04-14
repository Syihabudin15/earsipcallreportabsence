import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, guestBookId, search } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: any = {
      ...(guestBookId && { guestBookId: guestBookId as string }),
      ...(search && {
        OR: [
          { name: { contains: search as string } },
          { email: { contains: search as string } },
          { phone: { contains: search as string } },
          { comment: { contains: search as string } },
        ],
      }),
    };

    const data = await prisma.participant.findMany({
      where,
      skip,
      take: limit,
      include: {
        GuestBook: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
      },
      orderBy: { GuestBook: { date: "desc" } },
    });

    const total = await prisma.participant.count({ where });

    return ResponseServer(res, 200, {
      msg: "GET /participant",
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

export const GET_BY_ID = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query;

  try {
    if (!id)
      return ResponseServer(res, 400, {
        msg: "ID is required",
      });

    const data = await prisma.participant.findUnique({
      where: { id: id as string },
      include: {
        GuestBook: {
          select: {
            id: true,
            name: true,
            date: true,
            GbookType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!data) {
      return ResponseServer(res, 404, {
        msg: "Participant not found",
      });
    }

    return ResponseServer(res, 200, {
      msg: "GET /participant/:id",
      data,
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
    if (!body.guestBookId || !body.name) {
      return ResponseServer(res, 400, {
        msg: "guestBookId and name are required",
      });
    }

    // Verify guestbook exists
    const guestbook = await prisma.guestBook.findUnique({
      where: { id: body.guestBookId },
    });

    if (!guestbook) {
      return ResponseServer(res, 404, {
        msg: "GuestBook not found",
      });
    }

    const data = await prisma.participant.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        comment: body.comment || null,
        guestBookId: body.guestBookId,
      },
      include: {
        GuestBook: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
      },
    });

    return ResponseServer(res, 200, {
      msg: "Participant berhasil ditambahkan",
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
  const { id } = req.query;
  const body = req.body;

  try {
    if (!id) {
      return ResponseServer(res, 400, {
        msg: "ID is required",
      });
    }

    const exists = await prisma.participant.findUnique({
      where: { id: id as string },
    });

    if (!exists) {
      return ResponseServer(res, 404, {
        msg: "Participant not found",
      });
    }

    // If guestBookId is being changed, verify the new guestbook exists
    if (body.guestBookId && body.guestBookId !== exists.guestBookId) {
      const guestbook = await prisma.guestBook.findUnique({
        where: { id: body.guestBookId },
      });

      if (!guestbook) {
        return ResponseServer(res, 404, {
          msg: "GuestBook not found",
        });
      }
    }

    const data = await prisma.participant.update({
      where: { id: id as string },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.comment !== undefined && { comment: body.comment }),
        ...(body.guestBookId && { guestBookId: body.guestBookId }),
      },
      include: {
        GuestBook: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
      },
    });

    return ResponseServer(res, 200, {
      msg: "Participant berhasil diperbarui",
      data,
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
  const { id } = req.query;

  try {
    if (!id) {
      return ResponseServer(res, 400, {
        msg: "ID is required",
      });
    }

    const exists = await prisma.participant.findUnique({
      where: { id: id as string },
    });

    if (!exists) {
      return ResponseServer(res, 404, {
        msg: "Participant not found",
      });
    }

    await prisma.participant.delete({
      where: { id: id as string },
    });

    return ResponseServer(res, 200, {
      msg: "Participant berhasil dihapus",
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
