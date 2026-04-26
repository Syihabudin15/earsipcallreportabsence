import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const where = {
            status: true,
            ...(search && {
                OR: [
                    { name: { contains: search } },
                    { description: { contains: search } },
                ],
            }),
        };
        const data = await prisma.gBookType.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
        });
        const total = await prisma.gBookType.count({ where });
        return ResponseServer(res, 200, {
            msg: "GET /gbook_type",
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
    const body = req.body;
    try {
        await prisma.gBookType.create({
            data: { ...body, id: body.id ? body.id : await generateId() },
        });
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
    const body = req.body;
    try {
        if (!id)
            return ResponseServer(res, 404, {
                msg: "ID Not found",
                params: req.params,
            });
        const find = await prisma.gBookType.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.gBookType.update({
            where: { id: find.id },
            data: { ...body, updated_at: new Date() },
        });
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
        const find = await prisma.gBookType.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.gBookType.update({
            where: { id: find.id },
            data: { status: false, updated_at: new Date() },
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
async function generateId() {
    const prefix = "GTYPE";
    const padLength = 2;
    const lastRecord = await prisma.gBookType.count({});
    return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
