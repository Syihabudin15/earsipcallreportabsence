import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import { decode, signIn, comparaPassword } from "../../libs/auth.js";
import moment from "moment";

// MY INFO
export const GET = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return ResponseServer(res, 401, { msg: "Unauthorized" });
  const user = decode(token);
  if (!user) return ResponseServer(res, 401, { msg: "Unauthorized" });
  const find = await prisma.user.findFirst({
    where: { id: user.id, status: true },
    include: {
      Absence: {
        where: {
          check_in: {
            gte: moment().startOf("day").toDate(),
            lte: moment().endOf("day").toDate(),
          },
        },
      },
      Position: true,
      Role: true,
    },
  });
  if (!find) return ResponseServer(res, 401, { msg: "Unauthorized" });
  const tokens = await signIn(user);

  return ResponseServer(res, 200, { msg: "OK", data: find, token: tokens });
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
    include: {
      Role: true,
      Position: true,
      Absence: {
        where: {
          check_in: {
            gte: moment().startOf("day").toDate(),
            lte: moment().endOf("day").toDate(),
          },
        },
      },
    },
  });
  if (!find)
    return ResponseServer(res, 401, { msg: "Username atau password salah!" });

  // Verify password
  const isValidPassword = await comparaPassword(password, find.password);
  if (!isValidPassword) {
    return ResponseServer(res, 401, { msg: "Username atau password salah!" });
  }

  const tokens = await signIn({
    id: find.id,
    username: find.username,
    email: find.email,
    Role: { id: find.roleId },
  });

  return ResponseServer(res, 200, {
    msg: "Berhasil login",
    token: tokens,
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

// LOGOUT
export const DELETE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  return ResponseServer(res, 200, { msg: "Logged out successfully" });
};
