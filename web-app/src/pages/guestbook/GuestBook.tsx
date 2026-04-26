import {
  App,
  Button,
  DatePicker,
  Divider,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Space,
  Table,
  Tag,
  type TableProps,
} from "antd";
import { Plus, Edit, Trash2, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IGuestBook,
  IGuestBookType,
  IPageProps,
  IParticipant,
} from "../../libs/interface";
import api from "../../libs/api";
import moment from "moment";
import useContext from "../../libs/context";
import type { HookAPI } from "antd/es/modal/useModal";
import { InputUtil, OneFileUpload } from "../utils/utilForm";
const { RangePicker } = DatePicker;
import dayjs from "dayjs";
import {
  CloseOutlined,
  DeleteOutlined,
  FileFilled,
  PlusCircleOutlined,
  SaveFilled,
} from "@ant-design/icons";

export default function DataGuestBook() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IGuestBook>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    backdate: "",
    gBookTypeId: "",
    status_come: "",
  });
  const [action, setAction] = useState<IActionPage<IGuestBook>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const [types, setTypes] = useState<IGuestBookType[]>([]);
  const { modal } = App.useApp();
  const { hasAccess } = useContext((state) => state);

  const getGuestBooks = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: import.meta.env.VITE_API_URL + "/guestbook",
        method: "GET",
        params: {
          page: pageprops.page,
          limit: pageprops.limit,
          search: pageprops.search,
          backdate: pageprops.backdate,
          gBookTypeId: pageprops.gBookTypeId,
          status_come: pageprops.status_come,
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
        url: import.meta.env.VITE_API_URL + "/gbook_type",
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
    pageprops.backdate,
    pageprops.gBookTypeId,
    pageprops.status_come,
  ]);

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
        return record.GBookType?.name || "-";
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
        return <span>{record.Participant?.length || 0} orang</span>;
      },
    },
    {
      title: "Berkas",
      key: "file",
      render(_, record) {
        return (
          <a href={record.file || ""} target="_blank" rel="noreferrer">
            <Button
              disabled={!record.file}
              size="small"
              icon={<FileFilled />}
            ></Button>
          </a>
        );
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
                }}
              />
            )}
            {hasAccess(window.location.pathname, "delete") && (
              <Popconfirm
                title="Hapus Buku Tamu ini?"
                onConfirm={() => deleteBook(record)}
              >
                <Button size="small" danger icon={<Trash2 size={12} />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];
  const content = (
    <div className="p-2 w-80">
      <div className="flex flex-col w-full">
        <p className="mb-1">Tipe Tamu</p>
        <Select
          placeholder="Pilih tipe Tamu.."
          className="w-full"
          options={types.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) => setPageprops({ ...pageprops, gBookTypeId: val })}
          allowClear
          value={pageprops.gBookTypeId}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <p className="mb-1">Status Kedatangan</p>
        <Select
          placeholder="Pilih status kedatangan.."
          className="w-full"
          options={[
            { label: "Akad Datang", value: "AKANDATANG" },
            { label: "Telah Datang", value: "TELAHDATANG" },
          ]}
          onChange={(val) => setPageprops({ ...pageprops, status_come: val })}
          allowClear
          value={pageprops.status_come}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <p className="mb-1">Periode</p>
        <RangePicker
          value={
            pageprops.backdate && [
              dayjs(pageprops.backdate[0]),
              dayjs(pageprops.backdate[1]),
            ]
          }
          onChange={(_date, datestr) =>
            setPageprops({ ...pageprops, backdate: datestr })
          }
          size="small"
        />
      </div>
      <div className="flex justify-end mt-4">
        <Button
          size="small"
          danger
          icon={<CloseOutlined />}
          onClick={() =>
            setPageprops({
              ...pageprops,
              gBookTypeId: "",
              backdate: "",
              status_come: "",
            })
          }
        >
          Clear Filter
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Buku Tamu</h1>
          <p className="text-slate-500 text-sm">
            Kelola buku tamu kantor dan kunjungan tamu.
          </p>
        </div>
      </div>

      <div className="bg-white p-2 rounded-xl border border-slate-200">
        <div className="flex gap-2 justify-between mb-1">
          {hasAccess(window.location.pathname, "write") && (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => {
                setAction({ ...action, upsert: true, record: undefined });
              }}
              size="small"
            >
              Tambah
            </Button>
          )}
          <div className="flex gap-2">
            <Input.Search
              placeholder="Cari nama atau tipe tamu.."
              allowClear
              onSearch={(value) =>
                setPageprops({ ...pageprops, page: 1, search: value })
              }
              style={{ minWidth: 240 }}
              size="small"
            />
            <Popover
              content={content}
              title="Filter Data"
              trigger="click"
              placement="left"
            >
              <Button
                size="small"
                type={
                  pageprops.productTypeId ||
                  pageprops.productId ||
                  pageprops.guarantee_status ||
                  pageprops.approve_status ||
                  pageprops.mitraId ||
                  pageprops.backdate ||
                  pageprops.submissionTypeId
                    ? "primary"
                    : undefined
                }
              >
                <Filter size={14} /> Filter
              </Button>
            </Popover>
          </div>
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
      <UpsertData
        open={action.upsert}
        setOpen={(val: boolean) => setAction({ ...action, upsert: val })}
        getData={() => getGuestBooks()}
        record={action.record}
        hook={modal}
        key={action.record ? "upsert" + action.record.id : "create"}
        types={types}
      />
    </div>
  );
}

const UpsertData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
  types,
}: {
  open: boolean;
  setOpen: (e: boolean) => void;
  record?: IGuestBook;
  getData: () => void;
  hook: HookAPI;
  types: IGuestBookType[];
}) => {
  const [data, setData] = useState(record || defaultData);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await api
      .request({
        method: record ? "PUT" : "POST",
        url: import.meta.env.VITE_API_URL + "/guestbook?id=" + record?.id,
        data: data,
      })
      .then(() => {
        hook.success({
          title: "Berhasil",
          content: "Data Berhasil Ditambahkan!",
        });
        setOpen(false);
        getData();
      })
      .catch((err) => {
        console.log(err);
        hook.error({
          title: "ERROR",
          content: err.response.data.msg || "Internal Server Error",
        });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title="UPSERT BUKU TAMU"
      width={1000}
      style={{ top: 20 }}
      onOk={() => handleSave()}
      okText="Submit"
      okButtonProps={{ icon: <SaveFilled /> }}
      loading={loading}
    >
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 flex flex-col gap-2">
          <InputUtil
            label="Nama Tamu"
            required
            value={data.name}
            type="text"
            onchage={(e: string) => setData({ ...data, name: e })}
          />
          <InputUtil
            label="Keterangan"
            value={data.description}
            type="area"
            onchage={(e: string) => setData({ ...data, description: e })}
          />
          <InputUtil
            label="Tipe Tamu"
            required
            value={data.gBookTypeId}
            type="option"
            options={types.map((t) => ({ label: t.name, value: t.id }))}
            onchage={(e: string) => setData({ ...data, gBookTypeId: e })}
          />
          <InputUtil
            label="Status Kedatangan"
            required
            value={data.status_come}
            type="option"
            options={[
              { label: "TELAH DATANG", value: "TELAHDATANG" },
              { label: "AKAN DATANG", value: "AKANDATANG" },
            ]}
            onchage={(e: string) =>
              setData({
                ...data,
                status_come: e as "AKANDATANG" | "TELAHDATANG",
              })
            }
          />
          <InputUtil
            label="Tanggal Datang"
            required
            value={moment(data.date).format("YYYY-MM-DD")}
            type="date"
            onchage={(e: string) => setData({ ...data, date: new Date(e) })}
          />
          <OneFileUpload
            url={data.file}
            ondelete={() => setData({ ...data, file: null })}
            onchange={(e: string) => setData({ ...data, file: e })}
            filetype="application/pdf"
          />
        </div>
        <div
          className="flex-1 flex flex-col gap-2"
          style={{ maxHeight: "70vh", overflow: "auto" }}
        >
          <Divider size="small">Peserta</Divider>
          {data.Participant.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input
                size="small"
                value={p.name}
                placeholder="Nama Peserta"
                onChange={(e) =>
                  setData({
                    ...data,
                    Participant: data.Participant.map((dp, dpi) => ({
                      ...dp,
                      ...(i === dpi && { name: e.target.value }),
                    })),
                  })
                }
              />
              <Input
                size="small"
                value={p.phone || ""}
                placeholder="Telepon Peserta"
                onChange={(e) =>
                  setData({
                    ...data,
                    Participant: data.Participant.map((dp, dpi) => ({
                      ...dp,
                      ...(i === dpi && { phone: e.target.value }),
                    })),
                  })
                }
              />
              <Input
                size="small"
                value={p.email || ""}
                placeholder="Email Peserta"
                onChange={(e) =>
                  setData({
                    ...data,
                    Participant: data.Participant.map((dp, dpi) => ({
                      ...dp,
                      ...(i === dpi && { email: e.target.value }),
                    })),
                  })
                }
              />
              <Input
                size="small"
                value={p.note || ""}
                placeholder="Catatan"
                onChange={(e) =>
                  setData({
                    ...data,
                    Participant: data.Participant.map((dp, dpi) => ({
                      ...dp,
                      ...(i === dpi && { note: e.target.value }),
                    })),
                  })
                }
              />
              <Button
                icon={<DeleteOutlined />}
                danger
                type="dashed"
                size="small"
                onClick={() =>
                  setData({
                    ...data,
                    Participant: data.Participant.filter(
                      (dp, dpi) => dpi !== i,
                    ),
                  })
                }
              ></Button>
            </div>
          ))}
          <Button
            type="dashed"
            size="small"
            icon={<PlusCircleOutlined />}
            onClick={() =>
              setData({
                ...data,
                Participant: [...data.Participant, defaultPart],
              })
            }
          >
            Tambah Peserta
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const defaultData: IGuestBook = {
  id: "",
  name: "",
  description: "",
  status_come: "AKANDATANG",
  date: new Date(),
  file: null,
  gBookTypeId: "",

  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  Participant: [],
  GBookType: {} as IGuestBookType,
};

const defaultPart: IParticipant = {
  id: "",
  name: "",
  phone: "",
  email: "",
  note: "",

  guestBookId: "",
};
