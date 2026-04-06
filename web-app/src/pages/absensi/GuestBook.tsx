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
} from "antd";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IGuestBook,
  IGuestBookType,
  IPageProps,
  IParticipant,
} from "../../libs/interface";
import api from "../../libs/api";
import useContext from "../../libs/context";
import moment from "moment";

const statusOptions = [
  { label: "Telah Datang", value: "TELAHDATANG" },
  { label: "Akan Datang", value: "AKANDATANG" },
];

export default function DataGuestBook() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IGuestBook>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    date: moment().format("YYYY-MM-DD"),
    gBookTypeId: "",
  });
  const [action, setAction] = useState<IActionPage<IGuestBook>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const [types, setTypes] = useState<IGuestBookType[]>([]);
  const [form, setForm] = useState<Partial<IGuestBook>>({
    name: "",
    date: moment().toISOString(),
    status_come: "TELAHDATANG",
    description: "",
    gBookTypeId: "",
    Participants: [],
  });
  const { modal, hasAccess } = useContext((state: any) => state);

  const getGuestBooks = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) params.append("search", pageprops.search);
    if (pageprops.date) params.append("date", pageprops.date);
    if (pageprops.gBookTypeId)
      params.append("gBookTypeId", pageprops.gBookTypeId);

    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/guestbook?${params.toString()}`,
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

  const getTypes = async () => {
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/gbook_type?page=1&limit=200`,
        method: "GET",
      })
      .then((res) => setTypes(res.data.data));
  };

  useEffect(() => {
    getTypes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      await getGuestBooks();
    }, 200);
    return () => clearTimeout(timer);
  }, [
    pageprops.page,
    pageprops.limit,
    pageprops.search,
    pageprops.date,
    pageprops.gBookTypeId,
  ]);

  const handleSave = async () => {
    setLoading(true);
    const participantData =
      form.Participants?.filter((item) => item.name) || [];

    try {
      if (action.record) {
        await api.request({
          url: `${import.meta.env.VITE_API_URL}/guestbook?id=${action.record.id}`,
          method: "PUT",
          data: {
            ...form,
            Participants: participantData,
          },
        });
        modal.success({ title: "Data buku tamu berhasil diubah" });
      } else {
        await api.request({
          url: `${import.meta.env.VITE_API_URL}/guestbook`,
          method: "POST",
          data: {
            ...form,
            Participants: participantData,
          },
        });
        modal.success({ title: "Buku tamu berhasil ditambahkan" });
      }
      setAction({ ...action, upsert: false, record: undefined });
      setForm({
        name: "",
        date: moment().toISOString(),
        status_come: "TELAHDATANG",
        description: "",
        gBookTypeId: "",
        Participants: [],
      });
      await getGuestBooks();
    } catch (err) {
      modal.error({ title: "Gagal menyimpan data buku tamu" });
    }
    setLoading(false);
  };

  const deleteBook = async (record: IGuestBook) => {
    setLoading(true);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/guestbook?id=${record.id}`,
        method: "DELETE",
      })
      .then(() => {
        modal.success({ title: "Buku tamu berhasil dihapus" });
        getGuestBooks();
      })
      .catch(() => {
        modal.error({ title: "Gagal menghapus buku tamu" });
      });
    setLoading(false);
  };

  const columns: TableProps<IGuestBook>["columns"] = [
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
      key: "name",
      dataIndex: "name",
    },
    {
      title: "Tanggal",
      key: "date",
      dataIndex: "date",
      render(value) {
        return value ? moment(value).format("YYYY-MM-DD") : "-";
      },
    },
    {
      title: "Jenis",
      key: "type",
      render(_, record) {
        return record.GbookType?.name || "-";
      },
    },
    {
      title: "Status",
      key: "status_come",
      dataIndex: "status_come",
      render(value) {
        const label = value === "TELAHDATANG" ? "Telah Datang" : "Akan Datang";
        return (
          <Tag color={value === "TELAHDATANG" ? "green" : "blue"}>{label}</Tag>
        );
      },
    },
    {
      title: "Peserta",
      key: "participants",
      render(_, record) {
        return <span>{record.participants?.length || 0} orang</span>;
      },
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
                    name: record.name,
                    date: moment(record.date).toISOString(),
                    status_come: record.status_come,
                    description: record.description || "",
                    gBookTypeId: record.gBookTypeId,
                    Participants: record.participants || [],
                  });
                }}
              />
            )}
            {hasAccess(window.location.pathname, "delete") && (
              <Button
                size="small"
                danger
                icon={<Trash2 size={12} />}
                onClick={() => deleteBook(record)}
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
          <h1 className="text-2xl font-black">Buku Tamu</h1>
          <p className="text-slate-500 text-sm">
            Kelola buku tamu kantor dan kunjungan tamu.
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
                  name: "",
                  date: moment().toISOString(),
                  status_come: "TELAHDATANG",
                  description: "",
                  gBookTypeId: "",
                  Participants: [],
                });
              }}
            >
              Tambah Buku Tamu
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3 items-center mb-4">
          <Input.Search
            placeholder="Cari nama atau tipe tamu.."
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
          <Select
            size="small"
            style={{ minWidth: 200 }}
            placeholder="Filter jenis"
            allowClear
            value={pageprops.gBookTypeId || undefined}
            options={types.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            onChange={(value) =>
              setPageprops({ ...pageprops, gBookTypeId: value })
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
        title={action.record ? "Ubah Buku Tamu" : "Tambah Buku Tamu"}
        open={action.upsert}
        onCancel={() =>
          setAction({ ...action, upsert: false, record: undefined })
        }
        onOk={handleSave}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={loading}
        width={760}
      >
        <Space direction="vertical" className="w-full">
          <Input
            placeholder="Nama tamu"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <DatePicker
            style={{ width: "100%" }}
            value={form.date ? moment(form.date) : undefined}
            onChange={(value) =>
              setForm({ ...form, date: value?.toISOString() })
            }
            size="middle"
          />
          <Select
            value={form.status_come}
            options={statusOptions}
            onChange={(value) => setForm({ ...form, status_come: value })}
            size="middle"
          />
          <Select
            value={form.gBookTypeId}
            options={types.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            onChange={(value) => setForm({ ...form, gBookTypeId: value })}
            placeholder="Pilih jenis buku tamu"
            size="middle"
          />
          <Input.TextArea
            placeholder="Keterangan"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <div>
            <div className="mb-2 font-semibold">Peserta</div>
            {(form.Participants || []).map((participant, index) => (
              <Space key={index} className="w-full mb-2" align="start">
                <Input
                  placeholder="Nama"
                  value={participant.name}
                  onChange={(e) => {
                    const updated = [...(form.Participants || [])];
                    updated[index] = {
                      ...updated[index],
                      name: e.target.value,
                    };
                    setForm({ ...form, Participants: updated });
                  }}
                  style={{ width: 240 }}
                />
                <Input
                  placeholder="Phone"
                  value={participant.phone}
                  onChange={(e) => {
                    const updated = [...(form.Participants || [])];
                    updated[index] = {
                      ...updated[index],
                      phone: e.target.value,
                    };
                    setForm({ ...form, Participants: updated });
                  }}
                  style={{ width: 180 }}
                />
                <Input
                  placeholder="Email"
                  value={participant.email}
                  onChange={(e) => {
                    const updated = [...(form.Participants || [])];
                    updated[index] = {
                      ...updated[index],
                      email: e.target.value,
                    };
                    setForm({ ...form, Participants: updated });
                  }}
                  style={{ width: 220 }}
                />
                <Input
                  placeholder="Komentar"
                  value={participant.comment}
                  onChange={(e) => {
                    const updated = [...(form.Participants || [])];
                    updated[index] = {
                      ...updated[index],
                      comment: e.target.value,
                    };
                    setForm({ ...form, Participants: updated });
                  }}
                  style={{ width: 240 }}
                />
                <Button
                  danger
                  type="primary"
                  size="small"
                  onClick={() => {
                    const updated = [...(form.Participants || [])];
                    updated.splice(index, 1);
                    setForm({ ...form, Participants: updated });
                  }}
                >
                  Hapus
                </Button>
              </Space>
            ))}
            <Button
              type="dashed"
              className="w-full"
              onClick={() =>
                setForm({
                  ...form,
                  Participants: [
                    ...(form.Participants || []),
                    { name: "", phone: "", email: "", comment: "" },
                  ],
                })
              }
            >
              Tambah Peserta
            </Button>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
