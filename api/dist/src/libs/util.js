import {} from "express";
export const ResponseServer = async (res, status, response) => {
    return res.status(status).json({ ...response, status });
};
