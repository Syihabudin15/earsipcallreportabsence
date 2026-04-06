import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const secretkey = process.env.APP_JWT_SECRET || "default-secret-key";
const refreshSecretKey =
  process.env.APP_JWT_REFRESH_SECRET || "default-refresh-secret-key";

export interface TokenPayload {
  id: string;
  username: string;
  email?: string;
  roleId?: string;
  iat?: number;
  exp?: number;
}

export const signIn = async (user: any) => {
  const payload: TokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    roleId: user.roleId,
  };

  // Access token expires in 1 hour
  const accessToken = jwt.sign(payload, secretkey, { expiresIn: "1h" });

  // Refresh token expires in 7 days
  const refreshToken = jwt.sign({ id: user.id }, refreshSecretKey, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, refreshSecretKey) as {
      id: string;
    };

    // Get user data
    const { PrismaClient } = await import("../libs/prisma.js");
    const prisma = new PrismaClient();

    const user = await prisma.user.findFirst({
      where: { id: decoded.id, status: true },
      include: { Role: true, Position: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    await prisma.$disconnect();

    // Generate new access token
    const payload: TokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
    };

    const newAccessToken = jwt.sign(payload, secretkey, { expiresIn: "1h" });

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

export const comparaPassword = async (pass: string, has: string) => {
  const isPasswordValid = await bcrypt.compare(pass, has);
  return isPasswordValid;
};

export const decode = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, secretkey) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, refreshSecretKey);
    return decoded;
  } catch (error) {
    return null;
  }
};
