import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  type TableProps,
} from "antd";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IPageProps,
  IPermitFile,
  IUser,
} from "../../libs/interface";
import api from "../../libs/api";
import useContext from "../../libs/context";
import { useSearchParams } from "react-router-dom";

export default function DataPermitFile() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [pageprops, setPageprops] = useState<IPageProps<IPermitFile>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    action: searchParams.get("type")?.toUpperCase() || "",
    permit_status: "",
  });
  const [actionModal, setActionModal] = useState<IActionPage<IPermitFile>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const [form, setForm] = useState({
    action: pageprops.action || "DOWNLOAD",
    description: "",
    submissionIds: "",
  });
  const { modal, user, hasAccess } = useContext((state: any) => state);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) params.append("search", pageprops.search);
    if (pageprops.action) params.append("action", pageprops.action);
    if (pageprops.permit_status)
      params.append("permit_status", pageprops.permit_status);

    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/permitfile?${params.toString()}`,
        method: "GET",
      })
      .then((res) =>
        setPageprops((prev) => ({
          ...prev,
          data: res.data.data,
          total: res.data.total,
        })),
      );
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageprops.page, pageprops.limit, pageprops.search, pageprops.action]);

  const submitRequest = async () => {
    setLoading(true);
    const submissionIds = form.submissionIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (submissionIds.length === 0) {
      modal.error({
        title: "Data tidak lengkap",
        content: "Masukkan minimal satu ID permohonan",
      });
      setLoading(false);
      return;
    }

    const data = {
      action: form.action,
      description: form.description,
      requesterId: user?.id || "",
      PermitFileDetail: submissionIds.map((submissionId) => ({
        submissionId,
      })),
    };

    const requestConfig = actionModal.record
      ? {
          url: `${import.meta.env.VITE_API_URL}/permitfile?id=${actionModal.record.id}`,
          method: "PUT",
          data,
        }
      : {
          url: `${import.meta.env.VITE_API_URL}/permitfile`,
          method: "POST",
          data,
        };

    await api
      .request(requestConfig)
      .then(() => {
        modal.success({
          title: actionModal.record
            ? "Permohonan berhasil diperbarui"
            : "Permohonan berhasil dibuat",
        });
        setActionModal({ ...actionModal, upsert: false, record: undefined });
        setForm({ action: form.action, description: "", submissionIds: "" });
        getData();
      })
      .catch(() => {
        modal.error({
          title: actionModal.record
            ? "Gagal memperbarui permohonan"
            : "Gagal membuat permohonan",
        });
      });
    setLoading(false);
  };

  const handleProcess = async (record: IPermitFile, status: string) => {
    setLoading(true);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/permitfile?id=${record.id}&action=${status}&userId=${user?.id}`,
        method: "PATCH",
      })
      .then(() => {
        modal.success({
          title: `Permohonan berhasil ${status === "APPROVED" ? "disetujui" : "ditolak"}`,
        });
        getData();
      })
      .catch(() => {
        modal.error({
          title: "Gagal memproses permohonan",
        });
      });
    setLoading(false);
  };

  const columns: TableProps<IPermitFile>["columns"] = [
    {
      title: "ID",
      key: "id",
      dataIndex: "id",
      render(value, _record, index) {
        return (
          <div>
            <div>{(pageprops.page - 1) * pageprops.limit + index + 1}</div>
            <div className="text-xs opacity-80">{value}</div>
          </div>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      dataIndex: "action",
      render(value) {
        return <Tag color={value === "DELETE" ? "red" : "blue"}>{value}</Tag>;
      },
    },
    {
      title: "Status",
      key: "permit_status",
      dataIndex: "permit_status",
      render(value) {
        const color =
          value === "APPROVED"
            ? "green"
            : value === "REJECTED"
              ? "red"
              : "gold";
        return <Tag color={color}>{value}</Tag>;
      },
    },
    {
      title: "Detail",
      key: "description",
      dataIndex: "description",
      render(value, record) {
        return (
          <div>
            <div>{value || "-"}</div>
            <div className="text-xs opacity-70">
              {record.PermitFileDetail?.length || 0} permohonan
            </div>
          </div>
        );
      },
    },
    {
      title: "Dibuat",
      key: "created_at",
      dataIndex: "created_at",
      render(value) {
        return value ? new Date(value).toLocaleString() : "-";
      },
    },
    {
      title: "Aksi",
      key: "actionButtons",
      render(_, record) {
        return (
          <Space wrap>
            {hasAccess(window.location.pathname, "write") && (
              <Button
                size="small"
                icon={<Edit size={14} />}
                onClick={() => {
                  setActionModal({ ...actionModal, upsert: true, record });
                  setForm({
                    action: record.action || "DOWNLOAD",
                    description: record.description || "",
                    submissionIds:
                      record.PermitFileDetail?.map(
                        (detail) => detail.submissionId,
                      ).join(", ") || "",
                  });
                }}
              >
                Edit
              </Button>
            )}
            {hasAccess(window.location.pathname, "process") &&
              record.permit_status === "PENDING" && (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleProcess(record, "APPROVED")}
                >
                  Setuju
                </Button>
              )}
            {hasAccess(window.location.pathname, "process") &&
              record.permit_status === "PENDING" && (
                <Button
                  size="small"
                  danger
                  onClick={() => handleProcess(record, "REJECTED")}
                >
                  Tolak
                </Button>
              )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Permohonan File</h1>
          <p className="text-slate-500 text-sm">
            Permohonan download dan hapus file E-Arsip.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => setActionModal({ ...actionModal, upsert: true })}
          >
            Buat Permohonan
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
          <Input.Search
            placeholder="Cari ID atau deskripsi..."
            allowClear
            onSearch={(value) => setPageprops({ ...pageprops, search: value })}
            style={{ width: 320 }}
            size="small"
          />
          <Select
            size="small"
            value={pageprops.action || undefined}
            style={{ width: 200 }}
            placeholder="Filter aksi"
            allowClear
            options={[
              { label: "DOWNLOAD", value: "DOWNLOAD" },
              { label: "DELETE", value: "DELETE" },
            ]}
            onChange={(value) => setPageprops({ ...pageprops, action: value })}
          />
          <Select
            size="small"
            value={pageprops.permit_status || undefined}
            style={{ width: 200 }}
            placeholder="Filter status"
            allowClear
            options={[
              { label: "PENDING", value: "PENDING" },
              { label: "APPROVED", value: "APPROVED" },
              { label: "REJECTED", value: "REJECTED" },
            ]}
            onChange={(value) =>
              setPageprops({ ...pageprops, permit_status: value })
            }
          />
        </div>

        <Table
          size="small"
          loading={loading}
          rowKey={(record) => record.id}
          bordered
          scroll={{ x: "max-content", y: window.innerWidth > 640 ? 520 : 420 }}
          dataSource={pageprops.data}
          columns={columns}
          pagination={{
            current: pageprops.page,
            pageSize: pageprops.limit,
            total: pageprops.total,
            onChange: (page, pageSize) =>
              setPageprops({ ...pageprops, page, limit: pageSize }),
            pageSizeOptions: [50, 100, 500],
            size: "small",
          }}
        />
      </div>

      <Modal
        title={actionModal.record ? "Ubah Permohonan" : "Buat Permohonan File"}
        open={actionModal.upsert}
        onCancel={() => {
          setActionModal({ ...actionModal, upsert: false, record: undefined });
        }}
        onOk={submitRequest}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={loading}
      >
        <Space direction="vertical" className="w-full">
          <Select
            value={form.action}
            onChange={(value) => setForm({ ...form, action: value })}
            options={[
              { label: "DOWNLOAD", value: "DOWNLOAD" },
              { label: "DELETE", value: "DELETE" },
            ]}
            size="middle"
          />
          <Input.TextArea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Deskripsi permohonan"
          />
          <Input.TextArea
            value={form.submissionIds}
            onChange={(e) =>
              setForm({ ...form, submissionIds: e.target.value })
            }
            rows={3}
            placeholder="Masukkan ID permohonan, pisahkan dengan koma"
          />
        </Space>
      </Modal>
    </div>
  );
}
