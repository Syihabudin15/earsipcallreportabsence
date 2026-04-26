import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import { getContainerClient } from "../../libs/azure.js";
import { decode } from "../../libs/auth.js";
const folderName = process.env.AZURE_STORAGE_CONTAINER_FOLDER || "earsip";
const containerClient = getContainerClient();
export const POST = async (req, res, next) => {
    const file = req.file;
    try {
        if (!file)
            return ResponseServer(res, 400, { msg: "File not found" });
        if (!containerClient) {
            return ResponseServer(res, 500, {
                msg: "File upload not configured. Please configure Azure Storage or implement local file storage.",
            });
        }
        const blockBlobClient = containerClient.getBlockBlobClient(`${folderName}/${file.originalname}`);
        await blockBlobClient.uploadData(req.file?.buffer, {
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
        // If all checks passed, proceed with deletion
        const urlParts = publicId.split("/").slice(4);
        const blobName = decodeURIComponent(urlParts.join("/"));
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.deleteIfExists();
        if (id) {
            await prisma.files.delete({ where: { id: id } });
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
export const PATCH = async (req, res, next) => {
    const { id, allow_download } = req.query;
    await prisma.files.update({
        where: { id: id },
        data: {
            allow_download: allow_download
                .split(",")
                .filter((al) => al !== req.user?.id)
                .join(", "),
        },
    });
    return ResponseServer(res, 200, { msg: "OK" });
};
