import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, productTypeId, productId, guarantee_status, is_active, backdate, } = req.query;
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
                                    { fullname: { contains: search } },
                                    { id: { contains: search } },
                                    { nik: { contains: search } },
                                    { cif: { contains: search } },
                                ],
                            },
                        },
                        { id: { contains: search } },
                        { drawer_code: { contains: search } },
                    ],
                }),
                ...(productTypeId && {
                    Product: {
                        productTypeId: productTypeId,
                    },
                }),
                ...(productId && { productId: productId }),
                ...(guarantee_status && {
                    guarantee_status: guarantee_status === "true" ? true : false,
                }),
                ...(is_active && { is_active: is_active === "true" ? true : false }),
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
            },
            skip: skip,
            take: limit,
            include: {
                Debitur: { include: { SubmissionType: true } },
                Product: {
                    include: {
                        ProductType: {
                            include: { ProductTypeFile: { include: { Files: true } } },
                        },
                    },
                },
                User: true,
                Files: true,
                PermitFileDetail: true,
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
                                    { fullname: { contains: search } },
                                    { id: { contains: search } },
                                    { nik: { contains: search } },
                                    { cif: { contains: search } },
                                ],
                            },
                        },
                        { id: { contains: search } },
                        { drawer_code: { contains: search } },
                    ],
                }),
                ...(productTypeId && {
                    Product: {
                        productTypeId: productTypeId,
                    },
                }),
                ...(productId && { productId: productId }),
                ...(guarantee_status && {
                    guarantee_status: guarantee_status === "true" ? true : false,
                }),
                ...(is_active && { is_active: is_active === "true" ? true : false }),
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
                coments: JSON.parse(d.coments),
            })),
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
        const { id, User, PermitFileDetail, Debitur, Product, Files, ...savedSub } = body;
        const genId = await generateId();
        const genDebId = await generateDebiturId();
        Debitur.id = Debitur.id ? Debitur.id : genDebId;
        const { SubmissionType, ...savedeb } = Debitur;
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
                    coments: JSON.stringify(body.coments.filter((c) => c.comment)),
                    activities: JSON.stringify(body.activities),
                },
            });
            for (const productTypeFile of Product.ProductType.ProductTypeFile) {
                if (productTypeFile.Files) {
                    await tx.files.createMany({
                        data: productTypeFile.Files.map((f) => ({
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
        const find = await prisma.submission.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const { User, PermitFileDetail, Debitur, Product, Files, ...savedSub } = body;
        const { SubmissionType, ...savedeb } = Debitur;
        await prisma.$transaction(async (tx) => {
            await tx.debitur.update({
                where: { id: Debitur.id },
                data: savedeb,
            });
            await tx.submission.update({
                where: { id: id },
                data: {
                    ...savedSub,
                    coments: JSON.stringify(savedSub.coments),
                    activities: JSON.stringify(savedSub.activities),
                },
            });
            for (const productTypeFile of Product.ProductType.ProductTypeFile) {
                if (productTypeFile.Files) {
                    for (const files of productTypeFile.Files) {
                        const ffile = await tx.files.findFirst({ where: { id: files.id } });
                        if (!ffile) {
                            const { id: filesId, ...saveFile } = files;
                            await tx.files.create({
                                data: {
                                    ...saveFile,
                                    submissionId: id,
                                    productTypeFileId: productTypeFile.id,
                                },
                            });
                        }
                        else {
                            await tx.files.update({ where: { id: ffile.id }, data: files });
                        }
                    }
                }
            }
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
        const find = await prisma.submission.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.submission.update({
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
    let { id } = req.query;
    try {
        if (!id)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const find = await prisma.submission.findFirst({
            where: { id: id },
            include: {
                Debitur: true,
                Product: {
                    include: {
                        ProductType: {
                            include: { ProductTypeFile: { include: { Files: true } } },
                        },
                    },
                },
                User: true,
                Files: true,
                PermitFileDetail: true,
            },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        find.coments = JSON.parse(find.coments);
        find.activities = JSON.parse(find.activities);
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
