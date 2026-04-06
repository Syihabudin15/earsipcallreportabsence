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

    // Log activity for API calls (exclude auth endpoints to avoid spam)
    if (!req.path.includes("/auth/")) {
      await logActivity(
        user.id,
        `API_${req.method}`,
        `${req.method} ${req.path}`,
        req,
      );
    }

    next();
  } catch (error) {
    return ResponseServer(res, 401, { msg: "Unauthorized" });
  }
};

// Helper function to log activities
async function logActivity(
  userId: string,
  action: string,
  description: string,
  req: Request,
) {
  try {
    await prisma.logActivities.create({
      data: {
        userId,
        action,
        method: "API",
        status: "SUCCESS",
        ip: req.ip || req.connection.remoteAddress || "",
        userAgent: req.get("User-Agent") || "",
        payload: description,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
