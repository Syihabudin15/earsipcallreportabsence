import jwt from "jsonwebtoken";
import { ResponseServer } from "../libs/util.js";
import type { NextFunction, Request, Response } from "express";

export const middleware = (req: Request, res: Response, next: NextFunction) => {
  let token = req.headers.authorization?.split(" ")[1]; // Ambil token setelah kata 'Bearer'
  if (!token) return ResponseServer(res, 401, { msg: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.APP_JWT_SECRET);
    if (!decoded) ResponseServer(res, 401, { msg: "Unauthorized" });

    next();
  } catch (error) {
    return ResponseServer(res, 401, { msg: "Unauthorized" });
  }
};
