import { useState, useEffect } from "react";
import {
  DatePicker,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Spin,
  message,
  Space,
  Progress,
  Tabs,
  Button,
} from "antd";
import {
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileExcelOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import api from "../../libs/api";
import ExcelJS from "exceljs";
import moment from "moment";
import { printKredit } from "../utils/pdfs/kredit";
import type { IBilling } from "../../libs/interface";

const { Title, Text } = Typography;
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

export default function LaporanKredit() {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [woData, setWoData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalPlafond: 0,
    totalOs: 0,
    totalValue: 0,
    totalRealize: 0,
    totalPartial: 0,
    totalTunggakan: 0,
    nplPercentage: 0,
    collectionRate: 0,
    totalLar: 0,
    larPercentage: 0,
    debs: 0,
    debspay: 0,
    debspartial: 0,
  });

  // Fetch data dari API berdasarkan bulan yang dipilih
  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/billing/laporan?month=${selectedMonth ? selectedMonth : moment().toDate()}`;
      const response = await api.get(apiUrl);

      if (response.status === 200) {
        const data = response.data.data;
        setDashboardData(data);
        calculateSummary(data);
        const tagihan = response.data.billings;
        const wo = response.data.billings.filter(
          (t: IBilling) =>
            (t.col || "1") === "6" && t.bill_status !== "BELUMBAYAR",
        );
        setWoData(wo);
        const last12Months = Array.from({ length: 12 })
          .map((_, i) => moment().subtract(i, "months").format("YYYY-MM"))
          .reverse();

        const monthlyMap: Record<
          string,
          { Tagihan: number; Pembayaran: number; "Pembayaran NPL": number }
        > = {};

        last12Months.forEach((month) => {
          monthlyMap[month] = {
            Tagihan: 0,
            Pembayaran: 0,
            "Pembayaran NPL": 0,
          };
        });

        tagihan.forEach((b: IBilling) => {
          const monthKey = moment(b.bill_date || new Date()).format("YYYY-MM");
          if (!monthlyMap[monthKey]) return;

          monthlyMap[monthKey].Tagihan += b.value || 0;
          monthlyMap[monthKey].Pembayaran += b.realize_value || 0;

          if (isNpl(b)) {
            monthlyMap[monthKey]["Pembayaran NPL"] += b.realize_value || 0;
          }
        });
        setTrendData(
          last12Months.map((month) => ({
            date: moment(month, "YYYY-MM").format("MMM YYYY"),
            Tagihan: monthlyMap[month].Tagihan,
            Pembayaran: monthlyMap[month].Pembayaran,
            "Pembayaran NPL": monthlyMap[month]["Pembayaran NPL"],
          })),
        );
      }
    } catch (error) {
      console.error(error);
      message.error("Gagal mengambil data laporan billing.");
    } finally {
      setLoading(false);
    }
  };

  const getKol = (bill: any): number => {
    return Number(
      bill.col ??
        bill.kol ??
        bill.kolektibilitas ??
        bill.collectibility ??
        bill.Submission?.col ??
        bill.Submission?.kol ??
        1,
    );
  };

  const getAoName = (bill: any): string => {
    // AO pada model Billing adalah relasi User: Billing.User
    // Jadi prioritas utama harus bill.User, bukan Submission.User.
    return (
      bill.User?.fullname ||
      bill.User?.name ||
      bill.User?.username ||
      bill.User?.email ||
      bill.user?.fullname ||
      bill.user?.name ||
      bill.user?.username ||
      bill.user?.email ||
      "Tanpa AO"
    );
  };

  const isLar = (bill: any): boolean => {
    const kol = getKol(bill);
    return kol >= 2 && kol <= 5;
  };

  const isNpl = (bill: any): boolean => {
    const kol = getKol(bill);
    return kol >= 3 && kol <= 5;
  };

  const getNplPaymentData = () => {
    const rows: any[] = [];

    dashboardData.forEach((mitra) => {
      mitra.Billing?.filter((b: any) => b.bill_status !== "BELUMBAYAR").forEach(
        (bill: any) => {
          if (!isNpl(bill)) return;

          const pembayaran = bill.realize_value || 0;
          const tagihan = bill.value || 0;

          rows.push({
            tanggal: bill.realize_date || bill.bill_date,
            noLoan: bill.Submission.account_number,
            debitur: bill.Submission.Debitur.fullname,
            instansi: bill.Submission.Mitra.name,
            ao: getAoName(bill),
            pembayaran,
            tagihan,
            status: bill.bill_status,
          });
        },
      );
    });

    rows.sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
    );

    return rows;
  };

  // Hitung agregasi data untuk komponen Summary Cards
  const calculateSummary = (data: any[]) => {
    let plafond = 0;
    let totalOs = 0;
    let value = 0;
    let realize = 0;
    let realizepartial = 0;
    let totalTunggakan = 0;
    let debpay = 0;
    let debpartial = 0;
    let debs = 0;

    let totalLar = 0;
    let totalNpl = 0;

    data.forEach((mitra) => {
      mitra.Billing?.forEach((bill: IBilling) => {
        const sisaPokok = bill.pkk || 0;

        plafond += bill.plafond || 0;
        totalOs += sisaPokok;
        value += bill.value || 0;
        totalTunggakan += (bill.tung_pkk || 0) + (bill.tung_bga || 0);
        if (bill.bill_status === "BAYAR") {
          realize += bill.realize_value || 0;
          debpay += 1;
        }
        if (bill.bill_status === "PARTIAL") {
          realizepartial += bill.realize_value || 0;
          debpartial += 1;
        }
        debs += 1;

        // LAR = Kol 2 sampai Kol 5
        if (isLar(bill)) {
          totalLar += sisaPokok;
        }

        // NPL Gross = Kol 3 sampai Kol 5
        if (isNpl(bill)) {
          totalNpl += sisaPokok;
        }
      });
    });

    const npl = totalOs > 0 ? (totalNpl / totalOs) * 100 : 0;
    const lar = totalOs > 0 ? (totalLar / totalOs) * 100 : 0;
    const collection = value > 0 ? (realize / value) * 100 : 0;

    setSummary({
      totalPlafond: plafond,
      totalOs,
      totalValue: value,
      totalRealize: realize,
      totalTunggakan,
      nplPercentage: parseFloat(npl.toFixed(2)),
      collectionRate: parseFloat(collection.toFixed(2)),
      totalLar,
      larPercentage: parseFloat(lar.toFixed(2)),
      totalPartial: realizepartial,
      debs: debs,
      debspartial: debpartial,
      debspay: debpay,
    });
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // Format Mata Uang Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // ==========================================
  // DATA PREPARATION FOR TABLES & EXCEL
  // ==========================================
  const getInstansiBaseData = () => {
    return dashboardData.map((mitra, index) => {
      let deb = 0;
      let plafondDisalurkan = 0;
      let sisaPokok = 0;
      let angsuran = 0;
      let tunggakanPokok = 0;
      let totalTunggakan = 0;
      let larValue = 0;
      let nplValue = 0;

      mitra.Billing?.forEach((bill: any) => {
        const os = bill.pkk || 0;

        deb += 1;
        plafondDisalurkan += bill.plafond || 0;
        sisaPokok += os;
        angsuran += bill.value || 0;
        tunggakanPokok += bill.tung_pkk || 0;
        totalTunggakan += (bill.tung_pkk || 0) + (bill.tung_bga || 0);

        if (isLar(bill)) {
          larValue += os;
        }

        if (isNpl(bill)) {
          nplValue += os;
        }
      });

      const nplGross = sisaPokok > 0 ? (nplValue / sisaPokok) * 100 : 0;
      const larRatio = sisaPokok > 0 ? (larValue / sisaPokok) * 100 : 0;

      return {
        no: index + 1,
        instansi: mitra.name || "Tanpa Nama",
        code: mitra.code || "-",
        deb,
        plafondDisalurkan,
        sisaPokok,
        angsuran,
        realisasi:
          mitra.Billing?.reduce(
            (acc: number, b: any) => acc + (b.realize_value || 0),
            0,
          ) || 0,
        tunggakanPokok,
        totalTunggakan,
        larValue,
        nplValue,
        nplGross: parseFloat(nplGross.toFixed(2)),
        larRatio: parseFloat(larRatio.toFixed(2)),
      };
    });
  };

  const getSegmentasiBaseData = () => {
    const segmentMap: { [key: string]: any } = {};
    let noIdx = 1;

    dashboardData.forEach((mitra) => {
      mitra.Billing?.forEach((bill: any) => {
        const segName = bill.Submission?.Product?.name || "Non Keagenan";
        const os = bill.pkk || 0;

        if (!segmentMap[segName]) {
          segmentMap[segName] = {
            no: noIdx++,
            segmen: segName,
            deb: 0,
            plafondDisalurkan: 0,
            sisaPokok: 0,
            angsuran: 0,
            tunggakanPokok: 0,
            totalTunggakan: 0,
            larValue: 0,
            nplValue: 0,
          };
        }

        segmentMap[segName].deb += 1;
        segmentMap[segName].plafondDisalurkan += bill.plafond || 0;
        segmentMap[segName].sisaPokok += os;
        segmentMap[segName].angsuran += bill.value || 0;
        segmentMap[segName].tunggakanPokok += bill.tung_pkk || 0;
        segmentMap[segName].totalTunggakan +=
          (bill.tung_pkk || 0) + (bill.tung_bga || 0);

        if (isLar(bill)) {
          segmentMap[segName].larValue += os;
        }

        if (isNpl(bill)) {
          segmentMap[segName].nplValue += os;
        }
      });
    });

    return Object.values(segmentMap).map((item: any) => {
      const nplGross =
        item.sisaPokok > 0 ? (item.nplValue / item.sisaPokok) * 100 : 0;

      const larRatio =
        item.sisaPokok > 0 ? (item.larValue / item.sisaPokok) * 100 : 0;

      return {
        ...item,
        nplGross: parseFloat(nplGross.toFixed(2)),
        larRatio: parseFloat(larRatio.toFixed(2)),
      };
    });
  };

  const createEmptyKolItem = () => ({
    deb: 0,
    plafondDisalurkan: 0,
    sisaPokok: 0,
    angsuran: 0,
    realisasi: 0,
    tunggakanPokok: 0,
    totalTunggakan: 0,
    larValue: 0,
    nplValue: 0,
  });

  const addBillToKolItem = (item: any, bill: any) => {
    const os = bill.pkk || 0;

    item.deb += 1;
    item.plafondDisalurkan += bill.plafond || 0;
    item.sisaPokok += os;
    item.angsuran += bill.value || 0;
    item.realisasi += bill.realize_value || 0;
    item.tunggakanPokok += bill.tung_pkk || 0;
    item.totalTunggakan += (bill.tung_pkk || 0) + (bill.tung_bga || 0);

    if (isLar(bill)) item.larValue += os;
    if (isNpl(bill)) item.nplValue += os;
  };

  const finalizeKolItem = (item: any, totalOsKredit = 0) => {
    const larRatio =
      item.sisaPokok > 0 ? (item.larValue / item.sisaPokok) * 100 : 0;

    // NPL Instansi = pembagi OS kelompok / instansi masing-masing
    const nplInstansi =
      item.sisaPokok > 0 ? (item.nplValue / item.sisaPokok) * 100 : 0;

    // NPL Gross = pembagi total OS kredit seluruh laporan
    const nplGross =
      totalOsKredit > 0 ? (item.nplValue / totalOsKredit) * 100 : 0;

    return {
      ...item,
      larRatio: parseFloat(larRatio.toFixed(2)),
      nplInstansi: parseFloat(nplInstansi.toFixed(2)),
      nplGross: parseFloat(nplGross.toFixed(2)),
    };
  };

  const getTotalOsKredit = () => {
    return dashboardData.reduce((total: number, mitra: any) => {
      return (
        total +
        (mitra.Billing?.reduce(
          (acc: number, bill: any) => acc + (bill.pkk || 0),
          0,
        ) || 0)
      );
    }, 0);
  };

  const getInstansiKolektibilitasData = () => {
    const totalOsKredit = getTotalOsKredit();
    return dashboardData.flatMap((mitra, index) => {
      const kolMap: Record<number, any> = {};
      const total = createEmptyKolItem();

      mitra.Billing?.forEach((bill: any) => {
        const rawKol = getKol(bill);
        const kol = rawKol >= 1 && rawKol <= 5 ? rawKol : 1;

        if (!kolMap[kol]) kolMap[kol] = createEmptyKolItem();
        addBillToKolItem(kolMap[kol], bill);
        addBillToKolItem(total, bill);
      });

      const detailRows = Object.entries(kolMap)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([kol, item], rowIndex) => ({
          ...finalizeKolItem(item, item.sisaPokok),
          rowType: "detail",
          no: rowIndex === 0 ? index + 1 : "",
          instansi: rowIndex === 0 ? mitra.name || "Tanpa Nama" : "",
          code: mitra.code || "-",
          kol: Number(kol),
        }));

      if (detailRows.length === 0) return [];

      return [
        ...detailRows,
        {
          ...finalizeKolItem(total, totalOsKredit),
          rowType: "subtotal",
          no: "",
          instansi: "",
          code: mitra.code || "-",
          kol: "",
        },
      ];
    });
  };

  const getSegmentasiKolektibilitasData = () => {
    const segmentMap: Record<string, any> = {};
    let noIdx = 1;

    dashboardData.forEach((mitra) => {
      mitra.Billing?.forEach((bill: any) => {
        const segName = bill.Submission?.Product?.name || "Non Keagenan";
        const rawKol = getKol(bill);
        const kol = rawKol >= 1 && rawKol <= 5 ? rawKol : 1;

        if (!segmentMap[segName]) {
          segmentMap[segName] = {
            no: noIdx++,
            segmen: segName,
            kolMap: {},
            total: createEmptyKolItem(),
          };
        }

        if (!segmentMap[segName].kolMap[kol]) {
          segmentMap[segName].kolMap[kol] = createEmptyKolItem();
        }

        addBillToKolItem(segmentMap[segName].kolMap[kol], bill);
        addBillToKolItem(segmentMap[segName].total, bill);
      });
    });

    return Object.values(segmentMap).flatMap((segment: any) => {
      const totalOSKredit = getTotalOsKredit();
      const detailRows = Object.entries(segment.kolMap)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([kol, item]: [string, any], rowIndex) => ({
          ...finalizeKolItem(item, totalOSKredit),
          rowType: "detail",
          no: rowIndex === 0 ? segment.no : "",
          segmen: rowIndex === 0 ? segment.segmen : "",
          kol: Number(kol),
        }));

      if (detailRows.length === 0) return [];

      return [
        ...detailRows,
        {
          // ...finalizeKolItem(segment.total, segment.total.sisaPokok),
          ...finalizeKolItem(segment.total, totalOSKredit),
          rowType: "subtotal",
          no: "",
          segmen: "",
          kol: "",
        },
      ];
    });
  };

  // ==========================================
  // EXPORT 5 SHEETS DENGAN EXCELJS
  // ==========================================
  const handleExportExcel5Sheets = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const instansiData = getInstansiBaseData();
      const segmentData = getSegmentasiBaseData();
      const instansiKolData = getInstansiKolektibilitasData();
      const segmentKolData = getSegmentasiKolektibilitasData();
      const aoData = getAnalisisAoData();
      const aoKolData = getAoKolektibilitasData();
      const nplPaymentData = getNplPaymentData();
      const periodeTeks = selectedMonth
        ? moment(selectedMonth).format("MMM-YY")
        : "SEMUA DATA";

      // ==========================================
      // REUSABLE ADVANCED STYLES & PALETTES
      // ==========================================
      const PALETTE = {
        primaryDark: "1F4E78", // Biru Navy khas Corporate Bank
        primaryLight: "D9E1F2", // Biru Muda Header Sekunder
        zebraEven: "F2F2F2", // Abu-abu tipis untuk selang-seling baris
        accentTotal: "FFF2CC", // Kuning pastel premium untuk Grand Total
        borderLight: "D9D9D9", // Border abu-abu halus agar tidak kaku
      };

      const applyWorksheetConfig = (ws: ExcelJS.Worksheet) => {
        ws.views = [{ showGridLines: true }];
      };

      const applyCellBorders = (
        ws: ExcelJS.Worksheet,
        startRow: number,
        endRow: number,
        endCol: number,
      ) => {
        for (let r = startRow; r <= endRow; r++) {
          const row = ws.getRow(r);
          for (let c = 1; c <= endCol; c++) {
            row.getCell(c).border = {
              top: { style: "thin", color: { argb: PALETTE.borderLight } },
              left: { style: "thin", color: { argb: PALETTE.borderLight } },
              bottom: { style: "thin", color: { argb: PALETTE.borderLight } },
              right: { style: "thin", color: { argb: PALETTE.borderLight } },
            };
          }
        }
      };

      const addBprHeader = (
        ws: ExcelJS.Worksheet,
        titleText: string,
        maxCol: number,
      ) => {
        ws.mergeCells(1, 1, 1, maxCol);
        ws.mergeCells(2, 1, 2, maxCol);
        ws.mergeCells(3, 1, 3, maxCol);

        ws.getCell("A1").value = "PT BPR HASAMITRA JAWA BARAT";
        ws.getCell("A2").value = titleText.toUpperCase();
        ws.getCell("A3").value =
          `PERIODE LAPORAN: ${periodeTeks.toUpperCase()}`;

        [1, 2, 3].forEach((rowNum) => {
          const row = ws.getRow(rowNum);
          row.alignment = { horizontal: "left", vertical: "middle" };
          row.font = { name: "Segoe UI", size: 10, color: { argb: "595959" } };
        });

        ws.getRow(1).font = {
          name: "Segoe UI",
          size: 12,
          bold: true,
          color: { argb: PALETTE.primaryDark },
        };
        ws.getRow(2).font = {
          name: "Segoe UI",
          size: 14,
          bold: true,
          color: { argb: "000000" },
        };
        ws.getRow(3).font = {
          name: "Segoe UI",
          size: 10,
          italic: true,
          color: { argb: "7F7F7F" },
        };

        ws.addRow([]); // Jarak baris 4 kosong
      };

      const addSignatures = (ws: ExcelJS.Worksheet, startRow: number) => {
        ws.addRow([]);
        const cleanStart = startRow + 1;

        // Tanggal
        ws.getCell(`A${cleanStart}`).value =
          `Depok, ${moment().format("DD MMMM YYYY")}`;
        ws.getCell(`A${cleanStart}`).font = {
          name: "Segoe UI",
          size: 10,
          italic: true,
          color: { argb: "595959" },
        };

        // Header Tanda Tangan
        ws.getCell(`A${cleanStart + 1}`).value = "Disiapkan Oleh,";
        ws.getCell(`D${cleanStart + 1}`).value = "Diperiksa Oleh,";
        ws.getCell(`F${cleanStart + 1}`).value = "Disetujui Oleh,";

        const signHeaderRow = ws.getRow(cleanStart + 1);
        signHeaderRow.font = {
          name: "Segoe UI",
          size: 10,
          bold: true,
          color: { argb: "333333" },
        };

        // Kolom yang membutuhkan tanda tangan (A, D, F)
        const signColumns = ["A", "D", "F"];

        signColumns.forEach((col) => {
          // Baris ke-5: Tempat Nama (Diberi border bawah agar ada garis walau kosong)
          const nameCell = ws.getCell(`${col}${cleanStart + 5}`);
          nameCell.value = "";
          nameCell.font = { name: "Segoe UI", size: 10, bold: true };
          nameCell.border = {
            bottom: { style: "thin", color: { argb: "000000" } },
          }; // Garis bawah

          // Baris ke-6: Tempat Jabatan/Keterangan
          const titleCell = ws.getCell(`${col}${cleanStart + 6}`);
          titleCell.value = "";
          titleCell.font = { name: "Segoe UI", size: 10, bold: false };
        });
      };

      const autoFitColumns = (ws: ExcelJS.Worksheet) => {
        ws.columns.forEach((column) => {
          let maxLen = 14;
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            if (Number(cell.row) > 4 && cell.value) {
              const len = cell.value.toString().length;
              if (len > maxLen) maxLen = len;
            }
          });
          column.width = maxLen + 5;
        });
      };

      // ==========================================
      // SHEET 1: KOLEKTIBILITAS BERDASARKAN INSTANSI
      // ==========================================
      const ws1 = workbook.addWorksheet("NPL Instansi");
      applyWorksheetConfig(ws1);
      addBprHeader(ws1, "LAPORAN POSISI KOLEKTIBILITAS PINJAMAN", 8);

      ws1.getCell("A5").value = "I. KOLEKTIBILITAS BERDASARKAN INSTANSI";
      ws1.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      const hRow1 = ws1.getRow(6);
      hRow1.values = [
        "No",
        "Instansi / Mitra Kerja",
        "Kol",
        "Debitur",
        "Sisa Pokok (OS)",
        "Angsuran Wajib",
        "NPL Instansi",
        "NPL Gross",
      ];
      hRow1.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      hRow1.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      hRow1.height = 28;
      ws1.views = [{ state: "frozen", ySplit: 6, showGridLines: true }];
      ws1.getColumn(2).width = 34;
      ws1.getColumn(3).width = 8;
      ws1.getColumn(4).width = 10;
      ws1.getColumn(5).width = 18;
      ws1.getColumn(6).width = 18;
      ws1.getColumn(7).width = 12;
      ws1.getColumn(8).width = 12;
      hRow1.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: PALETTE.primaryDark },
          }),
      );

      let currentRow = 7;
      let tDeb1 = 0,
        tSisa1 = 0,
        tAngs1 = 0,
        tNplValue1 = 0;

      instansiData.forEach((d) => {
        tDeb1 += d.deb;
        tSisa1 += d.sisaPokok;
        tAngs1 += d.angsuran;
        tNplValue1 += d.nplValue;
      });

      instansiKolData.forEach((d, idx) => {
        const r = ws1.addRow([
          d.no,
          d.instansi,
          d.kol,
          d.deb,
          d.sisaPokok,
          d.angsuran,
          d.rowType === "subtotal" ? d.nplInstansi / 100 : null,
          d.rowType === "subtotal" ? d.nplGross / 100 : null,
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(4).alignment = { horizontal: "center" };
        r.getCell(5).numFmt = "#,##0";
        r.getCell(6).numFmt = "#,##0";
        r.getCell(7).numFmt = "0.00%";
        r.getCell(8).numFmt = "0.00%";

        if (d.rowType === "subtotal") {
          r.font = { name: "Segoe UI", size: 10, bold: true };
          r.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "E2F0D9" },
            };
            cell.border = {
              top: { style: "thin", color: { argb: "000000" } },
              bottom: { style: "thin", color: { argb: PALETTE.borderLight } },
            };
          });
        } else if (idx % 2 === 1) {
          r.eachCell(
            (c) =>
              (c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: PALETTE.zebraEven },
              }),
          );
        }

        if (d.rowType === "subtotal" && d.nplGross > 5) {
          r.getCell(7).font = { color: { argb: "9C0006" }, bold: true };
        }
        if (d.rowType === "subtotal" && d.nplGross > 5) {
          r.getCell(8).font = { color: { argb: "9C0006" }, bold: true };
        }

        currentRow++;
      });

      const globalNplGross1 = tSisa1 > 0 ? tNplValue1 / tSisa1 : 0;

      const totalRow1 = ws1.addRow([
        "GRAND TOTAL KONSOLIDASI",
        "",
        "",
        tDeb1,
        tSisa1,
        tAngs1,
        globalNplGross1,
        globalNplGross1,
      ]);
      ws1.mergeCells(currentRow, 1, currentRow, 3);
      totalRow1.height = 22;
      totalRow1.font = { name: "Segoe UI", size: 10, bold: true };
      totalRow1.alignment = { vertical: "middle" };
      totalRow1.getCell(4).alignment = { horizontal: "center" };
      totalRow1.getCell(5).numFmt = "#,##0";
      totalRow1.getCell(6).numFmt = "#,##0";
      totalRow1.getCell(7).numFmt = "0.00%";
      totalRow1.getCell(8).numFmt = "0.00%";
      totalRow1.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: PALETTE.accentTotal },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws1, 6, currentRow - 1, 8);
      autoFitColumns(ws1);
      addSignatures(ws1, currentRow + 1);

      // ==========================================
      // SHEET 2: KOLEKTIBILITAS BERDASARKAN SEGMENTASI
      // ==========================================
      const ws2 = workbook.addWorksheet("NPL Segmentasi");
      applyWorksheetConfig(ws2);
      addBprHeader(ws2, "LAPORAN POSISI KOLEKTIBILITAS PINJAMAN", 7);

      ws2.getCell("A5").value =
        "II. KOLEKTIBILITAS BERDASARKAN SEGMENTASI KREDIT";
      ws2.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      const hRow2 = ws2.getRow(6);
      hRow2.values = [
        "No",
        "Segmen / Skema Kredit",
        "Kol",
        "Debitur",
        "Sisa Pokok (OS)",
        "Angsuran Wajib",
        "NPL Gross",
        "NPL / Segmen",
      ];
      hRow2.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      hRow2.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      hRow2.height = 28;
      ws2.views = [{ state: "frozen", ySplit: 6, showGridLines: true }];
      ws2.getColumn(2).width = 34;
      ws2.getColumn(3).width = 8;
      ws2.getColumn(4).width = 10;
      ws2.getColumn(5).width = 18;
      ws2.getColumn(6).width = 18;
      ws2.getColumn(7).width = 12;
      // ws2.getColumn(8).width = 12;
      hRow2.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: PALETTE.primaryDark },
          }),
      );

      currentRow = 7;
      let tDeb2 = 0,
        tSisa2 = 0,
        tAngs2 = 0,
        tNplValue2 = 0;

      segmentData.forEach((d) => {
        tDeb2 += d.deb;
        tSisa2 += d.sisaPokok;
        tAngs2 += d.angsuran;
        tNplValue2 += d.nplValue;
      });

      segmentKolData.forEach((d, idx) => {
        const r = ws2.addRow([
          d.no,
          d.segmen,
          d.kol,
          d.deb,
          d.sisaPokok,
          d.angsuran,
          d.rowType === "subtotal" ? d.nplGross / 100 : null,
          d.rowType === "subtotal" ? d.nplInstansi / 100 : null,
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(4).alignment = { horizontal: "center" };
        r.getCell(5).numFmt = "#,##0";
        r.getCell(6).numFmt = "#,##0";
        r.getCell(7).numFmt = "0.00%";
        r.getCell(8).numFmt = "0.00%";

        if (d.rowType === "subtotal") {
          r.font = { name: "Segoe UI", size: 10, bold: true };
          r.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "E2F0D9" },
            };
            cell.border = {
              top: { style: "thin", color: { argb: "000000" } },
              bottom: { style: "thin", color: { argb: PALETTE.borderLight } },
            };
          });
        } else if (idx % 2 === 1) {
          r.eachCell(
            (c) =>
              (c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: PALETTE.zebraEven },
              }),
          );
        }

        if (d.rowType === "subtotal" && d.nplGross > 5) {
          r.getCell(7).font = { color: { argb: "9C0006" }, bold: true };
        }

        currentRow++;
      });

      const globalNplGross2 = tSisa2 > 0 ? tNplValue2 / tSisa2 : 0;

      const totalRow2 = ws2.addRow([
        "GRAND TOTAL KONSOLIDASI",
        "",
        "",
        tDeb2,
        tSisa2,
        tAngs2,
        globalNplGross2,
      ]);
      ws2.mergeCells(currentRow, 1, currentRow, 3);
      totalRow2.height = 22;
      totalRow2.font = { name: "Segoe UI", size: 10, bold: true };
      totalRow2.getCell(4).alignment = { horizontal: "center" };
      totalRow2.getCell(5).numFmt = "#,##0";
      totalRow2.getCell(6).numFmt = "#,##0";
      totalRow2.getCell(7).numFmt = "0.00%";
      totalRow2.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: PALETTE.accentTotal },
        };
        c.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws2, 6, currentRow - 1, 7);
      autoFitColumns(ws2);
      addSignatures(ws2, currentRow + 1);

      // ==========================================
      // SHEET 3: POSISI KREDIT BERDASARKAN INSTANSI (PKS)
      // ==========================================
      const ws3 = workbook.addWorksheet("Posisi Instansi");
      applyWorksheetConfig(ws3);
      addBprHeader(ws3, "LAPORAN POSISI SALDO OUTSTANDING KREDIT", 6);

      ws3.getCell("A5").value = "III. POSISI KREDIT BERDASARKAN INSTANSI (PKS)";
      ws3.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      const hRow3 = ws3.getRow(6);
      hRow3.values = [
        "No",
        "NAMA MITRA INSTANSI",
        "TOTAL DEB",
        "SISA POKOK (OS)",
        "ANGSURAN BULANAN",
        "MARKET SHARE (%)",
      ];
      hRow3.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      hRow3.alignment = { horizontal: "center", vertical: "middle" };
      hRow3.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "4F81BD" },
          }),
      );

      currentRow = 7;
      instansiData.forEach((d, idx) => {
        const share = tSisa1 > 0 ? d.sisaPokok / tSisa1 : 0;
        const r = ws3.addRow([
          d.no,
          d.instansi,
          d.deb,
          d.sisaPokok,
          d.angsuran,
          share,
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(4).numFmt = "#,##0";
        r.getCell(5).numFmt = "#,##0";
        r.getCell(6).numFmt = "0.00%";
        if (idx % 2 === 1)
          r.eachCell(
            (c) =>
              (c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: PALETTE.zebraEven },
              }),
          );
        currentRow++;
      });

      const totalRow3 = ws3.addRow([
        "TOTAL PORTOFOLIO",
        "",
        tDeb1,
        tSisa1,
        tAngs1,
        1.0,
      ]);
      ws3.mergeCells(currentRow, 1, currentRow, 2);
      totalRow3.font = { name: "Segoe UI", size: 10, bold: true };
      totalRow3.getCell(3).alignment = { horizontal: "center" };
      totalRow3.getCell(4).numFmt = "#,##0";
      totalRow3.getCell(5).numFmt = "#,##0";
      totalRow3.getCell(6).numFmt = "0.00%";
      totalRow3.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "DCE6F1" },
        };
        c.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws3, 6, currentRow - 1, 6);
      autoFitColumns(ws3);
      addSignatures(ws3, currentRow + 1);

      // ==========================================
      // SHEET 4: POSISI KREDIT BERDASARKAN SEGMEN PEMASARAN
      // ==========================================
      const ws4 = workbook.addWorksheet("Posisi Segmentasi");
      applyWorksheetConfig(ws4);
      addBprHeader(ws4, "LAPORAN SEGMEN DISTRIBUSI PEMASARAN", 6);

      ws4.getCell("A5").value =
        "IV. POSISI KREDIT BERDASARKAN SEGMEN PEMASARAN";
      ws4.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      const hRow4 = ws4.getRow(6);
      hRow4.values = [
        "No",
        "SEGMEN PRODUK",
        "TOTAL DEB",
        "OS PINJAMAN",
        "BEBAN ANGSURAN",
        "SHARE (%)",
      ];
      hRow4.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      hRow4.alignment = { horizontal: "center", vertical: "middle" };
      hRow4.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "4F81BD" },
          }),
      );

      currentRow = 7;
      segmentData.forEach((d, idx) => {
        const share = tSisa2 > 0 ? d.sisaPokok / tSisa2 : 0;
        const r = ws4.addRow([
          d.no,
          d.segmen,
          d.deb,
          d.sisaPokok,
          d.angsuran,
          share,
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(4).numFmt = "#,##0";
        r.getCell(5).numFmt = "#,##0";
        r.getCell(6).numFmt = "0.00%";
        if (idx % 2 === 1)
          r.eachCell(
            (c) =>
              (c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: PALETTE.zebraEven },
              }),
          );
        currentRow++;
      });

      const totalRow4 = ws4.addRow([
        "TOTAL PORTOFOLIO",
        "",
        tDeb2,
        tSisa2,
        tAngs2,
        1.0,
      ]);
      ws4.mergeCells(currentRow, 1, currentRow, 2);
      totalRow4.font = { name: "Segoe UI", size: 10, bold: true };
      totalRow4.getCell(3).alignment = { horizontal: "center" };
      totalRow4.getCell(4).numFmt = "#,##0";
      totalRow4.getCell(5).numFmt = "#,##0";
      totalRow4.getCell(6).numFmt = "0.00%";
      totalRow4.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "DCE6F1" },
        };
        c.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws4, 6, currentRow - 1, 6);
      autoFitColumns(ws4);
      addSignatures(ws4, currentRow + 1);

      // ==========================================
      // SHEET 5: POSISI TAGIHAN & SISA TAGIHAN
      // ==========================================
      const ws5 = workbook.addWorksheet("Lap Rekap Tagihan");
      applyWorksheetConfig(ws5);
      addBprHeader(ws5, "LAPORAN POSISI KREDIT", 11);

      ws5.getCell("A5").value = "V. POSISI TAGIHAN BERDASARKAN INSTANSI";
      ws5.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      ws5.mergeCells(6, 1, 7, 1);
      ws5.getCell("A6").value = "No";
      ws5.mergeCells(6, 2, 7, 2);
      ws5.getCell("B6").value = "INSTANSI / MITRA";
      ws5.mergeCells(6, 3, 7, 3);
      ws5.getCell("C6").value = "DEB";
      ws5.mergeCells(6, 4, 7, 4);
      ws5.getCell("D6").value = "SISA POKOK";
      ws5.mergeCells(6, 5, 7, 5);
      ws5.getCell("E6").value = "TAGIHAN TARGET";

      ws5.mergeCells(6, 6, 6, 8);
      ws5.getCell("F6").value = "REALISASI BAYAR";
      ws5.getCell("F7").value = "DEB";
      ws5.getCell("G7").value = "NOMINAL";
      ws5.getCell("H7").value = "% / EFF";

      ws5.mergeCells(6, 9, 6, 11);
      ws5.getCell("I6").value = "SISA TUNGGAKAN";
      ws5.getCell("I7").value = "DEB";
      ws5.getCell("J7").value = "NOMINAL";
      ws5.getCell("K7").value = "% OB";

      [6, 7].forEach((rowNum) => {
        const row = ws5.getRow(rowNum);
        row.font = {
          name: "Segoe UI",
          size: 9,
          bold: true,
          color: { argb: "FFFFFF" },
        };
        row.alignment = { horizontal: "center", vertical: "middle" };
        for (let c = 1; c <= 11; c++) {
          row.getCell(c).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: PALETTE.primaryDark },
          };
        }
      });
      for (let c = 1; c <= 11; c++) {
        ws5.getCell(7, c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "2F5597" },
        };
      }

      currentRow = 8;
      let tRealizTotal = 0;
      let tDebPay = 0;

      instansiData.forEach((d, idx) => {
        const sisaTunggakan = d.angsuran - d.realisasi;
        const pctBayar = d.angsuran > 0 ? d.realisasi / d.angsuran : 0;
        const pctSisa = d.angsuran > 0 ? sisaTunggakan / d.angsuran : 0;
        tRealizTotal += d.realisasi;
        tDebPay += d.realisasi > 0 ? d.deb : 0;

        const r = ws5.addRow([
          d.no,
          d.instansi,
          d.deb,
          d.sisaPokok,
          d.angsuran,
          d.realisasi > 0 ? d.deb : 0,
          d.realisasi,
          pctBayar,
          sisaTunggakan > 0 ? d.deb : 0,
          sisaTunggakan,
          pctSisa,
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(6).alignment = { horizontal: "center" };
        r.getCell(9).alignment = { horizontal: "center" };
        [4, 5, 7, 10].forEach((idx) => (r.getCell(idx).numFmt = "#,##0"));
        [8, 11].forEach((idx) => (r.getCell(idx).numFmt = "0.00%"));

        if (idx % 2 === 1)
          r.eachCell(
            (c) =>
              (c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: PALETTE.zebraEven },
              }),
          );
        currentRow++;
      });

      const totalSisaPokokSemua = tAngs1 - tRealizTotal;
      const totalRow5 = ws5.addRow([
        "TOTAL KONSOLIDASI TAGIHAN",
        "",
        tDeb1,
        tSisa1,
        tAngs1,
        tDebPay,
        tRealizTotal,
        tAngs1 > 0 ? tRealizTotal / tAngs1 : 0,
        tDeb1,
        totalSisaPokokSemua,
        tAngs1 > 0 ? totalSisaPokokSemua / tAngs1 : 0,
      ]);
      ws5.mergeCells(currentRow, 1, currentRow, 2);
      totalRow5.height = 22;
      totalRow5.font = { name: "Segoe UI", size: 10, bold: true };
      [4, 5, 7, 10].forEach((idx) => (totalRow5.getCell(idx).numFmt = "#,##0"));
      [8, 11].forEach((idx) => (totalRow5.getCell(idx).numFmt = "0.00%"));
      totalRow5.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: PALETTE.accentTotal },
        };
        c.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws5, 6, currentRow - 1, 11);
      autoFitColumns(ws5);
      addSignatures(ws5, currentRow + 1);

      // ==========================================
      // SHEET 6: KOLEKTIBILITAS BERDASARKAN AO
      // ==========================================
      const ws6 = workbook.addWorksheet("NPL AO");
      applyWorksheetConfig(ws6);
      addBprHeader(ws6, "LAPORAN POSISI KOLEKTIBILITAS PINJAMAN", 7);

      ws6.getCell("A5").value = "VI. KOLEKTIBILITAS BERDASARKAN AO";
      ws6.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      const hRow6 = ws6.getRow(6);
      hRow6.values = [
        "No",
        "Account Officer",
        "Kol",
        "Debitur",
        "Sisa Pokok (OS)",
        "Angsuran Wajib",
        "NPL Gross",
        "NPL / AO",
      ];
      hRow6.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      hRow6.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      hRow6.height = 28;
      ws6.views = [{ state: "frozen", ySplit: 6, showGridLines: true }];
      ws6.getColumn(2).width = 34;
      ws6.getColumn(3).width = 8;
      ws6.getColumn(4).width = 10;
      ws6.getColumn(5).width = 18;
      ws6.getColumn(6).width = 18;
      ws6.getColumn(7).width = 12;
      hRow6.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: PALETTE.primaryDark },
          }),
      );

      currentRow = 7;
      let tDeb6 = 0,
        tSisa6 = 0,
        tAngs6 = 0,
        tNplValue6 = 0;

      aoData.forEach((d) => {
        tDeb6 += d.countTransaksi || 0;
        tSisa6 += d.totalOs || 0;
        tAngs6 += d.totalTagihan || 0;
        tNplValue6 += d.nplValue || 0;
      });

      aoKolData.forEach((d, idx) => {
        const r = ws6.addRow([
          d.no,
          d.aoName,
          d.kol,
          d.deb,
          d.sisaPokok,
          d.angsuran,
          d.rowType === "subtotal" ? d.nplGross / 100 : null,
          d.rowType === "subtotal" ? d.nplInstansi / 100 : null,
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(4).alignment = { horizontal: "center" };
        r.getCell(5).numFmt = "#,##0";
        r.getCell(6).numFmt = "#,##0";
        r.getCell(7).numFmt = "0.00%";
        r.getCell(8).numFmt = "0.00%";

        if (d.rowType === "subtotal") {
          r.font = { name: "Segoe UI", size: 10, bold: true };
          r.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "E2F0D9" },
            };
            cell.border = {
              top: { style: "thin", color: { argb: "000000" } },
              bottom: { style: "thin", color: { argb: PALETTE.borderLight } },
            };
          });
        } else if (idx % 2 === 1) {
          r.eachCell(
            (c) =>
              (c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: PALETTE.zebraEven },
              }),
          );
        }

        if (d.rowType === "subtotal" && d.nplGross > 5) {
          r.getCell(7).font = { color: { argb: "9C0006" }, bold: true };
        }

        currentRow++;
      });

      ws6.mergeCells(currentRow, 1, currentRow, 3);
      const globalNplGross6 = tSisa6 > 0 ? tNplValue6 / tSisa6 : 0;
      const totalRow6 = ws6.addRow([
        "GRAND TOTAL KONSOLIDASI",
        "",
        "",
        tDeb6,
        tSisa6,
        tAngs6,
        globalNplGross6,
      ]);
      totalRow6.height = 22;
      totalRow6.font = { name: "Segoe UI", size: 10, bold: true };
      totalRow6.alignment = { vertical: "middle" };
      totalRow6.getCell(4).alignment = { horizontal: "center" };
      totalRow6.getCell(5).numFmt = "#,##0";
      totalRow6.getCell(6).numFmt = "#,##0";
      totalRow6.getCell(7).numFmt = "0.00%";
      totalRow6.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: PALETTE.accentTotal },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws6, 6, currentRow - 1, 7);
      autoFitColumns(ws6);
      addSignatures(ws6, currentRow + 1);

      const ws7 = workbook.addWorksheet("Pembayaran NPL");
      applyWorksheetConfig(ws7);

      addBprHeader(ws7, "LAPORAN PEMBAYARAN NPL", 8);

      ws7.getCell("A5").value = "VII. LAPORAN PEMBAYARAN NPL";

      ws7.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      const hRow7 = ws7.getRow(6);

      hRow7.values = [
        "No",
        "Tanggal",
        "No Loan/Norek",
        "Nama Debitur",
        "Instansi",
        "AO",
        "Tagihan",
        "Pembayaran",
        "Status",
      ];
      hRow7.height = 28;

      hRow7.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      ws7.views = [
        {
          state: "frozen",
          ySplit: 6,
          showGridLines: true,
        },
      ];
      hRow7.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFF" },
      };

      hRow7.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      hRow7.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: PALETTE.primaryDark,
          },
        };
      });

      // ws7.getColumn(2).width = 35;
      ws7.getColumn(1).width = 6;
      ws7.getColumn(2).width = 14;
      ws7.getColumn(3).width = 16;
      ws7.getColumn(4).width = 28;
      ws7.getColumn(5).width = 45;
      ws7.getColumn(6).width = 45;
      ws7.getColumn(7).width = 16;
      ws7.getColumn(8).width = 16;
      ws7.getColumn(9).width = 12;

      let no = 1;
      let row = 7;
      let totaltagihan = 0;
      let totalbayar = 0;
      let totalDebbt7 = 0;
      const group = nplPaymentData.reduce(
        (acc, item) => {
          const key = moment(item.tanggal).format("DD/MM/YYYY");

          if (!acc[key]) acc[key] = [];

          acc[key].push(item);

          return acc;
        },
        {} as Record<string, any[]>,
      );
      Object.entries(group).forEach(([tanggal, items], groupIndex) => {
        const startRow = row;
        (items as any).forEach((item: any) => {
          const excelRow = ws7.addRow([
            "",
            "",
            item.noLoan,
            item.debitur,
            item.instansi,
            item.ao,
            item.tagihan || "-",
            item.pembayaran || "-",
            item.status,
          ]);
          totaltagihan += item.tagihan;
          totalbayar += item.pembayaran;
          totalDebbt7 += 1;

          excelRow.height = 22;

          excelRow.getCell(7).numFmt = "#,##0";
          excelRow.getCell(8).numFmt = "#,##0";

          row++;
          const groupColor = groupIndex % 2 === 0 ? "FFFFFF" : "EAF4E2"; // hijau muda
          excelRow.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: groupColor,
              },
            };
          });
        });
        const endRow = row - 1;
        ws7.mergeCells(startRow, 1, endRow, 1);
        ws7.mergeCells(startRow, 2, endRow, 2);

        ws7.getCell(startRow, 1).value = no++;
        ws7.getCell(startRow, 2).value = tanggal;

        ws7.getCell(startRow, 1).alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        ws7.getCell(startRow, 2).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
      });

      const totalRow7 = ws7.addRow([
        "TOTAL",
        "",
        "",
        totalDebbt7,
        "",
        "",
        totaltagihan,
        totalbayar,
        "",
      ]);

      ws7.mergeCells(totalRow7.number, 1, totalRow7.number, 2);

      totalRow7.height = 22;

      totalRow7.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
      };

      totalRow7.alignment = {
        vertical: "middle",
      };

      totalRow7.getCell(7).alignment = {
        horizontal: "right",
      };

      totalRow7.getCell(8).alignment = {
        horizontal: "right",
      };

      totalRow7.getCell(7).numFmt = "#,##0";
      totalRow7.getCell(8).numFmt = "#,##0";

      totalRow7.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: PALETTE.accentTotal,
          },
        };

        cell.border = {
          top: {
            style: "thin",
            color: { argb: "000000" },
          },
          bottom: {
            style: "double",
            color: { argb: "000000" },
          },
          left: {
            style: "thin",
            color: { argb: PALETTE.borderLight },
          },
          right: {
            style: "thin",
            color: { argb: PALETTE.borderLight },
          },
        };
      });
      applyCellBorders(ws7, 6, totalRow7.number, 9);

      autoFitColumns(ws7);

      // Supaya kolom tetap proporsional
      ws7.getColumn(1).width = 6;
      ws7.getColumn(2).width = 14;
      ws7.getColumn(3).width = 16;
      ws7.getColumn(4).width = 28;
      ws7.getColumn(5).width = 45;
      ws7.getColumn(6).width = 10;
      ws7.getColumn(7).width = 16;
      ws7.getColumn(8).width = 16;
      ws7.getColumn(9).width = 12;

      // Tambahkan tanda tangan seperti Sheet VI
      addSignatures(ws7, totalRow7.number + 2);

      const ws8 = workbook.addWorksheet("Lap. WO");
      applyWorksheetConfig(ws1);
      addBprHeader(ws8, "LAPORAN PEMBAYARAN KREDIT WO", 8);

      ws1.getCell("A5").value = "VIII. LAPORAN PEMBAYARAN KREDIT WO";
      ws1.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      const hRow8 = ws8.getRow(6);
      hRow8.values = [
        "No",
        "Nomor Rekening",
        "Nasabah",
        "Instansi",
        "Tgl WROFF",
        "Saldo Pokok WROFF",
        "Saldo Bunga WROFF",
        "Pembayaran",
        "Tgl Pembayaran",
      ];
      hRow8.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      hRow8.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      hRow8.height = 28;
      ws8.views = [{ state: "frozen", ySplit: 6, showGridLines: true }];
      ws8.getColumn(1).width = 5; // No
      ws8.getColumn(2).width = 20; // Nomor Rekening
      ws8.getColumn(3).width = 34; // Nasabah
      ws8.getColumn(4).width = 25; // Instansi
      ws8.getColumn(5).width = 15; // Tgl WROFF
      ws8.getColumn(6).width = 18; // Pokok
      ws8.getColumn(7).width = 18; // Bunga
      ws8.getColumn(8).width = 18; // Pembayaran
      ws8.getColumn(9).width = 15; // Tgl Pembayaran
      hRow8.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: PALETTE.primaryDark },
          }),
      );

      let tDeb8 = 0,
        tSisaPkk8 = 0,
        tSisaBga8 = 0,
        tBayar8 = 0;

      woData.forEach((d) => {
        tDeb8 += 1;
        tSisaPkk8 += d.tung_pkk;
        tSisaBga8 += d.tung_bga;
        tBayar8 += d.realize_value;
      });

      woData.forEach((d, idx) => {
        const r = ws8.addRow([
          idx + 1,
          d.Submission.account_number,
          d.Submission.Debitur.fullname,
          d.Submission.Mitra.name,
          d.bill_date ? moment(d.bill_date).format("DD/MM/YYYY") : "-",
          d.tung_pkk,
          d.tung_bga,
          d.realize_value,
          d.realize_date ? moment(d.realize_date).format("DD/MM/YYYY") : "-",
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(2).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(4).alignment = { horizontal: "center" };
        r.getCell(5).alignment = { horizontal: "center" };
        r.getCell(6).numFmt = "#,##0";
        r.getCell(7).numFmt = "#,##0";
        r.getCell(8).numFmt = "0.00%";
        r.getCell(9).alignment = { horizontal: "center" };
      });

      const currentRow8 = ws8.rowCount + 1;

      const totalRow8 = ws8.addRow([
        "GRAND TOTAL KONSOLIDASI",
        "", // Merge Col 2
        "", // Merge Col 3
        "", // Merge Col 4
        "", // Merge Col 5
        tSisaPkk8, // Col 6: Total Pokok
        tSisaBga8, // Col 7: Total Bunga
        tBayar8, // Col 8: Total Pembayaran
        "", // Col 9: Tgl Pembayaran (Kosong)
      ]);

      // Gabungkan kolom A sampai E (1 - 5) untuk teks Grand Total
      ws8.mergeCells(currentRow, 1, currentRow, 5);

      totalRow8.height = 22;
      totalRow8.font = { name: "Segoe UI", size: 10, bold: true };
      totalRow8.alignment = { vertical: "middle" };
      totalRow8.getCell(1).alignment = { horizontal: "center" };

      // Terapkan format angka pada Total
      totalRow8.getCell(6).numFmt = "#,##0";
      totalRow8.getCell(7).numFmt = "#,##0";
      totalRow8.getCell(8).numFmt = "#,##0";

      totalRow8.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: PALETTE.accentTotal },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws8, 6, currentRow8 - 1, 8);
      autoFitColumns(ws8);
      addSignatures(ws8, currentRow8 + 1);

      // ==========================================
      // DISPATCHING FILES VIA BROWSER
      // ==========================================
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Laporan_Eksekutif_Kolektibilitas_Kredit_${periodeTeks}.xlsx`;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      message.success("Berkas Excel Premium BPR Hasamitra siap dibuka!");
    } catch (err) {
      console.error(err);
      message.error("Gagal menyusun workbook internal ExcelJS.");
    }
  };

  // 1. Pemetaan Data Tabel Berdasarkan Segmentasi Produk
  const getSegmentasiProdukData = () => {
    const produkMap: { [key: string]: any } = {};

    dashboardData.forEach((mitra) => {
      mitra.Billing?.forEach((bill: any) => {
        const productName =
          bill.Submission?.Product?.name || "Produk Tidak Diketahui";

        if (!produkMap[productName]) {
          produkMap[productName] = {
            key: productName,
            productName: productName,
            totalPlafond: 0,
            totalOs: 0,
            totalTagihan: 0,
            totalRealisasi: 0,
            totalTunggakan: 0,
            larValue: 0,
            nplValue: 0,
            countTransaksi: 0,
          };
        }

        produkMap[productName].totalPlafond += bill.plafond || 0;
        produkMap[productName].totalOs += bill.pkk || 0;
        produkMap[productName].totalTagihan += bill.value || 0;
        produkMap[productName].totalRealisasi += bill.realize_value || 0;
        produkMap[productName].totalTunggakan +=
          (bill.tung_pkk || 0) + (bill.tung_bga || 0);
        if (isLar(bill)) produkMap[productName].larValue += bill.pkk || 0;
        if (isNpl(bill)) produkMap[productName].nplValue += bill.pkk || 0;
        produkMap[productName].countTransaksi += 1;
      });
    });

    return Object.values(produkMap).map((item: any) => ({
      ...item,
      larRatio:
        item.totalOs > 0
          ? parseFloat(((item.larValue / item.totalOs) * 100).toFixed(2))
          : 0,
      nplRatio:
        item.totalOs > 0
          ? parseFloat(((item.nplValue / item.totalOs) * 100).toFixed(2))
          : 0,
    }));
  };

  // 2. Pemetaan Data Tabel Berdasarkan Analisis Mitra (Fitur Baru)
  const getAnalisisMitraData = () => {
    return dashboardData.map((mitra) => {
      let totalPlafond = 0;
      let totalOs = 0;
      let totalTagihan = 0;
      let totalRealisasi = 0;
      let totalTunggakan = 0;
      let countTransaksi = 0;
      let larValue = 0;
      let nplValue = 0;

      mitra.Billing?.forEach((bill: any) => {
        const os = bill.pkk || 0;

        totalPlafond += bill.plafond || 0;
        totalOs += os;
        totalTagihan += bill.value || 0;
        totalRealisasi += bill.realize_value || 0;
        totalTunggakan += (bill.tung_pkk || 0) + (bill.tung_bga || 0);
        countTransaksi += 1;

        if (isLar(bill)) larValue += os;
        if (isNpl(bill)) nplValue += os;
      });

      const nplMitra = totalOs > 0 ? (nplValue / totalOs) * 100 : 0;

      const larMitra = totalOs > 0 ? (larValue / totalOs) * 100 : 0;

      return {
        key: mitra.id,
        mitraName: mitra.name || "Tanpa Nama",
        code: mitra.code || "-",
        countTransaksi,
        totalPlafond,
        totalOs,
        totalTagihan,
        totalRealisasi,
        totalTunggakan,
        larValue,
        larMitra: parseFloat(larMitra.toFixed(2)),
        nplValue,
        nplMitra: parseFloat(nplMitra.toFixed(2)),
      };
    });
  };

  const getAnalisisAoData = () => {
    const aoMap: { [key: string]: any } = {};

    dashboardData.forEach((mitra) => {
      mitra.Billing?.forEach((bill: any) => {
        const aoName = getAoName(bill);
        const os = bill.pkk || 0;

        if (!aoMap[aoName]) {
          aoMap[aoName] = {
            key: aoName,
            aoName,
            countTransaksi: 0,
            totalPlafond: 0,
            totalOs: 0,
            totalTagihan: 0,
            totalRealisasi: 0,
            totalTunggakan: 0,
            larValue: 0,
            nplValue: 0,
          };
        }

        aoMap[aoName].countTransaksi += 1;
        aoMap[aoName].totalPlafond += bill.plafond || 0;
        aoMap[aoName].totalOs += os;
        aoMap[aoName].totalTagihan += bill.value || 0;
        aoMap[aoName].totalRealisasi += bill.realize_value || 0;
        aoMap[aoName].totalTunggakan +=
          (bill.tung_pkk || 0) + (bill.tung_bga || 0);

        if (isLar(bill)) aoMap[aoName].larValue += os;
        if (isNpl(bill)) aoMap[aoName].nplValue += os;
      });
    });
    const totalOsKredit = getTotalOsKredit();

    return Object.values(aoMap).map((item: any) => ({
      ...item,
      larRatio:
        item.totalOs > 0
          ? parseFloat(((item.larValue / item.totalOs) * 100).toFixed(2))
          : 0,
      nplRatio:
        item.totalOs > 0
          ? parseFloat(((item.nplValue / item.totalOs) * 100).toFixed(2))
          : 0,
      // nplAo:
      //   item.totalOs > 0
      //     ? Number(((item.nplValue / item.totalOs) * 100).toFixed(2))
      //     : 0,

      nplGross:
        totalOsKredit > 0
          ? Number(((item.nplValue / totalOsKredit) * 100).toFixed(2))
          : 0,
      collectionRate:
        item.totalTagihan > 0
          ? parseFloat(
              ((item.totalRealisasi / item.totalTagihan) * 100).toFixed(2),
            )
          : 0,
    }));
  };

  const getAoKolektibilitasData = () => {
    const aoMap: Record<string, any> = {};
    let noIdx = 1;

    dashboardData.forEach((mitra) => {
      mitra.Billing?.forEach((bill: any) => {
        const aoName = getAoName(bill);
        const rawKol = getKol(bill);
        const kol = rawKol >= 1 && rawKol <= 5 ? rawKol : 1;

        if (!aoMap[aoName]) {
          aoMap[aoName] = {
            no: noIdx++,
            aoName,
            kolMap: {},
            total: createEmptyKolItem(),
          };
        }

        if (!aoMap[aoName].kolMap[kol]) {
          aoMap[aoName].kolMap[kol] = createEmptyKolItem();
        }

        addBillToKolItem(aoMap[aoName].kolMap[kol], bill);
        addBillToKolItem(aoMap[aoName].total, bill);
      });
    });
    const totalOsKredit = getTotalOsKredit();

    return Object.values(aoMap).flatMap((ao: any) => {
      const detailRows = Object.entries(ao.kolMap)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([kol, item]: [string, any], rowIndex) => ({
          ...finalizeKolItem(item, totalOsKredit),
          rowType: "detail",
          no: rowIndex === 0 ? ao.no : "",
          aoName: rowIndex === 0 ? ao.aoName : "",
          kol: Number(kol),
        }));

      if (detailRows.length === 0) return [];

      return [
        ...detailRows,
        {
          ...finalizeKolItem(ao.total, totalOsKredit),
          rowType: "subtotal",
          no: "",
          aoName: "",
          kol: "",
        },
      ];
    });
  };

  // Kolom Tabel Segmentasi Produk
  const productColumns = [
    {
      title: "Nama Produk Kredit",
      dataIndex: "productName",
      key: "productName",
      render: (text: string) => (
        <Text strong>
          <AppstoreOutlined /> {text}
        </Text>
      ),
    },
    {
      title: "Volume",
      dataIndex: "countTransaksi",
      key: "countTransaksi",
      align: "center" as const,
      render: (val: number) => <Tag color="blue">{val} Kontrak</Tag>,
    },
    {
      title: "Total Plafond",
      dataIndex: "totalPlafond",
      key: "totalPlafond",
      render: formatRupiah,
    },
    {
      title: "Sisa Pokok",
      dataIndex: "totalOs",
      key: "totalOs",
      render: formatRupiah,
    },
    {
      title: "Total Tagihan",
      dataIndex: "totalTagihan",
      key: "totalTagihan",
      render: formatRupiah,
    },
    {
      title: "Total Realisasi",
      dataIndex: "totalRealisasi",
      key: "totalRealisasi",
      render: formatRupiah,
    },
    {
      title: "Total Tunggakan",
      dataIndex: "totalTunggakan",
      key: "totalTunggakan",
      render: (val: number) => (
        <Text type={val > 0 ? "danger" : "secondary"} strong>
          {formatRupiah(val)}
        </Text>
      ),
    },
    {
      title: "LAR Kol 2-5",
      dataIndex: "larValue",
      key: "larValue",
      render: formatRupiah,
    },
    {
      title: "Rasio LAR",
      dataIndex: "larRatio",
      key: "larRatio",
      align: "center" as const,
      render: (val: number) => (
        <Tag color={val > 10 ? "red" : val >= 5 ? "orange" : "green"}>
          {val}% LAR
        </Tag>
      ),
    },
    {
      title: "Rasio NPL",
      dataIndex: "nplRatio",
      key: "nplRatio",
      align: "center" as const,
      render: (val: number) => (
        <Tag color={val > 5 ? "red" : val >= 2 ? "orange" : "green"}>
          {val}% NPL
        </Tag>
      ),
    },
    // {
    //   title: "Collection Rate",
    //   key: "rate",
    //   align: "center" as const,
    //   render: (record: any) => {
    //     const rate =
    //       record.totalTagihan > 0
    //         ? (record.totalRealisasi / record.totalTagihan) * 100
    //         : 0;
    //     return (
    //       <Progress
    //         percent={parseFloat(rate.toFixed(1))}
    //         size="small"
    //         status={
    //           rate >= 90 ? "success" : rate >= 75 ? "normal" : "exception"
    //         }
    //       />
    //     );
    //   },
    // },
  ];

  // Kolom Tabel Segmentasi Mitra (Fitur Baru)
  const mitraColumns = [
    {
      title: "Nama Mitra",
      key: "mitraName",
      render: (record: any) => (
        <div>
          <Text strong>
            <TeamOutlined /> {record.mitraName}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Kode: {record.code}
          </Text>
        </div>
      ),
    },
    {
      title: "Volume Transaksi",
      dataIndex: "countTransaksi",
      key: "countTransaksi",
      align: "center" as const,
      render: (val: number) => <Tag color="purple">{val} Transaksi</Tag>,
    },
    {
      title: "Plafond Disalurkan",
      dataIndex: "totalPlafond",
      key: "totalPlafond",
      render: formatRupiah,
    },
    {
      title: "Sisa Pokok",
      dataIndex: "totalOs",
      key: "totalOs",
      render: formatRupiah,
    },
    {
      title: "Target Tagihan",
      dataIndex: "totalTagihan",
      key: "totalTagihan",
      render: formatRupiah,
    },
    {
      title: "Jumlah Realisasi",
      dataIndex: "totalRealisasi",
      key: "totalRealisasi",
      render: formatRupiah,
    },
    {
      title: "Total Tunggakan",
      dataIndex: "totalTunggakan",
      key: "totalTunggakan",
      render: (val: number) => (
        <Text type={val > 0 ? "danger" : "secondary"} strong>
          {formatRupiah(val)}
        </Text>
      ),
    },
    {
      title: "LAR Kol 2-5",
      dataIndex: "larValue",
      key: "larValue",
      render: (val: number) => (
        <Text type={val > 0 ? "danger" : "secondary"} strong>
          {formatRupiah(val)}
        </Text>
      ),
    },
    {
      title: "Rasio NPL Mitra",
      dataIndex: "nplMitra",
      key: "nplMitra",
      align: "center" as const,
      sorter: (a: any, b: any) => a.nplMitra - b.nplMitra,
      render: (npl: number) => {
        let color = "green";
        if (npl >= 2 && npl <= 5) color = "orange";
        if (npl > 5) color = "red";
        return (
          <Tag color={color} style={{ fontWeight: "bold" }}>
            {npl}% NPL
          </Tag>
        );
      },
    },
    // {
    //   title: "Efektivitas Setoran",
    //   key: "mitraRate",
    //   width: 150,
    //   render: (record: any) => {
    //     const rate =
    //       record.totalTagihan > 0
    //         ? (record.totalRealisasi / record.totalTagihan) * 100
    //         : 0;
    //     return (
    //       <Space direction="vertical" size={0} style={{ width: "100%" }}>
    //         <Progress
    //           percent={parseFloat(rate.toFixed(1))}
    //           size="small"
    //           status={rate >= 90 ? "success" : "normal"}
    //         />
    //       </Space>
    //     );
    //   },
    // },
    {
      title: "Rasio LAR",
      dataIndex: "larMitra",
      key: "larMitra",
      align: "center" as const,
      sorter: (a: any, b: any) => a.larMitra - b.larMitra,
      render: (lar: number) => {
        let color = "green";
        if (lar >= 5 && lar <= 10) color = "orange";
        if (lar > 10) color = "red";

        return (
          <Tag color={color} style={{ fontWeight: "bold" }}>
            {lar}% LAR
          </Tag>
        );
      },
    },
  ];

  const aoColumns = [
    {
      title: "Nama AO",
      key: "aoName",
      render: (record: any) => (
        <div>
          <Text strong>
            <TeamOutlined /> {record.aoName}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.countTransaksi} rekening
          </Text>
        </div>
      ),
    },
    {
      title: "Volume Transaksi",
      dataIndex: "countTransaksi",
      key: "countTransaksi",
      align: "center" as const,
      render: (val: number) => <Tag color="blue">{val} Rekening</Tag>,
    },
    {
      title: "Sisa Pokok",
      dataIndex: "totalOs",
      key: "totalOs",
      render: formatRupiah,
    },
    {
      title: "Target Tagihan",
      dataIndex: "totalTagihan",
      key: "totalTagihan",
      render: formatRupiah,
    },
    {
      title: "Jumlah Realisasi",
      dataIndex: "totalRealisasi",
      key: "totalRealisasi",
      render: formatRupiah,
    },
    {
      title: "Total Tunggakan",
      dataIndex: "totalTunggakan",
      key: "totalTunggakan",
      render: (val: number) => (
        <Text type={val > 0 ? "danger" : "secondary"} strong>
          {formatRupiah(val)}
        </Text>
      ),
    },
    {
      title: "LAR Kol 2-5",
      dataIndex: "larValue",
      key: "larValue",
      render: (val: number) => (
        <Text type={val > 0 ? "danger" : "secondary"} strong>
          {formatRupiah(val)}
        </Text>
      ),
    },
    {
      title: "Rasio NPL",
      dataIndex: "nplRatio",
      key: "nplRatio",
      align: "center" as const,
      sorter: (a: any, b: any) => a.nplRatio - b.nplRatio,
      render: (npl: number) => {
        let color = "green";
        if (npl >= 2 && npl <= 5) color = "orange";
        if (npl > 5) color = "red";
        return (
          <Tag color={color} style={{ fontWeight: "bold" }}>
            {npl}% NPL
          </Tag>
        );
      },
    },
    {
      title: "Rasio LAR",
      dataIndex: "larRatio",
      key: "larRatio",
      align: "center" as const,
      sorter: (a: any, b: any) => a.larRatio - b.larRatio,
      render: (lar: number) => {
        let color = "green";
        if (lar >= 5 && lar <= 10) color = "orange";
        if (lar > 10) color = "red";
        return (
          <Tag color={color} style={{ fontWeight: "bold" }}>
            {lar}% LAR
          </Tag>
        );
      },
    },
    {
      title: "Collection Rate",
      key: "collectionRate",
      width: 150,
      render: (record: any) => (
        <Progress
          percent={record.collectionRate}
          size="small"
          status={
            record.collectionRate >= 90
              ? "success"
              : record.collectionRate >= 75
                ? "normal"
                : "exception"
          }
        />
      ),
    },
  ];

  const getNplColor = (npl: number) => {
    if (npl < 2) return "#52c41a";
    if (npl <= 5) return "#faad14";
    return "#f5222d";
  };

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh" }}>
      {/* Header Dashboard */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "24px" }}
      >
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            💼 Dashboard Eksekutif Portofolio Kredit
          </Title>
          <Text type="secondary">
            Kombinasi data efektivitas billing dan matriks risiko mitra tanpa
            grafik kompleks.
          </Text>
        </Col>
        <Col>
          <Space size={12}>
            <DatePicker
              picker="month"
              onChange={(_date, datestr) => setSelectedMonth(datestr as string)}
              allowClear={true}
              placeholder="Pilih Periode"
              style={{ width: 160 }}
            />
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel5Sheets}
              style={{ backgroundColor: "#217346", borderColor: "#217346" }}
            >
              Export ExcelJS (6 Sheet)
            </Button>
            <Button
              type="default"
              icon={<PrinterOutlined />}
              onClick={() =>
                printKredit(
                  {
                    instansiData: getInstansiBaseData().sort(
                      (a, b) => a.plafondDisalurkan - b.plafondDisalurkan,
                    ),
                    segmentData: getSegmentasiBaseData(),
                    instansiKolData: getInstansiKolektibilitasData(),
                    segmentKolData: getSegmentasiKolektibilitasData(),
                    aoData: getAnalisisAoData(),
                    aoKolData: getAoKolektibilitasData(),
                    nplPaymentData: getNplPaymentData(),
                    woData,
                  },
                  selectedMonth,
                )
              }
            >
              Cetak PDF / Print
            </Button>
          </Space>
        </Col>
      </Row>

      <Spin spinning={loading} tip="Memuat Analisis Laporan...">
        {/* Row 1: KPI Angka Utama */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ borderTop: "4px solid #1890ff" }}>
              <Statistic
                title="Total Sisa Pokok"
                value={summary.totalOs}
                formatter={(v) => formatRupiah(v as number)}
                prefix={<DollarOutlined style={{ color: "#1890ff" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ borderTop: "4px solid #faad14" }}>
              <Statistic
                title="Total Nilai Tagihan"
                value={summary.totalValue}
                formatter={(v) => formatRupiah(v as number)}
                prefix={<FileTextOutlined style={{ color: "#faad14" }} />}
              />
              <Text
                type="secondary"
                style={{ fontSize: "12px", display: "block", marginTop: "8px" }}
              >
                👥 {summary.debs} Debitur/Rekening
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ borderTop: "4px solid #52c41a" }}>
              <Statistic
                title="Total Bayar"
                value={summary.totalRealize}
                formatter={(v) => formatRupiah(v as number)}
                prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              />
              <Text
                type="secondary"
                style={{ fontSize: "12px", display: "block", marginTop: "8px" }}
              >
                👥 {summary.debspay} Debitur/Rekening
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ borderTop: "4px solid #52c41a" }}>
              <Statistic
                title="Total Partial"
                value={summary.totalPartial}
                formatter={(v) => formatRupiah(v as number)}
                prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              />
              <Text
                type="secondary"
                style={{ fontSize: "12px", display: "block", marginTop: "8px" }}
              >
                👥 {summary.debspartial} Debitur/Rekening
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ borderTop: "4px solid #f5222d" }}>
              <Statistic
                title="Total Belum Bayar"
                value={summary.totalValue - summary.totalRealize}
                formatter={(v) => formatRupiah(v as number)}
                prefix={<WarningOutlined style={{ color: "#f5222d" }} />}
              />
              <Text
                type="secondary"
                style={{ fontSize: "12px", display: "block", marginTop: "8px" }}
              >
                👥 {summary.debs - (summary.debspay + summary.debspartial)}{" "}
                Debitur/Rekening
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Row 2: Visual Lingkaran Efektivitas */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} md={12}>
            <Card
              title="🎯 Rasio Efektivitas Penagihan (Collection Rate)"
              bordered={false}
            >
              <Row align="middle" justify="space-around">
                <Col>
                  <Progress
                    type="dashboard"
                    percent={summary.collectionRate}
                    strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
                    width={120}
                  />
                </Col>
                <Col>
                  <div style={{ maxWidth: 220 }}>
                    <Statistic
                      title="Berhasil Direalisasi"
                      value={summary.collectionRate}
                      precision={2}
                      suffix="%"
                      valueStyle={{ color: "#3f8600" }}
                      prefix={<ArrowUpOutlined />}
                    />
                    <p
                      style={{
                        marginTop: 8,
                        color: "#8c8c8c",
                        fontSize: "12px",
                      }}
                    >
                      Persentase dana tagihan aktif yang sukses disetor kembali
                      oleh seluruh mitra.
                    </p>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title="⚠️ Analisis Tingkat Risiko Kredit (NPL Gross)"
              bordered={false}
            >
              <Row align="middle" justify="space-around">
                <Col xs={24} sm={12} lg={8}>
                  <Progress
                    type="dashboard"
                    percent={summary.nplPercentage}
                    status={summary.nplPercentage > 5 ? "exception" : "normal"}
                    strokeColor={getNplColor(summary.nplPercentage)}
                    width={120}
                  />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <div style={{ maxWidth: 220 }}>
                    <Statistic
                      title="Rasio NPL Saat Ini"
                      value={summary.nplPercentage}
                      precision={2}
                      suffix="%"
                      valueStyle={{ color: getNplColor(summary.nplPercentage) }}
                      prefix={
                        summary.nplPercentage > 5 ? (
                          <ArrowUpOutlined />
                        ) : (
                          <ArrowDownOutlined />
                        )
                      }
                    />
                    <div style={{ marginTop: 4 }}>
                      {summary.nplPercentage < 2 && (
                        <Tag color="green">AMAN (SEHAT)</Tag>
                      )}
                      {summary.nplPercentage >= 2 &&
                        summary.nplPercentage <= 5 && (
                          <Tag color="warning">WASWADA</Tag>
                        )}
                      {summary.nplPercentage > 5 && (
                        <Tag color="error">CRITICAL</Tag>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="🟣 Loan at Risk (LAR) Kol 2 - Kol 5" bordered={false}>
              <Row align="middle" justify="space-around">
                <Col>
                  <Progress
                    type="dashboard"
                    percent={summary.larPercentage}
                    status={summary.larPercentage > 10 ? "exception" : "normal"}
                    strokeColor="#722ed1"
                    width={120}
                  />
                </Col>
                <Col>
                  <div style={{ maxWidth: 220 }}>
                    <Statistic
                      title="Rasio LAR Saat Ini"
                      value={summary.larPercentage}
                      precision={2}
                      suffix="%"
                      valueStyle={{ color: "#722ed1" }}
                      prefix={<WarningOutlined />}
                    />
                    <p
                      style={{
                        marginTop: 8,
                        color: "#8c8c8c",
                        fontSize: "12px",
                      }}
                    >
                      LAR dihitung dari total outstanding kredit kolektibilitas
                      2 sampai 5 dibanding total outstanding kredit.
                    </p>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Tren Tagihan Bulanan
                  </h3>
                  <p className="text-xs text-slate-400">
                    Perbandingan total tagihan, pembayaran, dan pembayaran NPL
                    12 bulan terakhir
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "13px", paddingTop: "15px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Tagihan"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Pembayaran"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Pembayaran NPL"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Col>
        </Row>

        {/* Row 3: Pengganti Chart Utama dengan Sistem Tab Konten Komparasi Data */}
        <Card bordered={false} style={{ padding: "4px" }}>
          <Tabs defaultActiveKey="1" type="card">
            <Tabs.TabPane
              tab={
                <span>
                  <TeamOutlined /> Analisis Performa Per Mitra
                </span>
              }
              key="1"
            >
              <div style={{ padding: "8px 0" }}>
                <Table
                  dataSource={getAnalisisMitraData()}
                  columns={mitraColumns}
                  // pagination={{ pageSize: 5 }}
                  scroll={{ x: 1000 }}
                  size="small"
                />
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane
              tab={
                <span>
                  <AppstoreOutlined /> Analisis Per Segmen Kredit
                </span>
              }
              key="2"
            >
              <div style={{ padding: "8px 0" }}>
                <Table
                  dataSource={getSegmentasiProdukData()}
                  columns={productColumns}
                  // pagination={{ pageSize: 5 }}
                  scroll={{ x: 1000 }}
                  size="small"
                />
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane
              tab={
                <span>
                  <TeamOutlined /> Analisis Per AO
                </span>
              }
              key="3"
            >
              <div style={{ padding: "8px 0" }}>
                <Table
                  dataSource={getAnalisisAoData()}
                  columns={aoColumns}
                  scroll={{ x: 1300 }}
                  size="small"
                />
              </div>
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </Spin>
    </div>
  );
}
