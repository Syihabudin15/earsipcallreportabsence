import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../libs/util.js";
import prisma from "../libs/prisma.js";

export const MainDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const [submissionType, productType, visitCategory, visitStatus] =
    await prisma.$transaction([
      prisma.submissionType.findMany({
        where: { status: true },
        include: { Debitur: true },
      }),
      prisma.productType.findMany({
        where: { status: true },
        include: {
          Product: { include: { Submission: true } },
        },
      }),
      prisma.visitCategory.findMany({
        where: { status: true },
        include: { Visit: true },
      }),
      prisma.visitStatus.findMany({
        where: { status: true },
        include: { Visit: true },
      }),
    ]);
  return ResponseServer(res, 200, {
    submissionType,
    productType,
    visitCategory,
    visitStatus,
  });
};
