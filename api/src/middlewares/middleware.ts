import { ResponseServer } from "../libs/util.js";
import type { NextFunction, Request, Response } from "express";
import prisma from "../libs/prisma.js";
import { decode } from "../libs/auth.js";

export const middleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token = req.headers.authorization?.split(" ")[1]; // Ambil token setelah kata 'Bearer'
  if (!token) return ResponseServer(res, 401, { msg: "Unauthorized" });

  try {
    const decoded = decode(token);
    if (!decoded) return ResponseServer(res, 401, { msg: "Unauthorized" });

    // Get user from database
    const user = await prisma.user.findFirst({
      where: { id: decoded.id, status: true },
    });

    if (!user) return ResponseServer(res, 401, { msg: "User not found" });

    (req as any).user = user;
    (req as any).userId = user.id;

    // Intercept response to capture status
    const originalJson = res.json;
    let statusCode = res.statusCode;

    res.json = function (body: any) {
      statusCode = res.statusCode;

      // Log activity for API calls (exclude auth endpoints to avoid spam)
      if (!req.path.includes("/auth/")) {
        logActivity(
          user.id,
          req.path,
          req.method,
          statusCode >= 200 && statusCode < 300 ? "SUCCESS" : "FAILURE",
          req,
        ).catch((error) => console.error("Failed to log activity:", error));
      }

      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    return ResponseServer(res, 401, { msg: "Unauthorized" });
  }
};

// Helper function to log activities
async function logActivity(
  userId: string,
  action: string,
  method: string,
  status: string,
  req: Request,
) {
  try {
    await prisma.logActivities.create({
      data: {
        userId,
        action,
        method,
        status,
        ip: req.ip || req.connection.remoteAddress || "",
        userAgent: req.get("User-Agent") || "",
        payload: "",
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
