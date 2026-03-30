import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import strict from "node:assert/strict";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, backdate, permit_status, action, } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const data = await prisma.permitFile.findMany({
            where: {
                status: true,
                ...(search && {
                    OR: [
                        { id: { contains: search } },
                        {
                            PermitFileDetail: {
                                some: {
                                    Submission: {
                                        OR: [
                                            { id: { contains: search } },
                                            {
                                                Debitur: {
                                                    OR: [
                                                        { id: { contains: search } },
                                                        { fullname: { contains: search } },
                                                        { nik: { contains: search } },
                                                        { cif: { contains: search } },
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
                ...(permit_status && { permit_status: permit_status }),
                ...(backdate && {
                    created_at: {
                        gte: moment(backdate.split(",")[0])
                            .startOf("date")
                            .toDate(),
                        lte: moment(backdate.split(",")[1])
                            .endOf("day")
                            .toDate(),
                    },
                }),
                ...(action && { action: action }),
            },
            skip: skip,
            take: limit,
            include: {
                PermitFileDetail: {
                    include: {
                        Submission: { include: { Debitur: true } },
                    },
                },
            },
        });
        const total = await prisma.permitFile.count({
            where: {
                status: true,
                ...(search && {
                    OR: [
                        { id: { contains: search } },
                        {
                            PermitFileDetail: {
                                some: {
                                    Submission: {
                                        OR: [
                                            { id: { contains: search } },
                                            {
                                                Debitur: {
                                                    OR: [
                                                        { id: { contains: search } },
                                                        { fullname: { contains: search } },
                                                        { nik: { contains: search } },
                                                        { cif: { contains: search } },
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
                ...(permit_status && { permit_status: permit_status }),
                ...(backdate && {
                    created_at: {
                        gte: moment(backdate.split(",")[0])
                            .startOf("date")
                            .toDate(),
                        lte: moment(backdate.split(",")[1])
                            .endOf("day")
                            .toDate(),
                    },
                }),
                ...(action && { action: action }),
            },
        });
        return ResponseServer(res, 200, {
            msg: "GET /submission",
            page,
            limit,
            search,
            backdate,
            action,
            permit_status,
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
        const { id, PermitFileDetail, Requester, Approver, ...savedSub } = body;
        const genId = await generateId();
        await prisma.$transaction(async (tx) => {
            const pfile = await tx.permitFile.create({
                data: { ...savedSub, id: id && id !== "" ? id : genId },
            });
            await tx.permitFileDetail.createMany({
                data: PermitFileDetail.map((pfd) => ({
                    ...pfd,
                    permitFileId: pfile.id,
                })),
            });
            return true;
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
        const find = await prisma.permitFile.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const { id: idPermit, PermitFileDetail, Requester, Approver, ...savedSub } = body;
        await prisma.$transaction(async (tx) => {
            const saved = await tx.permitFile.update({
                where: { id: find.id },
                data: savedSub,
            });
            await tx.permitFileDetail.deleteMany({
                where: { permitFileId: saved.id },
            });
            await tx.permitFileDetail.createMany({
                data: PermitFileDetail.map((pfd) => ({
                    ...pfd,
                    permitFileId: pfd.id,
                })),
            });
            return true;
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
        const find = await prisma.permitFile.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.permitFile.update({
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
    let { id, action, userId } = req.query;
    try {
        if (!id)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const find = await prisma.permitFile.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        if (action === "APPROVED") {
            switch (find.action) {
            }
        }
        else {
            await prisma.permitFile.update({
                where: { id: id },
                data: {
                    permit_status: action,
                    approverId: userId,
                    process_at: new Date(),
                },
            });
        }
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
async function generateId() {
    const prefix = "P";
    const padLength = 2;
    const lastRecord = await prisma.submission.count({});
    return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
