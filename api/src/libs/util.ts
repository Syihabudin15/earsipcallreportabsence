import { type Response } from "express";

export const ResponseServer = async (
  res: Response,
  status: number,
  response: any,
) => {
  return res.status(status).json({ ...response, status });
};
