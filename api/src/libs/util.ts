import { type Response } from "express";

const isPrismaDecimal = (value: any): boolean => {
  return (
    value &&
    typeof value === "object" &&
    typeof value.toNumber === "function" &&
    typeof value.toString === "function"
  );
};

const normalizePrismaValues = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(normalizePrismaValues);
  }

  if (isPrismaDecimal(value)) {
    const numberValue = value.toNumber();
    return Number.isFinite(numberValue)
      ? numberValue
      : value.toString();
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      normalized[key] = normalizePrismaValues(value[key]);
    }
    return normalized;
  }

  return value;
};

export const ResponseServer = async (
  res: Response,
  status: number,
  response: any,
) => {
  return res.status(status).json(normalizePrismaValues({ ...response, status }));
};
