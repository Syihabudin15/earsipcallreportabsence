import {
  Button,
  Card,
  DatePicker,
  Select,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import api from "../../libs/api";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";

const { Title } = Typography;
const { Option } = Select;

interface User {
  id: string;
  fullname: string;
  nik: string;
}

interface ReportData {
  user: User;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  details: any[];
}

export default function AbsenceReport() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    dayjs().month() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [reportType, setReportType] = useState<"monthly" | "daily">("monthly");

  // Initialize report type from URL params
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "daily" || type === "monthly") {
      setReportType(type);
    }
  }, [searchParams]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const queryString = new URLSearchParams({
        type: reportType,
        month: String(selectedMonth),
        year: String(selectedYear),
      }).toString();

      const response = await api.get(`/absence/report?${queryString}`);

      if (response.data?.data && Array.isArray(response.data.data)) {
        setReportData(response.data.data);
      } else {
        setReportData([]);
      }
    } catch (error: any) {
      console.error("Fetch Report Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });
      const errorMsg =
        error.response?.data?.msg || "Gagal mengambil data laporan";
      message.error(errorMsg);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear, reportType]);

  const columns: ColumnsType<ReportData> = [
    {
      title: "Nama",
      dataIndex: ["user", "fullname"],
      key: "fullname",
    },
    {
      title: "NIK",
      dataIndex: ["user", "nik"],
      key: "nik",
    },
    {
      title: "Total Hari",
      dataIndex: "totalDays",
      key: "totalDays",
    },
    {
      title: "Hadir",
      dataIndex: "presentDays",
      key: "presentDays",
    },
    {
      title: "Terlambat",
      dataIndex: "lateDays",
      key: "lateDays",
    },
    {
      title: "Tidak Hadir",
      dataIndex: "absentDays",
      key: "absentDays",
    },
  ];

  const exportToCSV = () => {
    if (!reportData || reportData.length === 0) {
      message.warning("Tidak ada data untuk di-export");
      return;
    }

    const csvContent = [
      ["Nama", "NIK", "Total Hari", "Hadir", "Terlambat", "Tidak Hadir"],
      ...reportData.map((item) => [
        item.user.fullname,
        item.user.nik || "",
        item.totalDays,
        item.presentDays,
        item.lateDays,
        item.absentDays,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `laporan-absensi-${reportType}-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`,
    );
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleMonthChange = (date: any) => {
    if (date) {
      setSelectedMonth(date.month() + 1);
      setSelectedYear(date.year());
    }
  };

  const currentDate = dayjs()
    .year(selectedYear)
    .month(selectedMonth - 1)
    .date(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={2}>
            Laporan Absensi {reportType === "monthly" ? "Bulanan" : "Harian"}
          </Title>
          <p className="text-slate-500 text-sm">
            Rekapan {reportType === "monthly" ? "bulanan" : "harian"} absensi
            karyawan untuk penggajian.
          </p>
        </div>
        <Button
          type="primary"
          icon={<Download size={14} />}
          onClick={exportToCSV}
          loading={loading}
        >
          Export CSV
        </Button>
      </div>

      <Card>
        <Space className="mb-4" wrap>
          <Select
            value={reportType}
            onChange={setReportType}
            style={{ width: 120 }}
          >
            <Option value="monthly">Bulanan</Option>
            <Option value="daily">Harian</Option>
          </Select>

          <DatePicker
            picker="month"
            value={currentDate}
            onChange={handleMonthChange}
            format="MMMM YYYY"
          />
        </Space>

        <Table
          columns={columns}
          dataSource={reportData}
          loading={loading}
          rowKey={(record) => record.user.id}
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
}
