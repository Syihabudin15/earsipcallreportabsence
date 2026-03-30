import {
  Button,
  DatePicker,
  Input,
  Popover,
  Select,
  Table,
  Tag,
  type TableProps,
} from "antd";
import { Plus, Edit, Trash, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IPageProps,
  ISubType,
  IVisit,
  IVisitCategory,
  IVisitPurpose,
  IVisitStatus,
} from "../../libs/interface";
import useContext from "../../libs/context";
import { CollapseList, CollapseText } from "../utils/utilComp";
import moment from "moment";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { CloseOutlined } from "@ant-design/icons";
import api from "../../libs/api";
const { RangePicker } = DatePicker;

export default function DataVisit() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IVisit>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    visitCategoryId: "",
    visitStatusId: "",
    visitPurposeId: "",
    approve_status: "",
    submissionTypeId: "",
    backdate: "",
  });
  const [action, setAction] = useState<IActionPage<IVisit>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const { hasAccess } = useContext((state: any) => state);
  const [subTypes, setSubTypes] = useState<ISubType[]>([]);
  const [visitStatuses, setVisitStatuses] = useState<IVisitStatus[]>([]);
  const [visitPurposes, setVisitPurposes] = useState<IVisitPurpose[]>([]);
  const [visitCategories, setVisitCategories] = useState<IVisitCategory[]>([]);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) params.append("search", pageprops.search);
    if (pageprops.visitCategoryId)
      params.append("visitCategoryId", pageprops.visitCategoryId);
    if (pageprops.visitStatusId)
      params.append("visitStatusId", pageprops.visitStatusId);
    if (pageprops.visitPurposeId)
      params.append("visitPurposeId", pageprops.visitPurposeId);
    if (pageprops.approve_status)
      params.append("approve_status", pageprops.approve_status);
    if (pageprops.backdate) params.append("backdate", pageprops.backdate);

    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/visit?${params.toString()}`,
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
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/visit_category`,
        })
        .then((res) => setVisitCategories(res.data.data));
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/visit_status`,
        })
        .then((res) => setVisitStatuses(res.data.data));
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/visit_purpose`,
        })
        .then((res) => setVisitPurposes(res.data.data));
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
    pageprops.visitCategoryId,
    pageprops.visitStatusId,
    pageprops.visitPurposeId,
    pageprops.approve_status,
    pageprops.backdate,
  ]);

  const columns: TableProps<IVisit>["columns"] = [
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
      title: "CIF",
      key: "cif",
      dataIndex: ["Debitur", "cif"],
    },
    {
      title: "Jenis Pemohon",
      key: "subType",
      dataIndex: ["Debitur", "SubmissionType", "name"],
    },
    {
      title: "Jenis & Tujuan",
      key: "purpose",
      dataIndex: "purpose",
      render(_value, record, _index) {
        return (
          <div>
            <div>{record.VisitCategory?.name}</div>
            <div className="text-xs opacity-80">
              @{record.VisitPurpose?.name}
            </div>
          </div>
        );
      },
    },
    {
      title: "Hasil Kunjungan",
      key: "hasil",
      dataIndex: ["VisitStatus", "name"],
      render(value, record, _index) {
        return (
          <div>
            <div>{value}</div>
            <div className="text-xs opacity-80">
              <CollapseText text={record.summary || ""} />
            </div>
          </div>
        );
      },
    },
    {
      title: "Komentar",
      key: "komentar",
      dataIndex: "coments",
      render(_value, record, _index) {
        return (
          <CollapseList
            items={
              record.coments
                ? record.coments.map(
                    (c) =>
                      `${c.name} as ${moment(c.date).format("YYYY/MM/DD HH:mm")}: ${c.comment}`,
                  )
                : []
            }
          />
        );
      },
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render(_value, record, _index) {
        return (
          <div className="flex justify-center">
            <Tag
              style={{ width: 80, textAlign: "center" }}
              color={
                record.approve_status === "APPROVED"
                  ? "green"
                  : record.approve_status === "REJECTED"
                    ? "red"
                    : "orange"
              }
              variant="solid"
            >
              {record.approve_status}
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
            <div className="text-xs opacity-80">
              Act: {moment(record.date_action).format("DD/MM/YY HH:mm")}
            </div>
          </div>
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
              icon={<Edit size={15} />}
              size="small"
              type="primary"
              onClick={() => setAction({ ...action, upsert: true, record })}
            ></Button>
            {hasAccess(window.location.pathname, "update") && (
              <Link to={"/app/callreport/upsert/" + record.id}>
                <Button
                  icon={<Edit size={15} />}
                  size="small"
                  type="primary"
                ></Button>
              </Link>
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
        <p className="mb-1">Kategori Kunjungan</p>
        <Select
          placeholder="Pilih kategori kunjungan.."
          className="w-full"
          options={visitCategories.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) =>
            setPageprops({ ...pageprops, visitCategoryId: val })
          }
          allowClear
          value={pageprops.visitCategoryId}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <p className="mb-1">Tujuan Kunjungan</p>
        <Select
          placeholder="Pilih tujuan kunjungan.."
          className="w-full"
          options={visitPurposes.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) =>
            setPageprops({ ...pageprops, visitPurposeId: val })
          }
          allowClear
          value={pageprops.visitPurposeId}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <p className="mb-1">Hasil Kunjungan</p>
        <Select
          placeholder="Pilih hasil kunjungan.."
          className="w-full"
          options={visitStatuses.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) => setPageprops({ ...pageprops, visit_status: val })}
          allowClear
          value={pageprops.visit_status}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <p className="mb-1">Status Kunjungan</p>
        <Select
          placeholder="Pilih status kunjungan.."
          className="w-full"
          options={[
            { label: "PENDING", value: "PENDING" },
            { label: "APPROVED", value: "APPROVED" },
            { label: "REJECTED", value: "REJECTED" },
          ]}
          onChange={(val) =>
            setPageprops({ ...pageprops, approve_status: val })
          }
          allowClear
          value={pageprops.approve_status}
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
              visitCategoryId: "",
              visitStatusId: "",
              visitPurposeId: "",
              approve_status: "",
              backdate: "",
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
            Monitoring Kunjungan
          </h1>
          <p className="text-slate-500 text-sm">Monitoring data kunjungan.</p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2">
        <div className="bg-white  flex flex-wrap items-center gap-4 mb-2">
          <div className="flex-1 flex">
            {hasAccess(window.location.pathname, "write") && (
              <Link to={"/app/callreport/upsert"}>
                <Button icon={<Plus size={15} />} type="primary" size="small">
                  New
                </Button>
              </Link>
            )}
          </div>
          <div className="flex-1 flex items-center justify-end gap-2">
            <Input.Search
              type="text"
              placeholder="Cari Nama Kategori/ID..."
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
                  pageprops.submissionTypeId ||
                  pageprops.visitCategoryId ||
                  pageprops.visitStatusId ||
                  pageprops.visitPurposeId ||
                  pageprops.approve_status ||
                  pageprops.backdate
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
      {/* <UpsertData
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
      )} */}
    </div>
  );
}

// const UpsertData = ({
//   open,
//   setOpen,
//   record,
//   getData,
//   hook,
// }: {
//   open: boolean;
//   setOpen: Function;
//   record?: IVisitStatus;
//   getData: Function;
//   hook: HookAPI;
// }) => {
//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState<IVisitStatus>(record || defaultData);

//   const handleSubmit = async () => {
//     if (!data.name) {
//       hook.error({
//         title: "ERROR",
//         content: "Mohon lengkapi data terlebih dahulu!",
//       });
//       return;
//     }
//     setLoading(true);
//     await api
//       .request({
//         url: import.meta.env.VITE_API_URL + "/visit_status?id=" + record?.id,
//         method: record ? "PUT" : "POST",
//         data: data,
//         headers: { "Content-Type": "Application/json" },
//       })
//       .then(async (res) => {
//         if (res.status === 201 || res.status === 200) {
//           hook.success({
//             title: "BERHASIL",
//             content: res.data.msg,
//           });
//           setOpen(false);
//           getData && (await getData());
//         } else {
//           hook.error({
//             title: "ERROR",
//             content: res.data.msg,
//           });
//         }
//       })
//       .catch((err) => {
//         console.log(err);
//         hook.error({
//           title: "ERROR",
//           content: err.message || "Internal Server Error",
//         });
//       });
//     setLoading(false);
//   };

//   return (
//     <Modal
//       open={open}
//       onCancel={() => setOpen(false)}
//       title={`Upsert Data ${record ? record.name : ""}`}
//       style={{ top: 10 }}
//       width={800}
//       onOk={handleSubmit}
//       okButtonProps={{ loading: loading, disabled: !data.name }}
//     >
//       <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//         <div>
//           <Text strong>ID:</Text>
//           <Input
//             placeholder="ID/Kosongkan untuk otomatis"
//             value={data.id}
//             onChange={(e) => setData({ ...data, id: e.target.value })}
//             style={{ marginTop: "8px" }}
//           />
//         </div>
//         <div>
//           <Text strong>Nama Hasil/Status:</Text>
//           <Input
//             placeholder="Masukkan nama status..."
//             value={data.name}
//             onChange={(e) => setData({ ...data, name: e.target.value })}
//             style={{ marginTop: "8px" }}
//           />
//         </div>

//         <div>
//           <Text strong>Keterangan:</Text>
//           <Input.TextArea
//             placeholder="Masukkan keterangan..."
//             value={data.description}
//             onChange={(e) => setData({ ...data, description: e.target.value })}
//             style={{ marginTop: "8px" }}
//           />
//         </div>
//       </div>
//     </Modal>
//   );
// };

// const defaultData: IVisitStatus = {
//   id: "",
//   name: "",
//   description: "",
//   status: true,
//   created_at: new Date(),
//   updated_at: new Date(),
// };

// const DeleteData = ({
//   open,
//   setOpen,
//   record,
//   getData,
//   hook,
// }: {
//   open: boolean;
//   setOpen: Function;
//   record: IVisitStatus;
//   getData: Function;
//   hook: HookAPI;
// }) => {
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async () => {
//     setLoading(true);
//     await api
//       .request({
//         url: import.meta.env.VITE_API_URL + "/visit_status?id=" + record?.id,
//         method: "DELETE",
//         headers: { "Content-Type": "Application/json" },
//       })
//       .then(async (res) => {
//         if (res.status === 201 || res.status === 200) {
//           hook.success({
//             title: "BERHASIL",
//             content: res.data.msg,
//           });
//           setOpen(false);
//           getData && (await getData());
//         } else {
//           hook.error({
//             title: "ERROR",
//             content: res.data.msg,
//           });
//         }
//       })
//       .catch((err) => {
//         console.log(err);
//         hook.error({
//           title: "ERROR",
//           content: err.message || "Internal Server Error",
//         });
//       });
//     setLoading(false);
//   };
//   return (
//     <Modal
//       open={open}
//       title="Konfirmasi Hapus"
//       onCancel={() => setOpen(false)}
//       onOk={handleSubmit}
//       okButtonProps={{ loading: loading }}
//     >
//       <div className="p-5">
//         <p>Konfirmasi hapus data *{record.name}*?</p>
//       </div>
//     </Modal>
//   );
// };
