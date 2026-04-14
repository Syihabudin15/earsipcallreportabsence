import { useEffect, useState } from "react";
import {
  Table,
  Empty,
  Button,
  Space,
  Modal,
  message,
  Spin,
  Tag,
  Tooltip,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { IVisit } from "../../libs/interface";
import api from "../../libs/api";

const VisitResult = () => {
  const [data, setData] = useState<IVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: "/visit",
        method: "GET",
        params: { page, limit: 10, search },
      });
      if (res?.data) {
        // Filter untuk visits yang sudah memiliki hasil (date_action not null)
        const resultData = res.data.data.filter((v: IVisit) => v.date_action);
        setData(resultData);
        setTotal(resultData.length);
      }
    } catch (error) {
      message.error("Gagal mengambil data hasil kunjungan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Hapus Hasil Kunjungan",
      content: "Apakah Anda yakin ingin menghapus hasil kunjungan ini?",
      okText: "Ya",
      cancelText: "Tidak",
      onOk: async () => {
        try {
          await api.request({
            url: "/visit",
            method: "DELETE",
            params: { id },
          });
          message.success("Data berhasil dihapus");
          fetchData();
        } catch (error) {
          message.error("Gagal menghapus data");
        }
      },
    });
  };

  const columns: ColumnsType<IVisit> = [
    {
      title: "No",
      render: (_, __, index) => (page - 1) * 10 + index + 1,
      width: 50,
    },
    {
      title: "Nasabah",
      dataIndex: ["Debitur", "fullname"],
      key: "nasabah",
    },
    {
      title: "NIK",
      dataIndex: ["Debitur", "nik"],
      key: "nik",
      width: 120,
    },
    {
      title: "Tanggal Rencana",
      dataIndex: "date_plan",
      key: "date_plan",
      render: (date) => new Date(date).toLocaleDateString("id-ID"),
      width: 140,
    },
    {
      title: "Tanggal Eksekusi",
      dataIndex: "date_action",
      key: "date_action",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("id-ID") : "-",
      width: 140,
    },
    {
      title: "Hasil",
      dataIndex: ["VisitStatus", "name"],
      key: "result",
      render: (status) => <Tag color="green">{status}</Tag>,
    },
    {
      title: "Kategori",
      dataIndex: ["VisitCategory", "name"],
      key: "category",
      width: 120,
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <Space>
          <Tooltip title="Lihat Detail">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() =>
                (window.location.href = `/app/callreport/visit/${record.id}`)
              }
            />
          </Tooltip>
          <Tooltip title="Edit Hasil">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() =>
                (window.location.href = `/app/callreport/visit/upsert/${record.id}`)
              }
            />
          </Tooltip>
          <Tooltip title="Hapus Hasil">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Hasil Kunjungan</h1>
        <Button
          type="default"
          icon={<DownloadOutlined />}
          onClick={() => message.info("Fitur export akan segera tersedia")}
        >
          Export
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            total,
            pageSize: 10,
            current: page,
            onChange: (newPage) => setPage(newPage),
          }}
          locale={{
            emptyText: <Empty description="Tidak ada hasil kunjungan" />,
          }}
        />
      </Spin>
    </div>
  );
};

export default VisitResult;
