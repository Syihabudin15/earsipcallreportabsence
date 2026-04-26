import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const secretkey = process.env.APP_JWT_SECRET || "default-secret-key";
export const signIn = async (user) => {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        roleId: user.roleId,
    };
    // Access token expires in 1 hour
    const accessToken = jwt.sign(payload, secretkey, { expiresIn: "1h" });
    return accessToken;
};
export const comparaPassword = async (pass, has) => {
    const isPasswordValid = await bcrypt.compare(pass, has);
    return isPasswordValid;
};
export const encryptPassword = async (pass) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(pass, saltRounds);
    return hashedPassword;
};
export const decode = (token) => {
    try {
        const decoded = jwt.verify(token, secretkey);
        return decoded;
    }
    catch (error) {
        return null;
    }
};
