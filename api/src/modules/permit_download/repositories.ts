import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { EPermitStatus, Prisma } from "@prisma/client";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, backdate, permit_status } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const querywhere: Prisma.PermitFileWhereInput = {
      status: true,
      action: "DOWNLOAD",
      ...(permit_status && { permit_status: permit_status as EPermitStatus }),
      ...(backdate && {
        created_at: {
          gte: moment((backdate as string).split(",")[0])
            .startOf("date")
            .toDate(),
          lte: moment((backdate as string).split(",")[1])
            .endOf("date")
            .toDate(),
        },
      }),
      ...(req.user?.Role.data_status === "USER" && {
        requesterId: req.user.id,
      }),
      ...(search && {
        OR: [
          { id: { contains: search as string } },
          {
            PermitFileDetail: {
              some: {
                Submission: {
                  OR: [
                    { id: { contains: search as string } },
                    { account_number: { contains: search as string } },
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
            },
          },
        ],
      }),
    };
    const data = await prisma.permitFile.findMany({
      where: querywhere,
      skip: skip,
      take: limit,
      include: {
        PermitFileDetail: {
          include: {
            Submission: { include: { Debitur: true, Files: true } },
            Files: true,
          },
        },
        Requester: true,
        Approver: true,
      },
    });
    const total = await prisma.permitFile.count({
      where: querywhere,
    });
    return ResponseServer(res, 200, {
      msg: "GET /submission",
      page,
      limit,
      search,
      backdate,
      permit_status,
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
    const {
      id,
      PermitFileDetail = [],
      Requester,
      Approver,
      ...savedSub
    } = body;
    const genId = await generateId();

    await prisma.$transaction(async (tx) => {
      const pfile = await tx.permitFile.create({
        data: {
          ...savedSub,
          id: id && id !== "" ? id : genId,
          requesterId: req.user?.id,
        },
      });
      await Promise.all(
        PermitFileDetail.map((pfd: any) =>
          tx.permitFileDetail.create({
            data: {
              permitFileId: pfile.id, // Menghubungkan ke PermitFile
              submissionId: pfd.submissionId, // Menghubungkan ke Submission
              Files: {
                connect: pfd.Files.map((file: any) => ({
                  id: file.id, // Menghubungkan ke Files (Many-to-Many)
                })),
              },
            },
          }),
        ),
      );

      return true;
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
    const find = await prisma.permitFile.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    const {
      id: idPermit,
      PermitFileDetail = [],
      Requester,
      Approver,
      ...savedSub
    } = body;

    await prisma.$transaction(async (tx) => {
      const saved = await tx.permitFile.update({
        where: { id: find.id },
        data: savedSub,
      });
      await tx.permitFileDetail.deleteMany({
        where: { permitFileId: saved.id },
      });
      if (PermitFileDetail.length > 0) {
        await Promise.all(
          PermitFileDetail.map((pfd: any) =>
            tx.permitFileDetail.create({
              data: {
                permitFileId: saved.id, // Menghubungkan ke PermitFile
                submissionId: pfd.submissionId, // Menghubungkan ke Submission
                Files: {
                  connect: pfd.Files.map((file: any) => ({
                    id: file.id, // Menghubungkan ke Files (Many-to-Many)
                  })),
                },
              },
            }),
          ),
        );
      }
      return true;
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
    const find = await prisma.permitFile.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.permitFile.update({
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
  let { id } = req.query;
  const { approv_desc, permit_status } = req.body;

  try {
    if (!id) return ResponseServer(res, 404, { msg: "Not found data" });
    const find = await prisma.permitFile.findFirst({
      where: { id: id as string },
      include: {
        PermitFileDetail: {
          include: { Files: true },
        },
      },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    // If approving a DOWNLOAD permit, update allow_download field for all files
    if (permit_status === "DISETUJUI") {
      for (const detail of find.PermitFileDetail) {
        for (const file of detail.Files || []) {
          const newAllowed = file.allow_download.split(",");
          newAllowed.push(find.requesterId);
          await prisma.files.update({
            where: { id: file.id },
            data: {
              allow_download: newAllowed.join(","),
            },
          });
        }
      }
    }

    await prisma.permitFile.update({
      where: { id: id as string },
      data: {
        permit_status: permit_status as EPermitStatus,
        approv_desc,
        approverId: req.user?.id || "",
        process_at: new Date(),
      },
    });

    return ResponseServer(res, 200, {
      msg: `Permohonan berhasil ${permit_status === "DISETUJUI" ? "disetujui" : "ditolak"}`,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

async function generateId() {
  const prefix = "PRMTD";
  const padLength = 3;
  const lastRecord = await prisma.permitFile.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
