import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import { getContainerClient } from "../../libs/azure.js";
import { decode } from "../../libs/auth.js";

const folderName = process.env.AZURE_STORAGE_CONTAINER_FOLDER || "earsip";
const containerClient = getContainerClient();

export const POST = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as any;

  try {
    if (!file) return ResponseServer(res, 400, { msg: "File not found" });

    if (!containerClient) {
      return ResponseServer(res, 500, {
        msg: "File upload not configured. Please configure Azure Storage or implement local file storage.",
      });
    }

    const blockBlobClient = containerClient.getBlockBlobClient(
      `${folderName}/${file.originalname}`,
    );

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
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const DELETE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let { id, publicId } = req.query;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  try {
    if (!publicId) return ResponseServer(res, 404, { msg: "Not found data" });

    // Decode user dari token
    const decodedUser = await decode(token);
    if (!decodedUser) {
      return ResponseServer(res, 401, { msg: "Unauthorized" });
    }

    if (id) {
      const fileRecord = await prisma.files.findFirst({
        where: { id: id as string },
        include: { Submission: true },
      });

      if (!fileRecord) {
        return ResponseServer(res, 404, { msg: "File not found" });
      }

      // Check if user has approved DELETE permit for this submission
      if (fileRecord.submissionId) {
        const hasApprovedDeletePermit = await prisma.permitFile.findFirst({
          where: {
            action: "DELETE",
            permit_status: "APPROVED",
            PermitFileDetail: {
              some: {
                submissionId: fileRecord.submissionId,
              },
            },
          },
        });

        if (!hasApprovedDeletePermit) {
          return ResponseServer(res, 403, {
            msg: "Anda tidak memiliki izin untuk menghapus file ini. Buat permohonan penghapusan terlebih dahulu.",
          });
        }

        // Log delete activity to submission
        const submission = await prisma.submission.findFirst({
          where: { id: fileRecord.submissionId },
        });

        if (submission) {
          let activities = [];
          try {
            activities = JSON.parse(submission.activities || "[]");
          } catch (e) {
            activities = [];
          }

          activities.push({
            name: decodedUser.fullname || decodedUser.username || "Unknown",
            date: new Date(),
            activities: `Delete File: ${fileRecord.name}`,
          });

          await prisma.submission.update({
            where: { id: submission.id },
            data: {
              activities: JSON.stringify(activities),
            },
          });
        }
      }
    }

    // If all checks passed, proceed with deletion
    const urlParts = (publicId as string).split("/").slice(4);
    const blobName = decodeURIComponent(urlParts.join("/"));
    const blockBlobClient = containerClient.getBlockBlobClient(blobName!);
    await blockBlobClient.deleteIfExists();

    if (id) {
      await prisma.files.delete({ where: { id: id as string } });
    }

    return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const PATCH = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let { id } = req.query;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  try {
    if (!id) return ResponseServer(res, 404, { msg: "File ID not found" });

    // Decode user dari token
    const decodedUser = await decode(token);
    if (!decodedUser) {
      return ResponseServer(res, 401, { msg: "Unauthorized" });
    }

    const fileRecord = await prisma.files.findFirst({
      where: { id: id as string },
    });

    if (!fileRecord) {
      return ResponseServer(res, 404, { msg: "File not found" });
    }

    // Remove user from allow_download list (one-time download)
    const allowDownloadList = fileRecord.allow_download
      .split(",")
      .map((userId) => userId.trim())
      .filter((userId) => userId && userId !== decodedUser.id);

    await prisma.files.update({
      where: { id: id as string },
      data: {
        allow_download: allowDownloadList.join(","),
      },
    });

    // Log download activity to submission
    if (fileRecord.submissionId) {
      const submission = await prisma.submission.findFirst({
        where: { id: fileRecord.submissionId },
      });

      if (submission) {
        let activities = [];
        try {
          activities = JSON.parse(submission.activities || "[]");
        } catch (e) {
          activities = [];
        }

        activities.push({
          name: decodedUser.fullname || decodedUser.username || "Unknown",
          date: new Date(),
          activities: `Download File: ${fileRecord.name}`,
        });

        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            activities: JSON.stringify(activities),
          },
        });
      }
    }

    return ResponseServer(res, 200, {
      msg: "File berhasil diunduh. Untuk mengunduh lagi, silakan ajukan permohonan baru.",
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
