import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, backdate, status_come, gBookTypeId, } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const where = {
            status: true,
            ...(status_come && { status_come: status_come }),
            ...(gBookTypeId && { gBookTypeId: gBookTypeId }),
            ...(backdate && {
                OR: [
                    {
                        created_at: {
                            gte: moment(backdate)
                                .startOf("day")
                                .toDate(),
                            lte: moment(backdate)
                                .endOf("day")
                                .toDate(),
                        },
                    },
                    {
                        date: {
                            gte: moment(backdate)
                                .startOf("day")
                                .toDate(),
                            lte: moment(backdate)
                                .endOf("day")
                                .toDate(),
                        },
                    },
                ],
            }),
            ...(search && {
                OR: [
                    { name: { contains: search } },
                    { description: { contains: search } },
                    { GBookType: { name: { contains: search } } },
                    {
                        Participant: {
                            some: {
                                OR: [
                                    { name: { contains: search } },
                                    { phone: { contains: search } },
                                    { email: { contains: search } },
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
        const { id, Participant, GBookType, ...saved } = body;
        const data = await prisma.guestBook.create({
            data: {
                ...saved,
                ...(Participant.length > 0 && {
                    Participant: {
                        create: Participant.map((p) => ({
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
    const { Participant, GBookType, ...saved } = req.body;
    try {
        if (!id)
            return ResponseServer(res, 404, {
                msg: "ID Not found",
                params: req.params,
            });
        const find = await prisma.guestBook.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.$transaction(async (tx) => {
            await tx.guestBook.update({ where: { id: find.id }, data: { ...saved } });
            await tx.participant.deleteMany({ where: { guestBookId: find.id } });
            await tx.participant.createMany({
                data: Participant.map((p) => ({
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
        const find = await prisma.guestBook.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.guestBook.update({
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
