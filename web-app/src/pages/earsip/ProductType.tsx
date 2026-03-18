import {
  App,
  Button,
  Card,
  Divider,
  Input,
  List,
  Modal,
  Pagination,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  Plus,
  Filter,
  Eye,
  Edit2,
  Delete,
  Hash,
  VideoIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IPageProps,
  IProductType,
  IProductTypeFile,
} from "../../libs/interface";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
import {
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
const { Text, Title } = Typography;

export default function DataProductType() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IProductType>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
  });
  const [action, setAction] = useState<IActionPage<IProductType>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const { modal } = App.useApp();
  const { hasAccess } = useContext((state: any) => state);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) {
      params.append("search", pageprops.search);
    }
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/product_type?${params.toString()}`,
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
  }, [pageprops.page, pageprops.limit, pageprops.search]);

  return (
    <div className="space-y-2">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Jenis Produk
          </h1>
          <p className="text-slate-500 text-sm">Manajemen jenis/tipe produk.</p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2">
        <div className="bg-white  flex flex-wrap items-center gap-4 mb-2">
          <div className="flex-1 flex">
            {hasAccess(window.location.pathname, "write") && (
              <Button
                onClick={() => setAction({ ...action, upsert: true })}
                icon={<Plus size={15} />}
                type="primary"
                size="small"
              >
                New
              </Button>
            )}
          </div>
          <div className="flex-1 flex items-center justify-end gap-2">
            <Input.Search
              type="text"
              placeholder="Cari Nama, NIK, atau ID Debitur..."
              className="w-full transition-all"
              size="small"
              width={200}
              style={{ width: 200 }}
              onChange={(e) =>
                setPageprops({ ...pageprops, search: e.target.value })
              }
            />
            <Button size="small">
              <Filter size={14} /> Filter
            </Button>
          </div>
        </div>

        <Spin spinning={loading}>
          <div className="flex gap-4 flex-wrap my-5 justify-evenly">
            {pageprops.data.map((d) => (
              <ProductTypeCard
                record={d}
                key={d.id}
                setAction={setAction}
                hasupdate={hasAccess(window.location.pathname, "update")}
                hasdelete={hasAccess(window.location.pathname, "delete")}
              />
            ))}
          </div>
        </Spin>

        <div className="flex justify-end">
          <Pagination
            current={pageprops.page}
            pageSize={pageprops.limit}
            total={pageprops.total}
            pageSizeOptions={[50, 100, 500, 1000]}
            size="small"
            onChange={(page, pageSize) =>
              setPageprops({ ...pageprops, page, limit: pageSize })
            }
          />
        </div>
      </div>
      <UpsertData
        open={action.upsert}
        setOpen={(val: boolean) =>
          setAction({ ...action, upsert: val, record: undefined })
        }
        record={action.record}
        getData={getData}
        hook={modal}
        key={action.record ? "upsert" + action.record.id : "upsert"}
      />
      {action.delete && action.record && (
        <DeleteData
          open={action.delete}
          setOpen={(val: boolean) =>
            setAction({ ...action, delete: val, record: undefined })
          }
          record={action.record}
          getData={getData}
          hook={modal}
          key={"delete" + action.record.id}
        />
      )}
    </div>
  );
}

const UpsertData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  record?: IProductType;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IProductType>(record || defaultData);

  const handleSubmit = async () => {
    if (!data.name) {
      hook.error({
        title: "ERROR",
        content: "Mohon lengkapi data terlebih dahulu!",
      });
      return;
    }
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/product_type?id=" + record?.id,
        method: record ? "PUT" : "POST",
        data: data,
        headers: { "Content-Type": "Application/json" },
      })
      .then(async (res) => {
        if (res.status === 201 || res.status === 200) {
          hook.success({
            title: "BERHASIL",
            content: res.data.msg,
          });
          setOpen(false);
          getData && (await getData());
        } else {
          hook.error({
            title: "ERROR",
            content: res.data.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({
          title: "ERROR",
          content: err.message || "Internal Server Error",
        });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={`Upsert Data ${record ? record.name : ""}`}
      style={{ top: 10 }}
      width={800}
      onOk={handleSubmit}
      okButtonProps={{ loading: loading, disabled: !data.name }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <Text strong>ID:</Text>
          <Input
            placeholder="ID/Kosongkan untuk otomatis"
            value={data.id}
            onChange={(e) => setData({ ...data, id: e.target.value })}
            style={{ marginTop: "8px" }}
          />
        </div>
        <div>
          <Text strong>Jenis/Tipe Produk:</Text>
          <Input
            placeholder="Masukkan nama..."
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            style={{ marginTop: "8px" }}
          />
        </div>
        <div>
          <Text strong>Keterangan:</Text>
          <Input.TextArea
            placeholder="Masukkan keterangan..."
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            style={{ marginTop: "8px" }}
          />
        </div>
      </div>
      <Divider
        style={{ margin: 0, padding: 5 }}
        titlePlacement="left"
        className="italic"
      >
        List Files
      </Divider>
      <div className="my-3 flex flex-col gap-2">
        {data.ProductTypeFile.map((d, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-25">
              <Input
                size="small"
                width={"100%"}
                placeholder="ID"
                value={d.id}
                disabled
                onChange={(e) =>
                  setData({
                    ...data,
                    ProductTypeFile: data.ProductTypeFile.map((pd, ind) =>
                      ind === i ? { ...d, id: e.target.value } : pd,
                    ),
                  })
                }
              />
            </div>
            <div className="flex-1">
              <Input
                size="small"
                width={"100%"}
                placeholder="Nama file"
                value={d.name}
                onChange={(e) =>
                  setData({
                    ...data,
                    ProductTypeFile: data.ProductTypeFile.map((pd, ind) =>
                      ind === i ? { ...d, name: e.target.value } : pd,
                    ),
                  })
                }
              />
            </div>
            <div className="flex-1">
              <Select
                size="small"
                style={{ width: "100%" }}
                placeholder="Tipe file"
                options={[
                  { label: "PDF", value: "pdf" },
                  { label: "Image", value: "image" },
                  { label: "Video", value: "video" },
                ]}
                value={d.type}
                onChange={(e) =>
                  setData({
                    ...data,
                    ProductTypeFile: data.ProductTypeFile.map((pd, ind) =>
                      ind === i ? { ...d, type: e } : pd,
                    ),
                  })
                }
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        icon={<PlusCircleOutlined />}
        type="primary"
        size="small"
        block
        onClick={() =>
          setData({
            ...data,
            ProductTypeFile: [
              ...data.ProductTypeFile,
              {
                ...defaultFileType,
                id: `${data.id}0${data.ProductTypeFile.length + 1}`,
              },
            ],
          })
        }
      >
        Add more files
      </Button>
    </Modal>
  );
};

const defaultData: IProductType = {
  id: "",
  name: "",
  description: "",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  ProductTypeFile: [],
};
const defaultFileType: IProductTypeFile = {
  id: "",
  name: "",
  type: "pdf",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  Files: [],
};

const DeleteData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  record: IProductType;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/product_type?id=" + record?.id,
        method: "DELETE",
        headers: { "Content-Type": "Application/json" },
      })
      .then(async (res) => {
        if (res.status === 201 || res.status === 200) {
          hook.success({
            title: "BERHASIL",
            content: res.data.msg,
          });
          setOpen(false);
          getData && (await getData());
        } else {
          hook.error({
            title: "ERROR",
            content: res.data.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({
          title: "ERROR",
          content: err.message || "Internal Server Error",
        });
      });
    setLoading(false);
  };
  return (
    <Modal
      open={open}
      title="Konfirmasi Hapus"
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      okButtonProps={{ loading: loading }}
    >
      <div className="p-5">
        <p>Konfirmasi hapus data *{record.name}*?</p>
      </div>
    </Modal>
  );
};

const ProductTypeCard = ({
  record,
  setAction,
  hasupdate,
  hasdelete,
}: {
  record: IProductType;
  setAction: Function;
  hasupdate: boolean;
  hasdelete: boolean;
}) => {
  const [open, setOpen] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.includes("pdf"))
      return <FilePdfOutlined style={{ color: "#ff4d4f" }} />;
    if (type.includes("image") || type.includes("png") || type.includes("jpg"))
      return <FileImageOutlined style={{ color: "#52c41a" }} />;
    return <VideoIcon size={15} style={{ color: "#1890ff" }} />;
  };

  return (
    <Card
      hoverable
      style={{ width: 300, borderRadius: "12px", overflow: "hidden" }}
      actions={[
        <Tooltip title="Lihat Detail">
          <Button
            type="text"
            icon={<Eye size={15} />}
            onClick={() => setOpen(true)}
          />
        </Tooltip>,
        <Tooltip title="Edit Tipe">
          <Button
            type="text"
            icon={<Edit2 style={{ color: "#1890ff" }} size={15} />}
            onClick={() =>
              setAction((prev: any) => ({ ...prev, record, upsert: true }))
            }
            disabled={!hasupdate}
          />
        </Tooltip>,
        <Tooltip title="Hapus">
          <Button
            type="text"
            danger
            icon={<Delete size={15} />}
            onClick={() =>
              setAction((prev: any) => ({ ...prev, record, delete: true }))
            }
            disabled={!hasdelete}
          />
        </Tooltip>,
      ]}
    >
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}
      >
        <div
          style={{
            background: "#f0f5ff",
            padding: "10px",
            borderRadius: "8px",
            marginRight: "12px",
          }}
        >
          <Hash size={15} style={{ fontSize: "24px", color: "#1890ff" }} />
        </div>
        <div>
          <Title level={5} style={{ margin: 0 }}>
            ({record.id}) {record.name}
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.ProductTypeFile.length} Files
          </Text>
        </div>
      </div>

      <Text type="secondary" style={{ display: "block", marginBottom: "12px" }}>
        {record.description}
      </Text>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="close" onClick={() => setOpen(false)}>
            Tutup
          </Button>,
        ]}
        title={
          <Space>
            <FileOutlined />
            <span>Detail Files {record?.name}</span>
          </Space>
        }
        width={600}
        style={{ top: 20 }}
      >
        <List
          itemLayout="horizontal"
          dataSource={record?.ProductTypeFile || []} // Asumsi data file ada di dalam record
          locale={{ emptyText: "Belum ada list file!" }}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <div style={{ fontSize: "15px", paddingTop: "4px" }}>
                    {getFileIcon(item.type)}
                  </div>
                }
                title={<Text strong>{item.name}</Text>}
                description={
                  <Space orientation="horizontal" size={5}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      ID: <Tag>{item.id}</Tag>
                    </Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Tipe: <Tag>{item.type.toUpperCase()}</Tag>
                    </Text>
                  </Space>
                }
              />
              <div>
                <Tag color={item.status ? "green" : "red"}>
                  {item.status ? "Aktif" : "Non-aktif"}
                </Tag>
              </div>
            </List.Item>
          )}
        />
      </Modal>
    </Card>
  );
};
