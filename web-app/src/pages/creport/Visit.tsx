import {
  Button,
  DatePicker,
  Input,
  Popover,
  Select,
  Table,
  type TableProps,
  Card,
  Row,
  Col,
} from "antd";
import {
  Plus,
  Edit,
  Trash,
  Filter,
  CalendarArrowUp,
  CalendarArrowDownIcon,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
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
import { CloseOutlined, FolderOutlined } from "@ant-design/icons";
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

  // Calculate statistics from data
  const stats = {
    total: pageprops.total,
    approved: pageprops.data.filter((v) => v.approve_status === "APPROVED")
      .length,
    rejected: pageprops.data.filter((v) => v.approve_status === "REJECTED")
      .length,
    pending: pageprops.data.filter((v) => v.approve_status === "PENDING")
      .length,
  };
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
    if (pageprops.submissionTypeId)
      params.append("submissionTypeId", pageprops.submissionTypeId);

    await api
      .request({
        url: "/visit",
        method: "GET",
        params: {
          page: pageprops.page,
          limit: pageprops.limit,
          search: pageprops.search,
          visitCategoryId: pageprops.visitCategoryId,
          visitStatusId: pageprops.visitStatusId,
          visitPurposeId: pageprops.visitPurposeId,
          approve_status: pageprops.approve_status,
          backdate: pageprops.backdate,
          submissionTypeId: pageprops.submissionTypeId,
        },
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
          url: "/visit_category",
        })
        .then((res) => setVisitCategories(res.data.data));
      await api
        .request({
          method: "GET",
          url: "/visit_status",
        })
        .then((res) => setVisitStatuses(res.data.data));
      await api
        .request({
          method: "GET",
          url: "/visit_purpose",
        })
        .then((res) => setVisitPurposes(res.data.data));
      await api
        .request({
          method: "GET",
          url: "/sub_type",
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
    pageprops.submissionTypeId,
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
      title: "Tanggal",
      key: "created_at",
      dataIndex: "created_at",
      render(_value, record, _index) {
        return (
          <div>
            <div className="flex gap-2 items-center">
              <CalendarArrowUp size={10} />{" "}
              {moment(record.date).format("DD/MM/YY HH:mm")}
            </div>
            <div className="text-xs opacity-80 flex gap-2 items-center">
              <CalendarArrowDownIcon size={10} />{" "}
              {moment(record.date_action).format("DD/MM/YY HH:mm")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Hasil Kunjungan",
      key: "hasil",
      dataIndex: ["VisitStatus", "name"],
      width: 250,
      render(value, record, _index) {
        return (
          <div>
            <div>{value}</div>
            <div className="text-xs opacity-80">
              <CollapseText text={record.summary || ""} maxLength={40} />
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
      title: "Tindak Lanjut",
      key: "next_action",
      dataIndex: "next_action",
      render(_value, record, _index) {
        return <CollapseText text={record.next_action || ""} />;
      },
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render(_value, record, _index) {
        const statusConfig = {
          APPROVED: {
            color: "green",
            label: "✅ DISETUJUI",
            bgColor: "bg-green-100",
            textColor: "text-green-700",
          },
          REJECTED: {
            color: "red",
            label: "❌ DITOLAK",
            bgColor: "bg-red-100",
            textColor: "text-red-700",
          },
          PENDING: {
            color: "orange",
            label: "⏳ MENUNGGU",
            bgColor: "bg-orange-100",
            textColor: "text-orange-700",
          },
        };
        const config =
          statusConfig[record.approve_status as keyof typeof statusConfig] ||
          statusConfig.PENDING;
        return (
          <div className="flex justify-center">
            <span
              className={`${config.bgColor} ${config.textColor} px-3 py-1 rounded-full text-sm font-semibold`}
            >
              {config.label}
            </span>
          </div>
        );
      },
    },
    {
      title: "LastUpdate",
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
      title: "Aksi",
      key: "action",
      dataIndex: "action",
      render(_value, record, _index) {
        return (
          <div className="flex items-center gap-1">
            <Link to={"/app/callreport/visit/" + record.id}>
              <Button
                icon={<FolderOutlined size={15} />}
                size="small"
                type="primary"
              ></Button>
            </Link>
            {hasAccess(window.location.pathname, "update") && (
              <Link to={"/app/callreport/visit/upsert/" + record.id}>
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
    <div className="p-2 w-96 max-h-72 overflow-y-auto">
      <div className="flex flex-col w-full">
        <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Jenis Pemohon
        </label>
        <Select
          placeholder="Pilih jenis pemohon..."
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
        <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Kategori Kunjungan
        </label>
        <Select
          placeholder="Pilih kategori kunjungan..."
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
        <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          Tujuan Kunjungan
        </label>
        <Select
          placeholder="Pilih tujuan kunjungan..."
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
        <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          Hasil Kunjungan
        </label>
        <Select
          placeholder="Pilih hasil kunjungan..."
          className="w-full"
          options={visitStatuses.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) => setPageprops({ ...pageprops, visitStatusId: val })}
          allowClear
          value={pageprops.visitStatusId}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          Status Kunjungan
        </label>
        <Select
          placeholder="Pilih status kunjungan..."
          className="w-full"
          options={[
            { label: "🟡 PENDING", value: "PENDING" },
            { label: "✅ APPROVED", value: "APPROVED" },
            { label: "❌ REJECTED", value: "REJECTED" },
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
        <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
          Periode Tanggal
        </label>
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
          style={{ width: "100%" }}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
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
              submissionTypeId: "",
            })
          }
        >
          Reset Filter
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Kunjungan
          </h1>
          <p className="text-slate-500 text-sm">
            Monitoring data kunjungan debitur
          </p>
        </div>
      </div>

      {/* --- STATISTICS CARDS --- */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={12} lg={6}>
          <Card
            className="shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow"
            styles={{
              body: { padding: "10px" },
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-xs font-semibold">
                  Total Kunjungan
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
              </div>
              <FileText className="text-blue-200" size={32} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card
            className="shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-shadow"
            styles={{ body: { padding: 10 } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-xs font-semibold">
                  Disetujui
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </div>
              </div>
              <CheckCircle className="text-green-200" size={32} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card
            className="shadow-sm border-l-4 border-l-orange-500 hover:shadow-md transition-shadow"
            styles={{ body: { padding: "10px" } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-xs font-semibold">
                  Menunggu
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pending}
                </div>
              </div>
              <Clock className="text-orange-200" size={32} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card
            className="shadow-sm border-l-4 border-l-red-500 hover:shadow-md transition-shadow"
            styles={{ body: { padding: "10px" } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-xs font-semibold">
                  Ditolak
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </div>
              </div>
              <XCircle className="text-red-200" size={32} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="flex gap-2">
            {hasAccess(window.location.pathname, "write") && (
              <Link to={"/app/callreport/visit/upsert"}>
                <Button
                  icon={<Plus size={14} />}
                  type="primary"
                  size="small"
                  className="flex items-center gap-1 text-sm"
                >
                  Tambah
                </Button>
              </Link>
            )}
          </div>
          <div className="flex-1 flex items-center gap-2 justify-end flex-wrap">
            <Input.Search
              type="text"
              placeholder="Cari nama/ID/NIK..."
              className="transition-all"
              size="small"
              style={{ width: "auto", minWidth: 180 }}
              onChange={(e) =>
                setPageprops({ ...pageprops, search: e.target.value })
              }
            />
            <Popover
              content={content}
              title="⚙️ Filter Data"
              trigger="click"
              placement="topRight"
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
                    : "default"
                }
                icon={<Filter size={14} />}
                className="flex items-center gap-1 text-sm"
              >
                Filter
              </Button>
            </Popover>
          </div>
        </div>

        <Table
          size="small"
          loading={loading}
          rowKey={"id"}
          scroll={{
            x: "max-content",
            y: window.innerWidth > 600 ? "53vh" : "65vh",
          }}
          columns={columns}
          dataSource={pageprops.data}
          className="rounded-lg overflow-hidden"
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
            showSizeChanger: true,
            showQuickJumper: true,
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
