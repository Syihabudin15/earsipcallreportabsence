import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import { decode } from "../../libs/auth.js";
import moment from "moment";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, status, backdate } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const querywhere = {
            status: true,
            ...(status && {
                return_at: status === "DIPINJAM" ? null : { not: null },
            }),
            ...(search && {
                OR: [
                    { id: { contains: search } },
                    {
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
                ],
            }),
            ...(req.user?.Role.data_status === "USER" && {
                createdById: req.user.id,
            }),
            ...(backdate && {
                start_at: {
                    gte: moment(backdate.split(",")[0])
                        .startOf("date")
                        .toDate(),
                    lte: moment(backdate.split(",")[1])
                        .endOf("day")
                        .toDate(),
                },
            }),
        };
        const data = await prisma.collateralLending.findMany({
            where: querywhere,
            include: {
                Submission: {
                    include: {
                        Debitur: true,
                        Product: { include: { ProductType: true } },
                    },
                },
                CreatedBy: true,
                ApproverBy: true,
            },
            orderBy: { created_at: "desc" },
            take: limit,
            skip: skip,
        });
        const total = await prisma.collateralLending.count({
            where: querywhere,
        });
        return ResponseServer(res, 200, {
            msg: "Data Peminjaman Jaminan berhasil diambil",
            page,
            limit,
            search,
            data,
            total,
        });
    }
    catch (error) {
        console.log(error);
        return ResponseServer(res, 500, {
            msg: "Gagal mengambil data",
            error,
        });
    }
};
export const POST = async (req, res, next) => {
    const { submissionId, description, start_at, return_at, end_at, file } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    const user = decode(token);
    try {
        await prisma.$transaction(async (tx) => {
            await tx.collateralLending.create({
                data: {
                    submissionId,
                    description,
                    start_at: new Date(start_at),
                    end_at: new Date(end_at),
                    return_at: return_at ? new Date(return_at) : undefined,
                    file,
                    createdById: user?.id,
                },
                include: {
                    Submission: true,
                    CreatedBy: true,
                },
            });
            await tx.submission.update({
                where: { id: submissionId },
                data: { guarantee_status: "DIPINJAM" },
            });
            return true;
        });
        return ResponseServer(res, 201, {
            msg: "Peminjaman Jaminan berhasil dibuat",
        });
    }
    catch (error) {
        console.log(error);
        return ResponseServer(res, 500, {
            msg: "Gagal membuat Peminjaman Jaminan",
            error,
        });
    }
};
export const PUT = async (req, res, next) => {
    const { id } = req.query;
    const { description, start_at, return_at, end_at, approverById, submissionId, file, } = req.body;
    try {
        await prisma.$transaction(async (tx) => {
            await tx.collateralLending.update({
                where: { id: id },
                data: {
                    ...(description && { description }),
                    ...(start_at && { start_at: new Date(start_at) }),
                    ...(return_at && { return_at: new Date(return_at) }),
                    ...(end_at && { end_at: new Date(end_at) }),
                    ...(approverById && { approverById }),
                    ...(file && { file }),
                },
                include: {
                    Submission: true,
                    CreatedBy: true,
                    ApproverBy: true,
                },
            });
            await tx.submission.update({
                where: { id: submissionId },
                data: { guarantee_status: return_at ? "DITERIMA" : "DIPINJAM" },
            });
        });
        return ResponseServer(res, 200, {
            msg: "Peminjaman Jaminan berhasil diperbarui",
        });
    }
    catch (error) {
        console.log(error);
        return ResponseServer(res, 500, {
            msg: "Gagal memperbarui Peminjaman Jaminan",
            error,
        });
    }
};
export const DELETE = async (req, res, next) => {
    const { id } = req.query;
    try {
        await prisma.collateralLending.update({
            where: { id: id },
            data: { status: false },
        });
        return ResponseServer(res, 200, {
            msg: "Peminjaman Jaminan berhasil dihapus",
        });
    }
    catch (error) {
        console.log(error);
        return ResponseServer(res, 500, {
            msg: "Gagal menghapus Peminjaman Jaminan",
            error,
        });
    }
};
export const PATCH = async (req, res, next) => {
    const { id } = req.query;
    try {
        const collateral = await prisma.collateralLending.findFirst({
            where: { id: id },
            include: {
                Submission: true,
                CreatedBy: true,
                ApproverBy: true,
            },
        });
        return ResponseServer(res, 200, {
            msg: "OK",
            data: collateral,
        });
    }
    catch (error) {
        console.log(error);
        return ResponseServer(res, 500, {
            msg: "Gagal memperbarui persetujuan",
            error,
        });
    }
};
