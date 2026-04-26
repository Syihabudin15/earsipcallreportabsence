import { ResponseServer } from "../libs/util.js";
import prisma from "../libs/prisma.js";
import { decode } from "../libs/auth.js";
export const middleware = async (req, res, next) => {
    let token = req.headers.authorization?.split(" ")[1]; // Ambil token setelah kata 'Bearer'
    if (!token)
        return ResponseServer(res, 401, { msg: "Unauthorized" });
    try {
        const decoded = decode(token);
        if (!decoded)
            return ResponseServer(res, 401, { msg: "Unauthorized" });
        // Get user from database
        const user = await prisma.user.findFirst({
            where: { id: decoded.id, status: true },
            include: { Role: true },
        });
        if (!user)
            return ResponseServer(res, 401, { msg: "User not found" });
        req.user = user;
        req.userId = user.id;
        // Intercept response to capture status
        const originalJson = res.json;
        let statusCode = res.statusCode;
        res.json = function (body) {
            statusCode = res.statusCode;
            if (!req.path.includes("/auth/") && req.method !== "GET") {
                logActivity(user.id, req.baseUrl + " " + req.method, statusCode >= 200 && statusCode < 300 ? "SUCCESS" : "FAILURE", req).catch((error) => console.error("Failed to log activity:", error));
            }
            return originalJson.call(this, body);
        };
        next();
    }
    catch (error) {
        return ResponseServer(res, 401, { msg: "Unauthorized" });
    }
};
// Helper function to log activities
async function logActivity(userId, method, status, req) {
    try {
        await prisma.logActivities.create({
            data: {
                userId,
                method,
                status,
                ip: req.ip || req.connection.remoteAddress || "",
                userAgent: req.get("User-Agent") || "",
            },
        });
    }
    catch (error) {
        console.error("Failed to log activity:", error);
    }
}
