import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
export const GET = async (req, res, next) => {
    try {
        const data = await prisma.absenceConfig.findFirst();
        return ResponseServer(res, 200, {
            msg: "GET /absence_config",
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
export const POST = async (req, res, next) => {
    let body = req.body;
    try {
        // Check if config already exists
        const existingConfig = await prisma.absenceConfig.findFirst();
        if (existingConfig) {
            return ResponseServer(res, 400, {
                msg: "Absence config sudah ada! Hanya boleh 1 config. Gunakan Edit untuk mengubahnya.",
            });
        }
        const data = await prisma.absenceConfig.create({
            data: {
                ...body,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        return ResponseServer(res, 200, {
            msg: "Data berhasil dibuat",
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
    let body = req.body;
    try {
        if (!id)
            return ResponseServer(res, 404, {
                msg: "ID Not found",
                params: req.params,
            });
        const find = await prisma.absenceConfig.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.absenceConfig.update({
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
    try {
        // Prevent deletion - only 1 config allowed
        return ResponseServer(res, 400, {
            msg: "Tidak dapat menghapus config! Absence config harus ada 1 untuk semua data. Gunakan Edit untuk mengubahnya.",
        });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
