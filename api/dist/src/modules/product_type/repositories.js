import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const data = await prisma.productType.findMany({
            where: {
                status: true,
                ...(search && { name: { contains: search } }),
            },
            skip: skip,
            take: limit,
            include: { ProductTypeFile: true, Product: true },
        });
        const total = await prisma.productType.count({
            where: {
                status: true,
                ...(search && { name: { contains: search } }),
            },
        });
        return ResponseServer(res, 200, {
            msg: "GET /product_type",
            page,
            limit,
            search,
            data,
            total,
        });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
export const POST = async (req, res, next) => {
    let body = req.body;
    try {
        const { id, ProductTypeFile, Product, ...savedProductType } = body;
        const genId = await generateId();
        const saved = await prisma.productType.create({
            data: {
                ...savedProductType,
                id: body.id && body.id !== "" ? body.id : genId,
            },
        });
        if (ProductTypeFile.length !== 0) {
            await prisma.productTypeFile.createMany({
                data: ProductTypeFile.map((p) => {
                    const { Files, ...pFile } = p;
                    return { ...pFile, productTypeId: saved.id };
                }),
            });
        }
        if (Product.length !== 0) {
            await prisma.product.createMany({
                data: Product.map((p) => {
                    const { Submission, ...prod } = p;
                    return { ...prod, productTypeId: saved.id };
                }),
            });
        }
        return ResponseServer(res, 200, { msg: "Data berhasil ditambahkan" });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
export const PUT = async (req, res, next) => {
    let { id } = req.query;
    let body = req.body;
    try {
        if (!id)
            return ResponseServer(res, 404, {
                msg: "ID Not found",
                params: req.params,
            });
        const find = await prisma.productType.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const { ProductTypeFile, Product, ...savedProductType } = body;
        const saved = await prisma.productType.update({
            where: { id: find.id },
            data: {
                ...savedProductType,
                updated_at: new Date(),
            },
        });
        if (savedProductType.length !== 0) {
            for (const p of ProductTypeFile) {
                const { Files, ...pFiles } = p;
                await prisma.productTypeFile.upsert({
                    where: { id: p.id },
                    update: { ...pFiles, productTypeId: saved.id },
                    create: { ...pFiles, productTypeId: saved.id },
                });
            }
        }
        if (Product.length !== 0) {
            for (const p of Product) {
                await prisma.product.upsert({
                    where: { id: p.id },
                    create: { ...p, productTypeId: saved.id },
                    update: { ...p, productTypeId: saved.id },
                });
            }
        }
        return ResponseServer(res, 200, { msg: "Data berhasil dirubah" });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
export const DELETE = async (req, res, next) => {
    let { id } = req.query;
    try {
        if (!id)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const find = await prisma.productType.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.productType.update({
            where: { id: find.id },
            data: { status: false },
        });
        return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
export const PATCH = async (req, res, next) => {
    const { id } = req.query;
    if (!id)
        return ResponseServer(res, 404, { msg: "Not found data" });
    try {
        const find = await prisma.productType.findFirst({
            where: { id: id },
            include: { ProductTypeFile: true, Product: true },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        return ResponseServer(res, 200, { msg: "OK", data: find });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
async function generateId() {
    const prefix = "PTYPE";
    const padLength = 2;
    const lastRecord = await prisma.productType.count({});
    return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
