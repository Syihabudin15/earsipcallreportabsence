import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type {
  EArsipStatus,
  EFlaggingStatus,
  EGuaranteeStatus,
  Prisma,
} from "@prisma/client";
import xlsx from "xlsx";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let {
    page = 1,
    limit = 50,
    search,
    productTypeId,
    productId,
    guarantee_status,
    doc_status,
    approve_status,
    flagging_status,
    backdate,
    submissionTypeId,
    mitraId,
    payOfficeId,
    insuranceId,
    guarantee_date,
    tbo_status,
  } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const queryWhere: Prisma.SubmissionWhereInput = {
      status: true,
      ...(search && {
        OR: [
          {
            Debitur: {
              OR: [
                { fullname: { contains: search as string } },
                { id: { contains: search as string } },
                { nik: { contains: search as string } },
                { cif: { contains: search as string } },
              ],
            },
          },
          { id: { contains: search as string } },
          { drawer_code: { contains: search as string } },
          { account_number: { contains: search as string } },
        ],
      }),
      ...(submissionTypeId && {
        Debitur: { submissionTypeId: submissionTypeId as string },
      }),
      ...(productTypeId && {
        Product: {
          productTypeId: productTypeId as string,
        },
      }),
      ...(productId && { productId: productId as string }),
      ...(mitraId && { mitraId: mitraId as string }),
      ...(payOfficeId && { payOfficeId: payOfficeId as string }),
      ...(insuranceId && { insuranceId: insuranceId as string }),
      ...(approve_status && {
        approve_status: approve_status as EArsipStatus,
      }),
      ...(flagging_status && {
        flagging_status: flagging_status as EFlaggingStatus,
      }),
      ...(guarantee_status && {
        guarantee_status: guarantee_status as EGuaranteeStatus,
      }),
      ...(doc_status && {
        doc_status: doc_status as EGuaranteeStatus,
      }),
      ...(backdate && {
        created_at: {
          gte: moment((backdate as string).split(",")[0])
            .startOf("day")
            .toDate(),
          lte: moment((backdate as string).split(",")[1])
            .endOf("day")
            .toDate(),
        },
      }),
      ...(guarantee_date && {
        guarantee_date: {
          gte: moment((guarantee_date as string).split(",")[0])
            .startOf("day")
            .toDate(),
          lte: moment((guarantee_date as string).split(",")[1])
            .endOf("day")
            .toDate(),
        },
      }),
      ...(tbo_status &&
        tbo_status === "DITERIMA" && {
          guarantee_status: { in: ["DIPINJAM", "DITERIMA"] },
          flagging_status: { not: "NON_PENSIUNAN" },
          guarantee_date: { not: null },
        }),
      ...(tbo_status &&
        tbo_status === "LEWAT TBO" && {
          guarantee_status: "PENDING",
          flagging_status: { not: "NON_PENSIUNAN" },
          guarantee_date: {
            lte: new Date(),
          },
        }),
      ...(tbo_status &&
        tbo_status === "MASA TBO" && {
          guarantee_status: "PENDING",
          flagging_status: { not: "NON_PENSIUNAN" },
          guarantee_date: {
            gt: new Date(),
          },
        }),
      ...(tbo_status &&
        tbo_status === "NOT SET" && {
          flagging_status: { not: "NON_PENSIUNAN" },
          guarantee_date: null,
        }),
      ...(req.user?.Role.data_status === "USER"
        ? { OR: [{ createdById: req.user.id }, { userId: req.user.id }] }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.submission.findMany({
        where: queryWhere,
        skip: skip,
        take: limit,
        include: {
          Debitur: { include: { SubmissionType: true } },
          Product: {
            include: {
              ProductType: {
                include: {
                  ProductTypeFile: true,
                },
              },
            },
          },
          User: true,
          Files: true,
          PermitFileDetail: true,
          Mitra: true,
          CollateralLending: true,
          PayOffice: true,
          Insurance: true,
        },
        orderBy: { created_at: "desc" },
      }),

      prisma.submission.count({
        where: queryWhere,
      }),
    ]);
    return ResponseServer(res, 200, {
      data: data.map((d) => ({
        ...d,
        activities: JSON.parse(d.activities || "[]"),
        coments: JSON.parse(d.coments || "[]"),
      })),
      total,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const POST = async (req: Request, res: Response, next: NextFunction) => {
  let body = req.body;
  try {
    const {
      id,
      User,
      PermitFileDetail,
      Debitur,
      Product,
      Files,
      Mitra,
      CollateralLending,
      CreatedBy,
      PayOffice,
      Insurance,
      ...savedSub
    } = body;
    const genId = await generateId();
    const genDebId = await generateDebiturId();
    Debitur.id = Debitur.id ? Debitur.id : genDebId;
    const { SubmissionType, Visit, Submission, ...savedeb } = Debitur;
    await prisma.$transaction(async (tx) => {
      const deb = await tx.debitur.upsert({
        where: { id: Debitur.id },
        update: savedeb,
        create: savedeb,
      });
      const sub = await tx.submission.create({
        data: {
          ...savedSub,
          id: body.id && body.id !== "" ? body.id : genId,
          debiturId: deb.id,
          coments: JSON.stringify(body.coments.filter((c: any) => c.comment)),
          activities: JSON.stringify(body.activities),
          createdById: req.user?.id,
        },
      });
      for (const productTypeFile of Product.ProductType.ProductTypeFile) {
        if (productTypeFile.Files) {
          await tx.files.createMany({
            data: productTypeFile.Files.map((f: any) => ({
              ...f,
              productTypeFileId: productTypeFile.id,
              submissionId: sub.id,
            })),
          });
        }
      }
      return true;
    });
    return ResponseServer(res, 200, { msg: "Data berhasil ditambahkan" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const PUT = async (req: Request, res: Response, next: NextFunction) => {
  let { id } = req.query;
  let body = req.body;

  try {
    if (!id)
      return ResponseServer(res, 404, {
        msg: "ID Not found",
        params: req.params,
      });
    const find = await prisma.submission.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    const {
      User,
      PermitFileDetail,
      Debitur,
      Product,
      Files,
      Mitra,
      CollateralLending,
      CreatedBy,
      PayOffice,
      Insurance,
      ...savedSub
    } = body;
    const { SubmissionType, Visit, Submission, ...savedeb } = Debitur;

    await prisma.$transaction(async (tx) => {
      await tx.debitur.update({
        where: { id: Debitur.id as string },
        data: savedeb,
      });
      await tx.submission.update({
        where: { id: id as string },
        data: {
          ...savedSub,
          coments: JSON.stringify(savedSub.coments),
          activities: JSON.stringify(savedSub.activities),
        },
      });
      for (const productTypeFile of Product.ProductType.ProductTypeFile) {
        if (productTypeFile.Files) {
          for (const file of productTypeFile.Files) {
            const { id: fileId, ...fileData } = file;

            await tx.files.upsert({
              where: { id: fileId, productTypeFileId: productTypeFile.id }, // Jika file baru, id biasanya kosong
              update: { name: fileData.name },
              create: {
                ...fileData,
                id: undefined,
              },
            });
          }
        }
      }
      return true;
    });

    return ResponseServer(res, 200, { msg: "Data berhasil dirubah" });
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
  let { id } = req.query;

  try {
    if (!id) return ResponseServer(res, 404, { msg: "Not found data" });
    const find = await prisma.submission.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.submission.update({
      where: { id: find.id },
      data: { status: false },
    });

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
  try {
    if (!id) return ResponseServer(res, 404, { msg: "Not found data" });
    const find = await prisma.submission.findFirst({
      where: { id: id as string },
      include: {
        Debitur: true,
        Product: {
          include: {
            ProductType: {
              include: {
                ProductTypeFile: {
                  include: { Files: { where: { submissionId: id as string } } },
                },
              },
            },
          },
        },
        User: true,
        Files: true,
        PermitFileDetail: true,
        Mitra: true,
        PayOffice: true,
        Insurance: true,
      },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    find.coments = JSON.parse(find.coments || "[]");
    find.activities = JSON.parse(find.activities || "[]");
    return ResponseServer(res, 200, { msg: "OK", data: find });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const IMPORT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Mohon unggah sebuah file!" });
    }

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      cellDates: true,
      dateNF: "dd/mm/yyyy",
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    if (!jsonData.length) {
      return res.status(200).json({
        message: "Tidak ada data untuk diimport.",
        total_data: 0,
      });
    }

    const normalize = (value: any) =>
      String(value ?? "")
        .trim()
        .toLowerCase();

    const text = (value: any) => String(value ?? "").trim();

    const number = (value: any) => {
      const cleaned = String(value ?? "0")
        .replace(/\./g, "")
        .replace(/,/g, ".");
      return Number(cleaned) || 0;
    };

    const parseDate = (value: any) => {
      if (!value) return new Date();

      if (value instanceof Date) return value;

      const parsed = moment(String(value).trim(), [
        "DD/MM/YYYY",
        "D/M/YYYY",
        "YYYY-MM-DD",
        "DD-MM-YYYY",
      ]);

      return parsed.isValid() ? parsed.toDate() : new Date();
    };

    const rows = jsonData
      .map((item: any) => ({
        jenis_pemohon: text(item.jenis_pemohon),
        tipe_produk: text(item.tipe_produk),
        produk: text(item.produk),
        cif: text(item.cif),
        nik: text(item.nik),
        nama_petugas: text(item.nama_petugas),
        nip_petugas: text(item.nip_petugas),
        nama: text(item.nama),
        tempat_lahir: text(item.tempat_lahir),
        tanggal_lahir: item.tanggal_lahir,
        alamat: text(item.alamat),
        no_telepon: text(item.no_telepon),
        email: text(item.email),
        nama_mitra: text(item.nama_mitra),
        kantor_bayar: text(item.kantor_bayar),
        asuransi: text(item.asuransi),
        nilai: number(item.nilai),
        tenor: number(item.tenor),
        no_lemari: text(item.no_lemari),
        tujuan_penggunaan: text(item.tujuan_penggunaan),
        status_nasabah: normalizeEnum(text(item.status_nasabah)) as any,
        status_dokumen: normalizeEnum(text(item.status_dokumen)) as any,
        status_jaminan: normalizeEnum(text(item.status_jaminan)) as any,
        status_flagging: normalizeEnum(text(item.status_flagging)) as any,
        no_rekening: text(item.no_rekening),
        tanggal_dibuat: item.tanggal_dibuat,
        guarantee_date: item.tgl_jatuh_tempo_jaminan,
      }))
      .filter((row) => row.nama && row.no_rekening);

    if (!rows.length) {
      return res.status(200).json({
        message: "Tidak ada data valid untuk diimport.",
        total_data: 0,
      });
    }

    const unique = (arr: string[]) =>
      Array.from(new Set(arr.filter((v) => v && v !== "-")));

    const jenisPemohonNames = unique(rows.map((r) => r.jenis_pemohon));
    const productTypeNames = unique(rows.map((r) => r.tipe_produk));
    const productNames = unique(rows.map((r) => r.produk));
    const userNames = unique(rows.map((r) => r.nama_petugas));
    const userNips = unique(rows.map((r) => r.nip_petugas));
    const debiturCifs = unique(rows.map((r) => r.cif));
    const debiturNiks = unique(rows.map((r) => r.nik));
    const mitraNames = unique(rows.map((r) => r.nama_mitra));
    const payOfficeNames = unique(rows.map((r) => r.kantor_bayar));
    const insuranceNames = unique(rows.map((r) => r.asuransi));
    const accountNumbers = unique(rows.map((r) => r.no_rekening));

    const [
      existingSubmissionTypes,
      existingProductTypes,
      existingProducts,
      existingUsers,
      existingDebitur,
      existingMitras,
      existingPayOffices,
      existingInsurances,
      existingSubmissions,
    ] = await Promise.all([
      prisma.submissionType.findMany({
        where: { name: { in: jenisPemohonNames } },
      }),
      prisma.productType.findMany({
        where: { name: { in: productTypeNames } },
      }),
      prisma.product.findMany({
        where: { name: { in: productNames } },
      }),
      prisma.user.findMany({
        where: {
          OR: [{ fullname: { in: userNames } }, { nip: { in: userNips } }],
        },
      }),
      prisma.debitur.findMany({
        where: {
          OR: [{ cif: { in: debiturCifs } }, { nik: { in: debiturNiks } }],
        },
      }),
      prisma.mitra.findMany({
        where: { name: { in: mitraNames } },
      }),
      prisma.payOffice.findMany({
        where: { name: { in: payOfficeNames } },
      }),
      prisma.insurance.findMany({
        where: { name: { in: insuranceNames } },
      }),
      prisma.submission.findMany({
        where: { account_number: { in: accountNumbers } },
        select: { id: true, account_number: true },
      }),
    ]);

    const submissionTypeMap = new Map(
      existingSubmissionTypes.map((item) => [normalize(item.name), item]),
    );

    const productTypeMap = new Map(
      existingProductTypes.map((item) => [normalize(item.name), item]),
    );

    const productMap = new Map(
      existingProducts.map((item) => [normalize(item.name), item]),
    );

    const userMapByName = new Map(
      existingUsers.map((item) => [normalize(item.fullname), item]),
    );

    const userMapByNip = new Map(
      existingUsers.map((item) => [normalize(item.nip), item]),
    );

    const debiturMapByCif = new Map(
      existingDebitur.map((item) => [normalize(item.cif), item]),
    );

    const debiturMapByNik = new Map(
      existingDebitur.map((item) => [normalize(item.nik), item]),
    );

    const mitraMap = new Map(
      existingMitras.map((item) => [normalize(item.name), item]),
    );

    const payOfficeMap = new Map(
      existingPayOffices.map((item) => [normalize(item.name), item]),
    );

    const insuranceMap = new Map(
      existingInsurances.map((item) => [normalize(item.name), item]),
    );

    const existingAccountSet = new Set(
      existingSubmissions.map((item) => normalize(item.account_number)),
    );

    const validRows = rows.filter(
      (row) => !existingAccountSet.has(normalize(row.no_rekening)),
    );

    if (!validRows.length) {
      return res.status(200).json({
        message: "Semua nomor rekening sudah ada. Tidak ada data baru.",
        total_data: jsonData.length,
        inserted_data: 0,
      });
    }

    await prisma.$transaction(
      async (tx) => {
        for (const name of jenisPemohonNames) {
          const key = normalize(name);
          if (!submissionTypeMap.has(key)) {
            // const id = await generateSubTypeId();
            const created = await tx.submissionType.create({
              data: { name },
            });
            submissionTypeMap.set(key, created);
          }
        }

        for (const name of productTypeNames) {
          const key = normalize(name);
          if (!productTypeMap.has(key)) {
            // const id = await generateProdTypeId();
            const created = await tx.productType.create({
              data: { name },
            });
            productTypeMap.set(key, created);
          }
        }

        for (const row of validRows) {
          const key = normalize(row.produk);
          if (!productMap.has(key)) {
            const productType = productTypeMap.get(normalize(row.tipe_produk));
            if (!productType) continue;

            const created = await tx.product.create({
              data: {
                name: row.produk,
                productTypeId: productType.id,
              },
            });

            productMap.set(key, created);
          }
        }

        for (const row of validRows) {
          const nameKey = normalize(row.nama_petugas);
          const nipKey = normalize(row.nip_petugas);

          const existingUser =
            userMapByNip.get(nipKey) || userMapByName.get(nameKey);

          if (!existingUser && row.nama_petugas) {
            // const id = await generateUsrId();

            const created = await tx.user.create({
              data: {
                // id,
                fullname: row.nama_petugas,
                nip: row.nip_petugas || null,
                username: normalize(row.nama_petugas).replace(/\s+/g, "."),
                password: normalize(row.nama_petugas),
                salary: 0,
                absen_method: "BUTTON",
                ptkp: "TK/0",
                roleId: "RL01",
                // positionId: "POS02",
              },
            });

            userMapByName.set(nameKey, created);
            userMapByNip.set(nipKey, created);
          }
        }

        for (const row of validRows) {
          const key = normalize(row.nama_mitra);
          if (row.nama_mitra && !mitraMap.has(key)) {
            // const id = await generateMitraId();
            const created = await tx.mitra.create({
              data: {
                // id,
                name: row.nama_mitra,
              },
            });
            mitraMap.set(key, created);
          }
        }

        for (const row of validRows) {
          const key = normalize(row.kantor_bayar);
          if (row.kantor_bayar && !payOfficeMap.has(key)) {
            // const id = await generateKbyId();
            const created = await tx.payOffice.create({
              data: {
                // id,
                name: row.kantor_bayar,
              },
            });
            payOfficeMap.set(key, created);
          }
        }

        for (const row of validRows) {
          const key = normalize(row.asuransi);
          if (row.asuransi && !insuranceMap.has(key)) {
            // const id = await generateInscId();
            const created = await tx.insurance.create({
              data: {
                // id,
                name: row.asuransi,
              },
            });
            insuranceMap.set(key, created);
          }
        }

        for (const row of validRows) {
          const cifKey = normalize(row.cif);
          const nikKey = normalize(row.nik);

          const existingDebt =
            debiturMapByCif.get(cifKey) || debiturMapByNik.get(nikKey);

          if (!existingDebt) {
            // const id = await generateDebiturId();

            const created = await tx.debitur.create({
              data: {
                // id,
                cif: row.cif,
                nik: row.nik,
                fullname: row.nama,
                birthplace: row.tempat_lahir,
                birthdate: parseDate(row.tanggal_lahir),
                address: row.alamat,
                phone: row.no_telepon,
                email: row.email,
                submissionTypeId:
                  submissionTypeMap.get(normalize(row.jenis_pemohon))?.id || "",
              },
            });

            debiturMapByCif.set(cifKey, created);
            debiturMapByNik.set(nikKey, created);
          }
        }

        const submissionData: any[] = [];

        let nextSubmissionNumber = await prisma.submission.count({});

        for (const row of validRows) {
          const accountKey = normalize(row.no_rekening);

          if (existingAccountSet.has(accountKey)) continue;

          const usr =
            userMapByNip.get(normalize(row.nip_petugas)) ||
            userMapByName.get(normalize(row.nama_petugas));

          const debt =
            debiturMapByCif.get(normalize(row.cif)) ||
            debiturMapByNik.get(normalize(row.nik));

          const mitra = mitraMap.get(normalize(row.nama_mitra));
          const payOffice = payOfficeMap.get(normalize(row.kantor_bayar));
          const insur = insuranceMap.get(normalize(row.asuransi));
          const product = productMap.get(normalize(row.produk));

          if (!usr || !debt || !product) {
            console.log("SKIP ROW:", {
              rekening: row.no_rekening,
              usr: !!usr,
              debt: !!debt,
              product: !!product,
              nama_petugas: row.nama_petugas,
              produk: row.produk,
              cif: row.cif,
              nik: row.nik,
            });
            continue;
          }

          nextSubmissionNumber++;

          const id = `SID${String(nextSubmissionNumber).padStart(4, "0")}`;

          submissionData.push({
            id,
            debiturId: debt.id,
            mitraId: mitra?.id || null,
            insuranceId: insur?.id || null,
            payOfficeId: payOffice?.id || null,
            value: row.nilai,
            tenor: row.tenor,
            productId: product.id,
            userId: usr.id,
            createdById: usr.id,
            drawer_code: row.no_lemari || "-",
            purpose: row.tujuan_penggunaan || "-",
            approve_status: row.status_nasabah,
            doc_status: row.status_dokumen,
            guarantee_status: row.status_jaminan,
            flagging_status: row.status_flagging,
            account_number: row.no_rekening || "-",
            created_at: parseDate(row.tanggal_dibuat),
            guarantee_date: row.guarantee_date
              ? parseDate(row.guarantee_date)
              : null,
          });

          existingAccountSet.add(accountKey);
        }

        if (submissionData.length > 0) {
          const chunkSize = 500;

          for (let i = 0; i < submissionData.length; i += chunkSize) {
            await tx.submission.createMany({
              data: submissionData.slice(i, i + chunkSize),
              skipDuplicates: true,
            });
          }
        }
      },
      {
        timeout: 60000 * 10,
      },
    );

    return res.status(200).json({
      message: "Data berhasil diimport!",
      total_data: jsonData.length,
      inserted_data: validRows.length,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

async function generateId() {
  const prefix = "SID";
  const padLength = 4;
  const lastRecord = await prisma.submission.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
async function generateDebiturId() {
  const prefix = "DEBT";
  const padLength = 4;
  const lastRecord = await prisma.debitur.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
const normalizeEnum = (value: any) => {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");
};
// async function generateSubTypeId() {
//   const prefix = "STYPE";
//   const padLength = 2;
//   const lastRecord = await prisma.submissionType.count({});
//   return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
// }

// async function generateProdTypeId() {
//   const prefix = "PTYPE";
//   const padLength = 2;
//   const lastRecord = await prisma.productType.count({});
//   return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
// }

// async function generateUsrId() {
//   const prefix = "USR";
//   const padLength = 3;
//   const lastRecord = await prisma.user.count({});
//   return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
// }

// async function generateMitraId() {
//   const prefix = "MITRA";
//   const padLength = 2;
//   const lastRecord = await prisma.mitra.count();
//   return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
// }

// async function generateKbyId() {
//   const prefix = "PAYOF";
//   const padLength = 2;
//   const lastRecord = await prisma.payOffice.count();
//   return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
// }

// async function generateInscId() {
//   const prefix = "INSC";
//   const padLength = 2;
//   const lastRecord = await prisma.insurance.count();
//   return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
// }
