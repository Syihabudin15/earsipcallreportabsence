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
    try {
      const res = await api.request({
        url: "/guestbook",
        method: "GET",
        params: {
          page: pageprops.page,
          limit: pageprops.limit,
          search: pageprops.search,
          date: pageprops.date,
          gBookTypeId: pageprops.gBookTypeId,
        },
      });
      setPageprops((prev) => ({
        ...prev,
        data: res.data.data || [],
        total: res.data.total || 0,
      }));
    } catch (error) {
      modal.error({ title: "Gagal mengambil data buku tamu" });
    }
    setLoading(false);
  };

  const getTypes = async () => {
    try {
      const res = await api.request({
        url: "/gbook_type",
        method: "GET",
        params: { limit: 200 },
      });
      setTypes(res.data.data || []);
    } catch (error) {
      modal.error({ title: "Gagal mengambil tipe buku tamu" });
    }
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
    if (!form.name?.trim()) {
      modal.error({ title: "Nama tamu tidak boleh kosong" });
      return;
    }
    if (!form.gBookTypeId) {
      modal.error({ title: "Jenis buku tamu harus dipilih" });
      return;
    }

    setLoading(true);
    const participantData = (form.Participants || [])
      .filter((item) => item.name && item.name.trim())
      .map((p) => {
        if (p.id && p.action === "delete") {
          return { ...p, action: "delete" };
        } else if (p.id && !p.action) {
          return { ...p, action: "update" };
        } else {
          const { id, ...data } = p;
          return { ...data, action: "create" };
        }
      });

    try {
      if (action.record) {
        await api.request({
          url: "/guestbook",
          method: "PUT",
          params: { id: action.record.id },
          data: {
            ...form,
            Participants: participantData,
          },
        });
        modal.success({ title: "Data buku tamu berhasil diubah" });
      } else {
        await api.request({
          url: "/guestbook",
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
    try {
      await api.request({
        url: "/guestbook",
        method: "DELETE",
        params: { id: record.id },
      });
      modal.success({ title: "Buku tamu berhasil dihapus" });
      await getGuestBooks();
    } catch (error) {
      modal.error({ title: "Gagal menghapus buku tamu" });
    }
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
        return <span>{record.Participants?.length || 0} orang</span>;
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
                    Participants: record.Participants || [],
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
            onSearch={(value) =>
              setPageprops({ ...pageprops, page: 1, search: value })
            }
            style={{ minWidth: 240 }}
            size="small"
          />
          <DatePicker
            size="small"
            format="YYYY-MM-DD"
            value={pageprops.date ? moment(pageprops.date, "YYYY-MM-DD") : null}
            onChange={(value) =>
              setPageprops({
                ...pageprops,
                page: 1,
                date: value ? value.format("YYYY-MM-DD") : "",
              })
            }
            placeholder="Pilih tanggal"
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
              setPageprops({ ...pageprops, page: 1, gBookTypeId: value })
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
        width={800}
        style={{ top: 20 }}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nama Tamu *
            </label>
            <Input
              placeholder="Masukkan nama tamu"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              size="large"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tanggal *
              </label>
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                value={form.date ? moment(form.date) : null}
                onChange={(value) =>
                  setForm({ ...form, date: value?.toISOString() })
                }
                size="large"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status *</label>
              <Select
                value={form.status_come}
                options={statusOptions}
                onChange={(value) => setForm({ ...form, status_come: value })}
                size="large"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Jenis Buku Tamu *
            </label>
            <Select
              value={form.gBookTypeId || undefined}
              options={types.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
              onChange={(value) => setForm({ ...form, gBookTypeId: value })}
              placeholder="Pilih jenis buku tamu"
              size="large"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Keterangan</label>
            <Input.TextArea
              placeholder="Masukkan keterangan"
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold">Peserta</label>
              <Button
                type="dashed"
                size="small"
                onClick={() =>
                  setForm({
                    ...form,
                    Participants: [
                      ...(form.Participants || []),
                      {
                        name: "",
                        phone: "",
                        email: "",
                        id: "",
                        guestBookId: "",
                      } as IParticipant,
                    ],
                  })
                }
              >
                + Tambah Peserta
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(form.Participants || [])
                .filter((p) => !p.action || p.action !== "delete")
                .map((participant, index) => {
                  const actualIndex = (form.Participants || []).findIndex(
                    (p) =>
                      p.id === participant.id ||
                      (p.name === participant.name && !p.id),
                  );
                  const isNew = !participant.id;

                  return (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <Space className="w-full mb-2">
                        <Tag color={isNew ? "green" : "blue"}>
                          {isNew ? "Baru" : "Existing"}
                        </Tag>
                        <Button
                          danger
                          size="small"
                          onClick={() => {
                            const updated = [...(form.Participants || [])];
                            if (participant.id) {
                              updated[actualIndex] = {
                                ...updated[actualIndex],
                                action: "delete",
                              };
                            } else {
                              updated.splice(actualIndex, 1);
                            }
                            setForm({ ...form, Participants: updated });
                          }}
                        >
                          Hapus
                        </Button>
                      </Space>

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nama"
                          size="small"
                          value={participant.name}
                          onChange={(e) => {
                            const updated = [...(form.Participants || [])];
                            updated[actualIndex] = {
                              ...updated[actualIndex],
                              name: e.target.value,
                            };
                            setForm({ ...form, Participants: updated });
                          }}
                        />
                        <Input
                          placeholder="No. Telepon"
                          size="small"
                          value={participant.phone || ""}
                          onChange={(e) => {
                            const updated = [...(form.Participants || [])];
                            updated[actualIndex] = {
                              ...updated[actualIndex],
                              phone: e.target.value,
                            };
                            setForm({ ...form, Participants: updated });
                          }}
                        />
                        <Input
                          placeholder="Email"
                          size="small"
                          value={participant.email || ""}
                          onChange={(e) => {
                            const updated = [...(form.Participants || [])];
                            updated[actualIndex] = {
                              ...updated[actualIndex],
                              email: e.target.value,
                            };
                            setForm({ ...form, Participants: updated });
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
