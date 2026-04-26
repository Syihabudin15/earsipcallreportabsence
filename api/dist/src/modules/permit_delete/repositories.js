import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import strict from "node:assert/strict";
import { decode } from "../../libs/auth.js";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, backdate, permit_status } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const querywhere = {
            status: true,
            action: "DELETE",
            ...(permit_status && { permit_status: permit_status }),
            ...(backdate && {
                created_at: {
                    gte: moment(backdate.split(",")[0])
                        .startOf("date")
                        .toDate(),
                    lte: moment(backdate.split(",")[1])
                        .endOf("date")
                        .toDate(),
                },
            }),
            ...(req.user?.Role.data_status === "USER" && {
                requesterId: req.user.id,
            }),
            ...(search && {
                OR: [
                    { id: { contains: search } },
                    {
                        PermitFileDetail: {
                            some: {
                                Submission: {
                                    OR: [
                                        { id: { contains: search } },
                                        { account_number: { contains: search } },
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
        const { id, PermitFileDetail = [], Requester, Approver, ...savedSub } = body;
        const genId = await generateId();
        await prisma.$transaction(async (tx) => {
            const pfile = await tx.permitFile.create({
                data: {
                    ...savedSub,
                    id: id && id !== "" ? id : genId,
                    requesterId: req.user?.id,
                },
            });
            await Promise.all(PermitFileDetail.map((pfd) => tx.permitFileDetail.create({
                data: {
                    permitFileId: pfile.id, // Menghubungkan ke PermitFile
                    submissionId: pfd.submissionId, // Menghubungkan ke Submission
                    Files: {
                        connect: pfd.Files.map((file) => ({
                            id: file.id, // Menghubungkan ke Files (Many-to-Many)
                        })),
                    },
                },
            })));
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
        const { id: idPermit, PermitFileDetail = [], Requester, Approver, ...savedSub } = body;
        await prisma.$transaction(async (tx) => {
            const saved = await tx.permitFile.update({
                where: { id: find.id },
                data: savedSub,
            });
            await tx.permitFileDetail.deleteMany({
                where: { permitFileId: saved.id },
            });
            await Promise.all(PermitFileDetail.map((pfd) => tx.permitFileDetail.create({
                data: {
                    permitFileId: saved.id, // Menghubungkan ke PermitFile
                    submissionId: pfd.submissionId, // Menghubungkan ke Submission
                    Files: {
                        connect: pfd.Files.map((file) => ({
                            id: file.id, // Menghubungkan ke Files (Many-to-Many)
                        })),
                    },
                },
            })));
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
    let { id, action } = req.query;
    try {
        if (!id)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const find = await prisma.permitFile.findFirst({
            where: { id: id },
            include: {
                PermitFileDetail: {
                    include: { Files: true },
                },
            },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        // If approving a DELETE permit, delete file
        await prisma.$transaction(find.PermitFileDetail.flatMap((f) => f.Files).map((f) => prisma.files.update({
            where: { id: f.id },
            data: { submissionId: null },
        })));
        await prisma.permitFile.update({
            where: { id: id },
            data: {
                permit_status: action,
                approverId: req.user?.id || "",
                process_at: new Date(),
            },
        });
        return ResponseServer(res, 200, {
            msg: `Permohonan berhasil ${action === "APPROVED" ? "disetujui" : "ditolak"}`,
        });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
async function generateId() {
    const prefix = "PRMTH";
    const padLength = 3;
    const lastRecord = await prisma.permitFile.count({});
    return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
