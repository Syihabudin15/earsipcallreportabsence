import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import { decode, signIn } from "../../libs/auth.js";

// MY INFO
export const GET = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return ResponseServer(res, 401, { msg: "Unauthorized" });

  const user = decode(token);
  if (!user) return ResponseServer(res, 401, { msg: "Unauthorized" });
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
    where: { username },
    include: { Role: true, Position: true },
  });
  if (!find)
    return ResponseServer(res, 401, { msg: "Username atau password salah!" });

  const token = await signIn(find);
  return ResponseServer(res, 200, { msg: "Berhasil login", token, data: find });
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
