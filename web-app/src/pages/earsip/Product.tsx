import {
  App,
  Button,
  Input,
  Modal,
  Popover,
  Select,
  Table,
  Typography,
  type TableProps,
} from "antd";
import { Plus, Filter, Edit, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IPageProps,
  IProduct,
  IProductType,
} from "../../libs/interface";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
import { CloseOutlined } from "@ant-design/icons";
const { Text } = Typography;

export default function DataProduct() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IProduct>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    productTypeId: "",
  });
  const [action, setAction] = useState<IActionPage<IProduct>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const [productTypes, setProductTypes] = useState<IProductType[]>([]);
  const { modal } = App.useApp();
  const { hasAccess } = useContext((state: any) => state);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) params.append("search", pageprops.search);
    if (pageprops.productTypeId)
      params.append("productTypeId", pageprops.productTypeId);

    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/product?${params.toString()}`,
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
    (async () => {
      await api
        .request({
          url: `${import.meta.env.VITE_API_URL}/producttype`,
          method: "GET",
        })
        .then((res) => setProductTypes(res.data.data));
    })();
  }, []);
  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [
    pageprops.page,
    pageprops.limit,
    pageprops.search,
    pageprops.productTypeId,
  ]);

  const columns: TableProps<IProduct>["columns"] = [
    {
      title: "ID",
      key: "id",
      dataIndex: "id",
      render(value, _record, index) {
        return (
          <>
            <div>{(pageprops.page - 1) * pageprops.limit + index + 1}</div>
            <div className="text-xs opacity-80">{value}</div>
          </>
        );
      },
    },
    {
      title: "Produk",
      key: "name",
      dataIndex: "name",
    },
    {
      title: "Tipe Produk",
      key: "productType",
      dataIndex: ["ProductType", "name"],
    },
    {
      title: "Aksi",
      key: "action",
      dataIndex: "action",
      render(_value, record, _index) {
        return (
          <div className="flex items-center gap-1">
            {hasAccess(window.location.pathname, "update") && (
              <Button
                icon={<Edit size={15} />}
                size="small"
                type="primary"
                onClick={() => setAction({ ...action, upsert: true, record })}
              ></Button>
            )}
            {hasAccess(window.location.pathname, "delete") && (
              <Button
                icon={<Trash size={15} />}
                size="small"
                danger
                onClick={() => setAction({ ...action, delete: true, record })}
              ></Button>
            )}
          </div>
        );
      },
    },
  ];

  const content = (
    <div className="p-2 ">
      <div className="flex flex-col w-48">
        <p className="mb-1">Tipe Produk</p>
        <Select
          placeholder="Pilih tipe produk.."
          className="w-full"
          options={productTypes.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) => setPageprops({ ...pageprops, productTypeId: val })}
          allowClear
          value={pageprops.productTypeId}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex justify-end mt-4">
        <Button
          size="small"
          danger
          icon={<CloseOutlined />}
          onClick={() => setPageprops({ ...pageprops, productTypeId: "" })}
        >
          Clear Filter
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Produk
          </h1>
          <p className="text-slate-500 text-sm">Manajemen data produk.</p>
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
            <Popover
              content={content}
              title="Filter Tambahan"
              trigger="click"
              placement="left"
            >
              <Button
                size="small"
                type={pageprops.productTypeId ? "primary" : undefined}
              >
                <Filter size={14} /> Filter
              </Button>
            </Popover>
          </div>
        </div>

        <Table
          size="small"
          loading={loading}
          rowKey={"id"}
          bordered
          scroll={{
            x: "max-content",
            y: window.innerWidth > 600 ? "53vh" : "65vh",
          }}
          columns={columns}
          dataSource={pageprops.data}
          pagination={{
            current: pageprops.page,
            pageSize: pageprops.limit,
            total: pageprops.total,
            onChange: (page, pageSize) => {
              setPageprops((prev) => ({
                ...prev,
                page,
                limit: pageSize,
              }));
            },
            pageSizeOptions: [50, 100, 500, 1000],
            size: "small",
          }}
        />
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
        productTypes={productTypes}
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
  productTypes,
}: {
  open: boolean;
  setOpen: Function;
  record?: IProduct;
  getData: Function;
  hook: HookAPI;
  productTypes: IProductType[];
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IProduct>(record || defaultData);

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
        url: import.meta.env.VITE_API_URL + "/product?id=" + record?.id,
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
          <Text strong>Nama Produk:</Text>
          <Input
            placeholder="Masukkan nama..."
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            style={{ marginTop: "8px" }}
          />
        </div>
        <div className="flex flex-col ">
          <Text strong>Tipe Produk:</Text>
          <Select
            placeholder="Pilih tipe produk..."
            value={data.productTypeId}
            onChange={(e) => setData({ ...data, productTypeId: e })}
            style={{ marginTop: "8px" }}
            options={productTypes.map((p) => ({ label: p.name, value: p.id }))}
          />
        </div>
      </div>
    </Modal>
  );
};

const defaultData: IProduct = {
  id: "",
  name: "",

  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  ProductType: {} as IProductType,
  productTypeId: "",
  Submission: [],
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
  record: IProduct;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/product?id=" + record?.id,
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
