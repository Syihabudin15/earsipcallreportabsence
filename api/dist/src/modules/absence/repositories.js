import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, date } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const data = await prisma.user.findMany({
            where: {
                status: true,
                ...(search && {
                    OR: [
                        { fullname: { contains: search } },
                        { nik: { contains: search } },
                        { nip: { contains: search } },
                        { email: { contains: search } },
                        { phone: { contains: search } },
                        { id: { contains: search } },
                    ],
                }),
            },
            skip: skip,
            take: limit,
            include: {
                Absence: {
                    include: { PermitAbsence: true },
                    where: {
                        ...(date && {
                            check_in: {
                                gte: moment(date)
                                    .startOf("day")
                                    .toDate(),
                                lte: moment(date)
                                    .endOf("day")
                                    .toDate(),
                            },
                        }),
                    },
                },
            },
        });
        const total = await prisma.user.count({
            where: {
                status: true,
                ...(search && {
                    OR: [
                        { fullname: { contains: search } },
                        { nik: { contains: search } },
                        { nip: { contains: search } },
                        { email: { contains: search } },
                        { phone: { contains: search } },
                        { id: { contains: search } },
                    ],
                }),
            },
        });
        return ResponseServer(res, 200, {
            msg: "GET /absence",
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
        const { id, ...saved } = body;
        await prisma.absence.create({
            data: { ...saved, check_in: new Date() },
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
    let body = req.body;
    try {
        if (!id)
            return ResponseServer(res, 404, {
                msg: "ID Not found",
                params: req.params,
            });
        const find = await prisma.absence.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.absence.update({
            where: { id: find.id },
            data: {
                ...body,
                updated_at: new Date(),
            },
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
        const find = await prisma.absence.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.$transaction(async (tx) => {
            await tx.permitAbsence.deleteMany({ where: { absenceId: find.id } });
            await tx.absence.delete({ where: { id: find.id } });
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
