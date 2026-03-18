import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const secretkey = process.env.APP_JWT_SECRET;
export const signIn = async (user) => {
    const token = jwt.sign(user, secretkey, { expiresIn: "15h" });
    return token;
};
export const comparaPassword = async (pass, has) => {
    const isPasswordValid = await bcrypt.compare(pass, has);
    return isPasswordValid;
};
export const decode = (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
};
