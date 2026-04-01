import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, productTypeId } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const data = await prisma.product.findMany({
      where: {
        status: true,
        ...(search && { name: { contains: search as string } }),
        ...(productTypeId && { productTypeId: productTypeId as string }),
      },
      skip: skip,
      take: limit,
      include: { ProductType: { include: { ProductTypeFile: true } } },
      orderBy: { id: "asc" },
    });

    const total = await prisma.product.count({
      where: {
        status: true,
        ...(search && { name: { contains: search as string } }),
        ...(productTypeId && { productTypeId: productTypeId as string }),
      },
    });
    return ResponseServer(res, 200, {
      msg: "GET /product",
      page,
      limit,
      search,
      productTypeId,
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
    const genId = await generateId(body.productTypeId);
    const { id, ProductType, Submission, ...saved } = body;
    await prisma.product.create({
      data: {
        ...saved,
        id: body.id && body.id !== "" ? body.id : genId,
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
    const find = await prisma.product.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    const { ProductType, Submission, ...saved } = body;
    await prisma.product.update({
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
    const find = await prisma.product.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.product.update({
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

async function generateId(typeId: string) {
  const prefix = "P";
  const padLength = 2;
  const lastRecord = await prisma.product.count({
    where: { productTypeId: typeId },
  });
  return `${prefix}${typeId}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
