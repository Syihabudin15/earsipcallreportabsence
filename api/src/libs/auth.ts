import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const secretkey = process.env.APP_JWT_SECRET || "default-secret-key";

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

  return accessToken;
};

export const comparaPassword = async (pass: string, has: string) => {
  const isPasswordValid = await bcrypt.compare(pass, has);
  return isPasswordValid;
};

export const encryptPassword = async (pass: string) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(pass, saltRounds);
  return hashedPassword;
};

export const decode = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, secretkey) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};
