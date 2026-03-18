import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let {
    page = 1,
    limit = 50,
    search,
    productTypeId,
    productId,
    guarantee_status,
    is_active,
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
            { drawer_code: { contains: search as string } },
          ],
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
      },
      skip: skip,
      take: limit,
      include: {
        Debitur: true,
        Product: {
          include: { ProductType: { include: { ProductTypeFile: true } } },
        },
      },
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
            { drawer_code: { contains: search as string } },
          ],
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
    await prisma.submission.create({
      data: {
        id: body.id ? body.id : genId,
        ...body,
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
    const find = await prisma.submission.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.submission.update({
      where: { id: find.id },
      data: {
        ...body,
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

async function generateId() {
  const prefix = "P";
  const padLength = 2;
  const lastRecord = await prisma.submission.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
