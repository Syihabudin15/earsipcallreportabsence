import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import {
  decode,
  signIn,
  refreshAccessToken,
  comparaPassword,
} from "../../libs/auth.js";

// MY INFO
export const GET = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return ResponseServer(res, 401, { msg: "Unauthorized" });

  const user = decode(token);
  if (!user) return ResponseServer(res, 401, { msg: "Unauthorized" });

  // Log activity
  await logActivity(user.id, "VIEW_PROFILE", "User viewed their profile");

  return ResponseServer(res, 200, { msg: "OK", data: user });
};

// LOGIN
export const POST = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  if (!username || !password)
    return ResponseServer(res, 401, {
      msg: "Mohon isi username dan password!",
    });

  const find = await prisma.user.findFirst({
    where: { username, status: true },
    include: { Role: true, Position: true },
  });
  if (!find)
    return ResponseServer(res, 401, { msg: "Username atau password salah!" });

  // Verify password
  const isValidPassword = await comparaPassword(password, find.password);
  if (!isValidPassword) {
    await logActivity(find.id, "LOGIN_FAILED", "Failed login attempt");
    return ResponseServer(res, 401, { msg: "Username atau password salah!" });
  }

  const tokens = await signIn(find);

  // Log successful login
  await logActivity(find.id, "LOGIN", "User logged in successfully");

  return ResponseServer(res, 200, {
    msg: "Berhasil login",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    data: find,
  });
};

// USER INFO
export const PATCH = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  if (!id) return ResponseServer(res, 400, { msg: "Not found" });
  const find = await prisma.user.findFirst({
    where: { id: id as string },
    include: {
      Absence: true,
      Position: true,
      Role: true,
      UserCost: true,
    },
  });
  if (!find) return ResponseServer(res, 400, { msg: "Not found" });

  return ResponseServer(res, 200, { msg: "OK", data: find });
};

// REFRESH TOKEN
export const PUT = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return ResponseServer(res, 400, { msg: "Refresh token required" });

  try {
    const tokens = await refreshAccessToken(refreshToken);
    return ResponseServer(res, 200, {
      msg: "Token refreshed",
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    return ResponseServer(res, 401, { msg: "Invalid refresh token" });
  }
};

// LOGOUT
export const DELETE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    const user = decode(token);
    if (user) {
      await logActivity(user.id, "LOGOUT", "User logged out");
    }
  }

  return ResponseServer(res, 200, { msg: "Logged out successfully" });
};

// Helper function to log activities
async function logActivity(
  userId: string,
  action: string,
  description: string,
) {
  try {
    await prisma.logActivities.create({
      data: {
        userId,
        action,
        method: "AUTH",
        status: "SUCCESS",
        ip: "", // Will be filled by middleware if needed
        userAgent: "",
        payload: description,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
