import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, startDate, endDate } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const where = {
            ...(startDate &&
                endDate && {
                created_at: {
                    gte: moment(startDate)
                        .startOf("day")
                        .toDate(),
                    lte: moment(endDate)
                        .endOf("day")
                        .toDate(),
                },
            }),
            ...(search && {
                OR: [
                    { method: { contains: search } },
                    {
                        User: {
                            OR: [
                                { fullname: { contains: search } },
                                { username: { contains: search } },
                                { id: { contains: search } },
                                { nik: { contains: search } },
                                { nip: { contains: search } },
                            ],
                        },
                    },
                ],
            }),
            ...(req.user?.Role.data_status && { userId: req.user.id }),
        };
        const [data, total] = await Promise.all([
            prisma.logActivities.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: { User: true },
            }),
            prisma.logActivities.count({ where }),
        ]);
        return ResponseServer(res, 200, {
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
