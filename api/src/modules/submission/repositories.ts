import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let {
    page = 1,
    limit = 50,
    search,
    productTypeId,
    productId,
    guarantee_status,
    is_active,
    backdate,
    submissionTypeId,
  } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const data = await prisma.submission.findMany({
      where: {
        status: true,
        ...(search && {
          OR: [
            {
              Debitur: {
                OR: [
                  { fullname: { contains: search as string } },
                  { id: { contains: search as string } },
                  { nik: { contains: search as string } },
                  { cif: { contains: search as string } },
                ],
              },
            },
            { id: { contains: search as string } },
            { drawer_code: { contains: search as string } },
          ],
        }),
        ...(submissionTypeId && {
          Debitur: { submissionTypeId: submissionTypeId as string },
        }),
        ...(productTypeId && {
          Product: {
            productTypeId: productTypeId as string,
          },
        }),
        ...(productId && { productId: productId as string }),
        ...(guarantee_status && {
          guarantee_status: guarantee_status === "true" ? true : false,
        }),
        ...(is_active && { is_active: is_active === "true" ? true : false }),
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
        Debitur: { include: { SubmissionType: true } },
        Product: {
          include: {
            ProductType: {
              include: {
                ProductTypeFile: true,
              },
            },
          },
        },
        User: true,
        Files: true,
        PermitFileDetail: true,
      },
      orderBy: { created_at: "desc" },
    });

    const total = await prisma.submission.count({
      where: {
        status: true,
        ...(search && {
          OR: [
            {
              Debitur: {
                OR: [
                  { fullname: { contains: search as string } },
                  { id: { contains: search as string } },
                  { nik: { contains: search as string } },
                  { cif: { contains: search as string } },
                ],
              },
            },
            { id: { contains: search as string } },
            { drawer_code: { contains: search as string } },
          ],
        }),
        ...(submissionTypeId && {
          Debitur: { submissionTypeId: submissionTypeId as string },
        }),
        ...(productTypeId && {
          Product: {
            productTypeId: productTypeId as string,
          },
        }),
        ...(productId && { productId: productId as string }),
        ...(guarantee_status && {
          guarantee_status: guarantee_status === "true" ? true : false,
        }),
        ...(is_active && { is_active: is_active === "true" ? true : false }),
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
      msg: "GET /submission",
      page,
      limit,
      search,
      productTypeId,
      productId,
      guarantee_status,
      is_active,
      backdate,
      data: data.map((d) => ({
        ...d,
        activities: JSON.parse(d.activities || "[]"),
        coments: JSON.parse(d.coments || "[]"),
      })),
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
    const { id, User, PermitFileDetail, Debitur, Product, Files, ...savedSub } =
      body;
    const genId = await generateId();
    const genDebId = await generateDebiturId();
    Debitur.id = Debitur.id ? Debitur.id : genDebId;
    const { SubmissionType, Visit, Submissions, ...savedeb } = Debitur;
    await prisma.$transaction(async (tx) => {
      const deb = await tx.debitur.upsert({
        where: { id: Debitur.id },
        update: savedeb,
        create: savedeb,
      });
      const sub = await tx.submission.create({
        data: {
          ...savedSub,
          id: body.id && body.id !== "" ? body.id : genId,
          debiturId: deb.id,
          coments: JSON.stringify(body.coments.filter((c: any) => c.comment)),
          activities: JSON.stringify(body.activities),
        },
      });
      for (const productTypeFile of Product.ProductType.ProductTypeFile) {
        if (productTypeFile.Files) {
          await tx.files.createMany({
            data: productTypeFile.Files.map((f: any) => ({
              ...f,
              productTypeFileId: productTypeFile.id,
              submissionId: sub.id,
            })),
          });
        }
      }
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
    const find = await prisma.submission.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    const { User, PermitFileDetail, Debitur, Product, Files, ...savedSub } =
      body;
    const { SubmissionType, Visit, Submissions, ...savedeb } = Debitur;

    await prisma.$transaction(async (tx) => {
      await tx.debitur.update({
        where: { id: Debitur.id as string },
        data: savedeb,
      });
      await tx.submission.update({
        where: { id: id as string },
        data: {
          ...savedSub,
          coments: JSON.stringify(savedSub.coments),
          activities: JSON.stringify(savedSub.activities),
        },
      });
      const incomingFileIds = Product.ProductType.ProductTypeFile.flatMap(
        (ptf: any) => (ptf.Files || []).map((f: any) => f.id),
      ).filter((fileId: any) => fileId); // pastikan ID tidak null/undefined

      // 2. Hapus file di database yang terkait dengan submission ini tapi TIDAK ADA di list kiriman frontend
      await tx.files.deleteMany({
        where: {
          submissionId: id as string,
          id: { notIn: incomingFileIds },
        },
      });
      for (const productTypeFile of Product.ProductType.ProductTypeFile) {
        if (productTypeFile.Files) {
          for (const file of productTypeFile.Files) {
            const { id: fileId, ...fileData } = file;

            await tx.files.upsert({
              where: { id: fileId || "" }, // Jika file baru, id biasanya kosong
              update: {
                ...fileData,
                submissionId: id as string,
                productTypeFileId: productTypeFile.id,
              },
              create: {
                ...fileData,
                id: fileId || undefined, // Biarkan prisma/db generate jika tidak ada
                submissionId: id as string,
                productTypeFileId: productTypeFile.id,
              },
            });
          }
        }
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
    const find = await prisma.submission.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.submission.update({
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
  try {
    if (!id) return ResponseServer(res, 404, { msg: "Not found data" });
    const find = await prisma.submission.findFirst({
      where: { id: id as string },
      include: {
        Debitur: true,
        Product: {
          include: {
            ProductType: {
              include: {
                ProductTypeFile: {
                  include: { Files: { where: { submissionId: id as string } } },
                },
              },
            },
          },
        },
        User: true,
        Files: true,
        PermitFileDetail: true,
      },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    find.coments = JSON.parse(find.coments || "[]");
    find.activities = JSON.parse(find.activities || "[]");
    return ResponseServer(res, 200, { msg: "OK", data: find });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

async function generateId() {
  const prefix = "SID";
  const padLength = 4;
  const lastRecord = await prisma.submission.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
async function generateDebiturId() {
  const prefix = "DEBT";
  const padLength = 4;
  const lastRecord = await prisma.debitur.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
