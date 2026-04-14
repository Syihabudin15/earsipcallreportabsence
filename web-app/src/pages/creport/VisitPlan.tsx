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
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api from "../../libs/api";
import type { IVisit } from "../../libs/interface";

const VisitPlan = () => {
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
        // Filter untuk visits yang masih dalam status rencana (date_action null)
        const planData = res.data.data.filter((v: IVisit) => !v.date_action);
        setData(planData);
        setTotal(planData.length);
      }
    } catch (error) {
      message.error("Gagal mengambil data rencana kunjungan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Hapus Rencana Kunjungan",
      content: "Apakah Anda yakin ingin menghapus rencana kunjungan ini?",
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
      title: "Kategori",
      dataIndex: ["VisitCategory", "name"],
      key: "category",
      width: 120,
    },
    {
      title: "Status",
      dataIndex: ["VisitStatus", "name"],
      key: "status",
      render: (status) => <Tag color="blue">{status}</Tag>,
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Rencana">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() =>
                (window.location.href = `/app/callreport/visit/upsert/${record.id}`)
              }
            />
          </Tooltip>
          <Tooltip title="Eksekusi Kunjungan">
            <Button
              type="dashed"
              size="small"
              icon={<CheckOutlined />}
              onClick={() =>
                (window.location.href = `/app/callreport/visit/upsert/${record.id}`)
              }
            />
          </Tooltip>
          <Tooltip title="Hapus Rencana">
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
        <h1 className="text-2xl font-bold">Rencana Kunjungan</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            (window.location.href = "/app/callreport/visit/upsert")
          }
        >
          Buat Rencana
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
            emptyText: <Empty description="Tidak ada rencana kunjungan" />,
          }}
        />
      </Spin>
    </div>
  );
};

export default VisitPlan;
