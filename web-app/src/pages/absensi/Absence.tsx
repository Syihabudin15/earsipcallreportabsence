import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  type TableProps,
  Row,
  Col,
} from "antd";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IAbsence,
  IPageProps,
  IUser,
} from "../../libs/interface";
import api from "../../libs/api";
import useContext from "../../libs/context";
import moment from "moment";

export default function DataAbsence() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IAbsence>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    date: moment().format("YYYY-MM-DD"),
  });
  const [action, setAction] = useState<IActionPage<IAbsence>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const [users, setUsers] = useState<IUser[]>([]);
  const [form, setForm] = useState<Partial<IAbsence>>({
    method: "BUTTON",
    absence_status: "HADIR",
    description: "",
    userId: "",
  });
  const { modal, hasAccess } = useContext((state: any) => state);

  const getAbsences = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) params.append("search", pageprops.search);
    if (pageprops.date) params.append("date", pageprops.date);

    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/absence?${params.toString()}`,
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

  const getUsers = async () => {
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/user?page=1&limit=200`,
        method: "GET",
      })
      .then((res) => setUsers(res.data.data));
  };

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      await getAbsences();
    }, 200);
    return () => clearTimeout(timer);
  }, [pageprops.page, pageprops.limit, pageprops.search, pageprops.date]);

  const submitAbsence = async () => {
    setLoading(true);
    if (!form.userId) {
      modal.error({ title: "Pilih pengguna terlebih dahulu" });
      setLoading(false);
      return;
    }

    const body = {
      ...form,
      check_out: form.check_out ? form.check_out : undefined,
    };

    try {
      if (action.record) {
        await api.request({
          url: `${import.meta.env.VITE_API_URL}/absence?id=${action.record.id}`,
          method: "PUT",
          data: body,
        });
        modal.success({ title: "Data absensi berhasil dirubah" });
      } else {
        await api.request({
          url: `${import.meta.env.VITE_API_URL}/absence`,
          method: "POST",
          data: body,
        });
        modal.success({ title: "Absen berhasil ditambahkan" });
      }
      setAction({ ...action, upsert: false, record: undefined });
      setForm({
        method: "BUTTON",
        absence_status: "HADIR",
        description: "",
        userId: "",
      });
      await getAbsences();
    } catch (err) {
      modal.error({ title: "Terjadi kesalahan saat menyimpan data" });
    }
    setLoading(false);
  };

  const deleteAbsence = async (record: IAbsence) => {
    setLoading(true);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/absence?id=${record.id}`,
        method: "DELETE",
      })
      .then(() => {
        modal.success({ title: "Data absensi berhasil dihapus" });
        getAbsences();
      })
      .catch(() => {
        modal.error({ title: "Gagal menghapus data absensi" });
      });
    setLoading(false);
  };

  const columns: TableProps<IAbsence>["columns"] = [
    {
      title: "No",
      key: "no",
      dataIndex: "id",
      render(_value, _record, index) {
        return (pageprops.page - 1) * pageprops.limit + index + 1;
      },
    },
    {
      title: "Nama",
      key: "fullname",
      render(_value, record) {
        return record.User?.fullname || "-";
      },
    },
    {
      title: "Metode",
      key: "method",
      dataIndex: "method",
    },
    {
      title: "Status",
      key: "absence_status",
      dataIndex: "absence_status",
      render(value) {
        const color =
          value === "HADIR"
            ? "green"
            : value === "TERLAMBAT"
              ? "orange"
              : "red";
        return <Tag color={color}>{value}</Tag>;
      },
    },
    {
      title: "Masuk",
      key: "check_in",
      dataIndex: "check_in",
      render(value) {
        return value ? moment(value).format("YYYY-MM-DD HH:mm") : "-";
      },
    },
    {
      title: "Pulang",
      key: "check_out",
      dataIndex: "check_out",
      render(value) {
        return value ? moment(value).format("YYYY-MM-DD HH:mm") : "-";
      },
    },
    {
      title: "Keterangan",
      key: "description",
      dataIndex: "description",
    },
    {
      title: "Aksi",
      key: "action",
      render(_, record) {
        return (
          <Space wrap>
            {hasAccess(window.location.pathname, "update") && (
              <Button
                size="small"
                icon={<Edit size={12} />}
                onClick={() => {
                  setAction({ ...action, upsert: true, record });
                  setForm({
                    ...record,
                    userId: record.userId,
                    check_out: record.check_out,
                  });
                }}
              />
            )}
            {hasAccess(window.location.pathname, "delete") && (
              <Button
                size="small"
                danger
                icon={<Trash2 size={12} />}
                onClick={() => deleteAbsence(record)}
              />
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
          <h1 className="text-2xl font-black">Absensi</h1>
          <p className="text-slate-500 text-sm">
            Manajemen data absensi karyawan.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasAccess(window.location.pathname, "write") && (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => {
                setAction({ ...action, upsert: true, record: undefined });
                setForm({
                  method: "BUTTON",
                  absence_status: "HADIR",
                  description: "",
                  userId: "",
                });
              }}
            >
              Tambah Absensi
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3 items-center mb-4">
          <Input.Search
            placeholder="Cari nama atau NIK..."
            allowClear
            onSearch={(value) => setPageprops({ ...pageprops, search: value })}
            style={{ minWidth: 240 }}
            size="small"
          />
          <DatePicker
            size="small"
            value={pageprops.date ? moment(pageprops.date) : undefined}
            onChange={(value) =>
              setPageprops({
                ...pageprops,
                date: value ? value.format("YYYY-MM-DD") : "",
              })
            }
          />
        </div>

        <Table
          size="small"
          loading={loading}
          rowKey={(record) => record.id}
          bordered
          scroll={{ x: "max-content", y: window.innerWidth > 640 ? 520 : 420 }}
          columns={columns}
          dataSource={pageprops.data}
          pagination={{
            current: pageprops.page,
            pageSize: pageprops.limit,
            total: pageprops.total,
            onChange: (page, pageSize) =>
              setPageprops({ ...pageprops, page, limit: pageSize }),
            pageSizeOptions: [50, 100, 200],
            size: "small",
          }}
        />
      </div>

      <Modal
        title={action.record ? "Ubah Absensi" : "Tambah Absensi"}
        open={action.upsert}
        onCancel={() =>
          setAction({ ...action, upsert: false, record: undefined })
        }
        onOk={submitAbsence}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={loading}
        width={700}
      >
        <Space orientation="vertical" className="w-full" size={16}>
          <Select
            placeholder="Pilih pengguna"
            value={form.userId}
            options={users.map((user) => ({
              label: user.fullname,
              value: user.id,
            }))}
            onChange={(value) => setForm({ ...form, userId: value })}
            showSearch
            filterOption={(input, option) =>
              (option?.label as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            size="middle"
          />
          <Select
            value={form.method}
            onChange={(value) => setForm({ ...form, method: value })}
            options={[
              { label: "BUTTON", value: "BUTTON" },
              { label: "FACE", value: "FACE" },
            ]}
            size="middle"
          />
          <Select
            value={form.absence_status}
            onChange={(value) => setForm({ ...form, absence_status: value })}
            options={[
              { label: "HADIR", value: "HADIR" },
              { label: "TERLAMBAT", value: "TERLAMBAT" },
              { label: "CUTI", value: "CUTI" },
              { label: "PERDIN", value: "PERDIN" },
              { label: "SAKIT", value: "SAKIT" },
            ]}
            size="middle"
          />
          <Input.TextArea
            placeholder="Keterangan"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />

          {/* GPS Coordinates Section */}
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "12px" }}>
            <h4
              style={{
                marginBottom: "12px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Koordinat GPS
            </h4>

            <div style={{ marginBottom: "16px" }}>
              <h5
                style={{ fontSize: "12px", marginBottom: "8px", color: "#666" }}
              >
                Lokasi Masuk (Check-In)
              </h5>
              <Row gutter={16}>
                <Col span={12}>
                  <Input
                    type="number"
                    placeholder="Latitude"
                    step="0.000001"
                    value={form.geo_in_lat || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        geo_in_lat: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <Input
                    type="number"
                    placeholder="Longitude"
                    step="0.000001"
                    value={form.geo_in_long || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        geo_in_long: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    size="small"
                  />
                </Col>
              </Row>
            </div>

            <div>
              <h5
                style={{ fontSize: "12px", marginBottom: "8px", color: "#666" }}
              >
                Lokasi Keluar (Check-Out)
              </h5>
              <Row gutter={16}>
                <Col span={12}>
                  <Input
                    type="number"
                    placeholder="Latitude"
                    step="0.000001"
                    value={form.geo_out_lat || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        geo_out_lat: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <Input
                    type="number"
                    placeholder="Longitude"
                    step="0.000001"
                    value={form.geo_out_long || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        geo_out_long: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    size="small"
                  />
                </Col>
              </Row>
            </div>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
