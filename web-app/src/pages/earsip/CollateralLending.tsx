import { useEffect, useState } from "react";
import { Table, Empty, Button, Space, Modal, message, Spin } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api from "../../libs/api";
import type { ICollateralLending } from "../../libs/interface";

const CollateralLending = () => {
  const [data, setData] = useState<ICollateralLending[]>([]);
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
        url: "/collateral_lending",
        method: "GET",
        params: { page, limit: 10, search },
      });
      if (res?.data) {
        setData(res.data.data);
        setTotal(res.data.total);
      }
    } catch (error) {
      message.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Hapus Peminjaman Jaminan",
      content: "Apakah Anda yakin ingin menghapus data ini?",
      okText: "Ya",
      cancelText: "Tidak",
      onOk: async () => {
        try {
          await api.request({
            url: "/collateral_lending",
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

  const columns: ColumnsType<ICollateralLending> = [
    {
      title: "No",
      render: (_, __, index) => (page - 1) * 10 + index + 1,
      width: 50,
    },
    {
      title: "Nasabah",
      dataIndex: ["Submission", "Debitur", "fullname"],
      key: "nasabah",
    },
    {
      title: "NIK",
      dataIndex: ["Submission", "Debitur", "nik"],
      key: "nik",
    },
    {
      title: "Tanggal Peminjaman",
      dataIndex: "start_at",
      key: "start_at",
      render: (date) => new Date(date).toLocaleDateString("id-ID"),
    },
    {
      title: "Tanggal Pengembalian",
      dataIndex: "return_at",
      key: "return_at",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("id-ID") : "-",
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<EyeOutlined />} />
          <Button type="default" size="small" icon={<EditOutlined />} />
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Peminjaman Jaminan</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            (window.location.href = "/app/earsip/collateral_lending/upsert")
          }
        >
          Tambah Peminjaman
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
            emptyText: <Empty description="Tidak ada data" />,
          }}
        />
      </Spin>
    </div>
  );
};

export default CollateralLending;
