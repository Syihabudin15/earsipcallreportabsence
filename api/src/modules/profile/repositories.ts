import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import { comparaPassword, encryptPassword } from "../../libs/auth.js";
export const POST = async (req: Request, res: Response, next: NextFunction) => {
  let body = req.body;
  const { currentPassword, newPassword, confirmNewPassword, id } = body;
  try {
    const find = await prisma.user.findUnique({
      where: { id },
    });
    if (!find) {
      return ResponseServer(res, 404, { msg: "User tidak ditemukan" });
    }
    if (newPassword !== confirmNewPassword) {
      return ResponseServer(res, 400, {
        msg: "Konfirmasi password tidak cocok",
      });
    }
    const verify = await comparaPassword(currentPassword, find.password);
    if (!verify) {
      return ResponseServer(res, 400, { msg: "Password saat ini salah" });
    }

    const hashed = await encryptPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashed,
        updated_at: new Date(),
      },
    });

    return ResponseServer(res, 200, { msg: "Data berhasil diubah" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const UPDATE_FACE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { face } = req.body;
  const userId = (req as any).user?.id; // Assuming user is set by auth middleware

  if (!userId) {
    return ResponseServer(res, 401, { msg: "Unauthorized" });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { face, updated_at: new Date() },
    });

    return ResponseServer(res, 200, { msg: "Face data berhasil diupdate" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
