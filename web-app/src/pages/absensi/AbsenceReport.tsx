import {
  Button,
  Card,
  DatePicker,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import api from "../../libs/api";
import moment from "moment";
import { useSearchParams } from "react-router-dom";

const { Title } = Typography;
const { Option } = Select;

interface ReportData {
  user: {
    id: string;
    fullname: string;
    nik: string;
  };
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
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [reportType, setReportType] = useState<"monthly" | "daily">("monthly");

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "daily" || type === "monthly") {
      setReportType(type);
    }
  }, [searchParams]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.request({
        url: `${import.meta.env.VITE_API_URL}/absence/report?type=${reportType}&month=${selectedMonth}&year=${selectedYear}`,
        method: "GET",
      });
      setReportData(response.data.data);
    } catch (error) {
      console.error("Error fetching report:", error);
    }
    setLoading(false);
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

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-absensi-${selectedYear}-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
        >
          Export CSV
        </Button>
      </div>

      <Card>
        <Space className="mb-4">
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
            value={moment(`${selectedYear}-${selectedMonth}`, "YYYY-M")}
            onChange={(date) => {
              if (date) {
                setSelectedMonth(date.month() + 1);
                setSelectedYear(date.year());
              }
            }}
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
