import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import { getContainerClient } from "../../libs/azure.js";
const folderName = process.env.AZURE_STORAGE_CONTAINER_FOLDER || "earsip";
const containerClient = getContainerClient();
export const POST = async (req, res, next) => {
    const file = req.file;
    try {
        if (!file)
            return ResponseServer(res, 400, { msg: "File not found" });
        const blockBlobClient = containerClient.getBlockBlobClient(`${folderName}/${file.originalname}`);
        await blockBlobClient.uploadData(req.file.buffer, {
            blobHTTPHeaders: {
                blobContentType: file.mimetype, // Penting agar PDF bisa langsung terbuka di browser
            },
        });
        const uploadedUrl = blockBlobClient.url;
        return ResponseServer(res, 200, {
            msg: "File berhasil di upload",
            url: uploadedUrl,
        });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
export const DELETE = async (req, res, next) => {
    let { id, publicId } = req.query;
    try {
        if (!publicId)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const urlParts = publicId.split("/").slice(4); // ["testing", "file.pdf"]
        const blobName = decodeURIComponent(urlParts.join("/")); // "testing/file.pdf"
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.deleteIfExists();
        if (id) {
            const find = await prisma.files.findFirst({
                where: { id: id },
            });
            if (!find)
                return ResponseServer(res, 404, { msg: "Not found data" });
            await prisma.files.delete({ where: { id: find.id } });
        }
        return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
