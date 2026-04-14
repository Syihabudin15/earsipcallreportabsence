import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { EGBookStatus } from "@prisma/client";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let {
    page = 1,
    limit = 50,
    search,
    date,
    status_come,
    gBookTypeId,
  } = req.query;

  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: any = {
      status: true,
      ...(status_come && { status_come: status_come as EGBookStatus }),
      ...(gBookTypeId && { gBookTypeId: gBookTypeId as string }),
      ...(date && {
        date: {
          gte: moment(date as string)
            .startOf("day")
            .toDate(),
          lte: moment(date as string)
            .endOf("day")
            .toDate(),
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search as string } },
          { description: { contains: search as string } },
          { GbookType: { name: { contains: search as string } } },
          {
            Participant: {
              some: { name: { contains: search as string } },
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
        GbookType: true,
        Participant: true,
      },
    });

    const total = await prisma.guestBook.count({ where });

    return ResponseServer(res, 200, {
      msg: "GET /guestbook",
      page,
      limit,
      search,
      date,
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
    const { id, Participants, ...saved } = body;

    // Filter out any participants without a name
    const validParticipants = (Participants || [])
      .filter((p: any) => p.name && p.name.trim())
      .map((p: any) => {
        const { id, action, ...participant } = p;
        return participant;
      });

    const data = await prisma.guestBook.create({
      data: {
        ...saved,
        ...(validParticipants.length > 0 && {
          Participant: { create: validParticipants },
        }),
      },
      include: {
        GbookType: true,
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
  const body = req.body;

  try {
    if (!id)
      return ResponseServer(res, 404, {
        msg: "ID Not found",
        params: req.params,
      });

    const find = await prisma.guestBook.findFirst({
      where: { id: id as string },
      include: { Participant: true },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    const { Participants, ...saved } = body;

    // Handle participants if provided
    if (Participants) {
      const createParticipants: any[] = [];
      const updateParticipants: any[] = [];
      const deleteParticipantIds: string[] = [];

      // Process each participant based on action
      for (const participant of Participants) {
        if (!participant.name || !participant.name.trim()) continue;

        if (participant.action === "delete" && participant.id) {
          deleteParticipantIds.push(participant.id);
        } else if (participant.action === "update" && participant.id) {
          const { id: pId, action, ...data } = participant;
          updateParticipants.push({ id: pId, data });
        } else {
          // Create new (action: "create" or no action + no id)
          const { id: pId, action, ...data } = participant;
          createParticipants.push({
            ...data,
            guestBookId: find.id,
          });
        }
      }

      // Delete removed participants
      if (deleteParticipantIds.length > 0) {
        await prisma.participant.deleteMany({
          where: { id: { in: deleteParticipantIds } },
        });
      }

      // Update existing participants
      for (const { id: pId, data } of updateParticipants) {
        await prisma.participant.update({
          where: { id: pId },
          data,
        });
      }

      // Create new participants
      if (createParticipants.length > 0) {
        await prisma.participant.createMany({
          data: createParticipants,
        });
      }
    }

    // Update guestbook
    const data = await prisma.guestBook.update({
      where: { id: find.id },
      data: { ...saved, updated_at: new Date() },
      include: {
        GbookType: true,
        Participant: true,
      },
    });

    return ResponseServer(res, 200, {
      msg: "Data berhasil dirubah",
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
