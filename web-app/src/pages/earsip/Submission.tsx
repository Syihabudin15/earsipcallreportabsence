import {
  App,
  Button,
  DatePicker,
  Input,
  Modal,
  Popover,
  Select,
  Table,
  Tag,
  type TableProps,
} from "antd";
import { Plus, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IPageProps,
  IProduct,
  IProductType,
  ISubmission,
  ISubType,
} from "../../libs/interface";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
import { CollapseList, DetailSubmission } from "../utils/utilComp";
import {
  CloseOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  FormOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { Link } from "react-router-dom";
import { IDRFormat } from "../utils/utilForm";
const { RangePicker } = DatePicker;
import dayjs from "dayjs";

export default function DataSubmission() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<ISubmission>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    productId: "",
    productTypeId: "",
    backdate: "",
    is_active: "",
    guarantee_status: "",
    submissionTypeId: "",
  });
  const [action, setAction] = useState<IActionPage<ISubmission>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const { modal } = App.useApp();
  const { hasAccess } = useContext((state: any) => state);
  const [subTypes, setSubTypes] = useState<ISubType[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [productTypes, setProductTypes] = useState<IProductType[]>([]);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) params.append("search", pageprops.search);
    if (pageprops.productTypeId)
      params.append("productTypeId", pageprops.productTypeId);
    if (pageprops.productId) params.append("productId", pageprops.productId);
    if (pageprops.is_active) params.append("is_active", pageprops.is_active);
    if (pageprops.guarantee_status)
      params.append("guarantee_status", pageprops.guarantee_status);
    if (pageprops.backdate) params.append("backdate", pageprops.backdate);
    if (pageprops.submissionTypeId)
      params.append("submissionTypeId", pageprops.submissionTypeId);

    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/submission?${params.toString()}`,
        method: "GET",
      })
      .then((res) =>
        setPageprops((prev) => ({
          ...prev,
          data: res.data.data.map((d: ISubmission) => ({
            ...d,
            Product: {
              ...d.Product,
              ProductType: {
                ...d.Product.ProductType,
                ProductTypeFile: d.Product.ProductType.ProductTypeFile.map(
                  (ptf) => ({
                    ...ptf,
                    Files: d.Files.filter(
                      (f) =>
                        f.submissionId === d.id &&
                        f.productTypeFileId === ptf.id,
                    ),
                  }),
                ),
              },
            },
          })),
          total: res.data.total,
        })),
      );
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/producttype`,
        })
        .then((res) => setProductTypes(res.data.data));
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/product`,
        })
        .then((res) => setProducts(res.data.data));
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/sub_type`,
        })
        .then((res) => setSubTypes(res.data.data));
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
    pageprops.backdate,
    pageprops.productId,
    pageprops.productTypeId,
    pageprops.submissionTypeId,
    pageprops.is_active,
    pageprops.guarantee_status,
  ]);

  const columns: TableProps<ISubmission>["columns"] = [
    {
      title: "ID",
      key: "id",
      dataIndex: "id",
      fixed: window.innerWidth > 600 ? "left" : undefined,
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
      title: "Pemohon",
      key: "pemohon",
      dataIndex: ["Debitur", "fullname"],
      fixed: window.innerWidth > 600 ? "left" : undefined,
      render(value, record, _index) {
        return (
          <div>
            <div>{value}</div>
            <div className="text-xs opacity-80">@{record.Debitur.nik}</div>
          </div>
        );
      },
    },
    {
      title: "CIF & Rekening",
      key: "cif",
      dataIndex: "cif",
      render(_value, record, _index) {
        return (
          <div>
            <div>CIF: {record.Debitur.cif}</div>
            <div className="text-xs opacity-80">
              REK: {record.account_number}
            </div>
          </div>
        );
      },
    },
    {
      title: "Jenis Pemohon",
      key: "subType",
      dataIndex: ["Debitur", "SubmissionType", "name"],
    },
    {
      title: "Produk",
      key: "product",
      dataIndex: "product",
      render(_value, record, _index) {
        return (
          <div>
            <div>{record.Product.name}</div>
            <div className="text-xs opacity-80">
              {record.Product.ProductType.name}
            </div>
          </div>
        );
      },
    },
    {
      title: "Plafond/Nilai",
      key: "plafond",
      dataIndex: "plafond",
      render(_value, record, _index) {
        return (
          <div className="text-right">
            <div>Rp. {IDRFormat(record.value)}</div>
          </div>
        );
      },
    },
    {
      title: "Petugas",
      key: "petugas",
      dataIndex: "petugas",
      render(_value, record, _index) {
        return (
          <div>
            <div>{record.User.fullname}</div>
            <div className="text-xs opacity-80">@{record.User.nik}</div>
          </div>
        );
      },
    },
    {
      title: "No Lemari",
      key: "lemari",
      dataIndex: "lemari",
      render(_value, record, _index) {
        return (
          <div>
            <div>{record.drawer_code}</div>
          </div>
        );
      },
    },
    {
      title: "Files",
      key: "files",
      dataIndex: "files",
      render(_value, record, _index) {
        return (
          <div style={{ maxWidth: 300 }}>
            <CollapseList
              items={record.Product.ProductType.ProductTypeFile.map(
                (c) =>
                  `${c.name} (${c.Files.length}) {${c.Files.map((f) => f.name).join(", ")}}`,
              )}
              initialVisible={1}
            />
          </div>
        );
      },
    },
    {
      title: "Komentar",
      key: "comment",
      dataIndex: "comment",
      render(_value, record, _index) {
        return (
          <CollapseList
            items={record.coments.map(
              (c) =>
                `${c.name} at ${moment(c.date).format("DD/MM/YY HH:mm")} : ${c.comment}`,
            )}
          />
        );
      },
    },
    {
      title: "Status Jaminan",
      key: "jaminan",
      dataIndex: "jaminan",
      render(_value, record, _index) {
        return (
          <div className="flex justify-center">
            <Tag
              style={{ width: 80, textAlign: "center" }}
              color={record.guarantee_status ? "green" : "orange"}
              variant="solid"
            >
              {record.guarantee_status ? "SELESAI" : "PENDING"}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Status Permohonan",
      key: "permohonan",
      dataIndex: "permohonan",
      render(_value, record, _index) {
        return (
          <div className="flex justify-center">
            <Tag
              style={{ width: 80, textAlign: "center" }}
              color={record.is_active ? "green" : "orange"}
              variant="solid"
            >
              {record.is_active ? "AKTIF" : "NONAKTIF"}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Tanggal",
      key: "created_at",
      dataIndex: "created_at",
      render(_value, record, _index) {
        return (
          <div>
            <div>{moment(record.created_at).format("DD/MM/YY HH:mm")}</div>
            <div className="text-xs opacity-80">
              {moment(record.updated_at).format("DD/MM/YY HH:mm")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Aktivitas",
      key: "activities",
      dataIndex: "activities",
      render(_value, record, _index) {
        return (
          <CollapseList
            items={record.activities.map(
              (c) =>
                `${c.name} at ${moment(c.date).format("DD/MM/YY HH:mm")} : ${c.activities}`,
            )}
          />
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      dataIndex: "action",
      render(_value, record, _index) {
        return (
          <div className="flex items-center gap-1">
            <Button
              icon={<FolderOpenOutlined size={15} />}
              size="small"
              onClick={() => setAction({ ...action, process: true, record })}
            ></Button>
            {hasAccess(window.location.pathname, "update") && (
              <Link to={`/app/earsip/submission/upsert/${record.id}`}>
                <Button
                  icon={<FormOutlined size={15} />}
                  size="small"
                  type="primary"
                  onClick={() => setAction({ ...action, upsert: true, record })}
                ></Button>
              </Link>
            )}
            {hasAccess(window.location.pathname, "delete") && (
              <Button
                icon={<DeleteOutlined size={15} />}
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
    <div className="p-2 w-80">
      <div className="flex flex-col w-full">
        <p className="mb-1">Jenis Pemohon</p>
        <Select
          placeholder="Pilih jenis pemohon.."
          className="w-full"
          options={subTypes.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) =>
            setPageprops({ ...pageprops, submissionTypeId: val })
          }
          allowClear
          value={pageprops.submissionTypeId}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <p className="mb-1">Tipe Produk</p>
        <Select
          placeholder="Pilih tipe produk.."
          className="w-full"
          options={productTypes.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) =>
            setPageprops({ ...pageprops, productTypeId: val, productId: null })
          }
          allowClear
          value={pageprops.productTypeId}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <p className="mb-1">Produk</p>
        <Select
          placeholder="Pilih produk.."
          className="w-full"
          options={products
            .filter((p) => p.productTypeId === pageprops.productTypeId)
            .map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) => setPageprops({ ...pageprops, productId: val })}
          allowClear
          value={pageprops.productId}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <p className="mb-1">Status Jaminan</p>
        <Select
          placeholder="Pilih status jaminan.."
          className="w-full"
          options={[
            { label: "SELESAI", value: "true" },
            { label: "PENDING", value: "false" },
          ]}
          onChange={(val) =>
            setPageprops({ ...pageprops, guarantee_status: val })
          }
          allowClear
          value={pageprops.guarantee_status}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <p className="mb-1">Status Permohonan</p>
        <Select
          placeholder="Pilih status permohonan.."
          className="w-full"
          options={[
            { label: "AKTIF", value: "true" },
            { label: "NONAKTIF", value: "false" },
          ]}
          onChange={(val) => setPageprops({ ...pageprops, is_active: val })}
          allowClear
          value={pageprops.is_active}
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
          onChange={
            (_date, datestr) =>
              setPageprops({ ...pageprops, backdate: datestr })
            // console.log({ _date, datestr })
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
              productTypeId: "",
              productId: "",
              is_active: "",
              guarantee_status: "",
              backdate: "",
              submissionTypeId: "",
            })
          }
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
            Data Permohonan
          </h1>
          <p className="text-slate-500 text-sm">
            Manajemen permohonan debitur.
          </p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2">
        <div className="bg-white  flex flex-wrap items-center gap-4 mb-2">
          <div className="flex-1 flex">
            {hasAccess(window.location.pathname, "write") && (
              <a href="/app/earsip/submission/upsert">
                <Button
                  onClick={() => setAction({ ...action, upsert: true })}
                  icon={<Plus size={15} />}
                  type="primary"
                  size="small"
                >
                  New
                </Button>
              </a>
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
                  pageprops.is_active ||
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
      {action.process && action.record && (
        <DetailSubmission
          open={action.process}
          setOpen={(val: boolean) =>
            setAction({ ...action, process: val, record: undefined })
          }
          record={action.record}
          key={"detail" + action.record.id}
        />
      )}
    </div>
  );
}

const DeleteData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  record: ISubmission;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/submission?id=" + record?.id,
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
        <p>Konfirmasi hapus data *{record.id}*?</p>
      </div>
    </Modal>
  );
};
