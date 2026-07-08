import {
  App,
  Button,
  Divider,
  Input,
  Modal,
  Table,
  Tag,
  Tooltip,
  Select,
  Popconfirm,
  type TableProps,
} from "antd";
import {
  Plus,
  Edit,
  Trash,
  FileText,
  ExternalLink,
  PlusCircle,
  X,
  Building2,
  FileArchive,
  Upload,
  CheckCircle2,
  Clock,
  Tags,
  FolderTree,
  Save,
  Filter,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import type {
  IActionPage,
  ILibrary,
  ILibraryCategory,
  IPageProps,
} from "../../libs/interface";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
import { CollapseText } from "../utils/utilComp";
import { InputFileUploadVisit, InputUtil } from "../utils/utilForm";

// ─── Types & Interfaces ──────────────────────────────────────────────────────

interface FileEntry {
  name: string;
  url: string;
}

// Tambahkan field library_category_id ke ILibrary jika belum ada di interface global
interface ExtendedLibrary extends ILibrary {}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseFiles = (raw: string | null | undefined): FileEntry[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as FileEntry[];
    return [];
  } catch {
    return [{ name: "File", url: raw }];
  }
};

const serializeFiles = (files: FileEntry[]): string => {
  const valid = files.filter((f) => f.url);
  return valid.length ? JSON.stringify(valid) : "";
};

// ─── Section Header ──────────────────────────────────────────────────────────

const SectionHeader = ({
  icon,
  title,
  subtitle,
  color = "#4f46e5",
  bgColor = "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)",
  borderColor = "#c7d2fe",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}) => (
  <div className="flex items-center gap-3 mb-4">
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: color,
        flexShrink: 0,
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
      }}
    >
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{subtitle}</p>
      )}
    </div>
  </div>
);

// ─── File Card ───────────────────────────────────────────────────────────────

const FileCard = ({
  file,
  index,
  onUpdate,
  onRemove,
}: {
  file: FileEntry;
  index: number;
  onUpdate: (patch: Partial<FileEntry>) => void;
  onRemove: () => void;
}) => {
  const hasFile = !!file.url;

  return (
    <div
      style={{
        border: `1px solid ${hasFile ? "#86efac" : "#e2e8f0"}`,
        borderRadius: 12,
        background: hasFile ? "#f0fdf4" : "#ffffff",
        padding: "12px 14px",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: hasFile ? "#dcfce7" : "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasFile ? (
              <CheckCircle2 size={14} color="#16a34a" />
            ) : (
              <Clock size={14} color="#94a3b8" />
            )}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: hasFile ? "#15803d" : "#64748b",
            }}
          >
            {hasFile ? "Berkas tersedia" : "Belum diunggah"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {hasFile && (
            <Tooltip title="Buka file">
              <a href={file.url} target="_blank" rel="noreferrer">
                <Button
                  size="small"
                  icon={<ExternalLink size={12} />}
                  style={{ height: 26, padding: "0 8px", fontSize: 12 }}
                >
                  Lihat
                </Button>
              </a>
            </Tooltip>
          )}
          <Tooltip title="Hapus berkas ini">
            <Button
              size="small"
              danger
              type="text"
              icon={<X size={14} />}
              onClick={onRemove}
              style={{ height: 26, width: 26, padding: 0 }}
            />
          </Tooltip>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label
          style={{
            fontSize: 11,
            color: "#64748b",
            fontWeight: 600,
            display: "block",
            marginBottom: 4,
          }}
        >
          Nama Dokumen
        </label>
        <Input
          size="small"
          placeholder="mis. PKS, BPKB, SK Pensiun..."
          value={file.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          prefix={
            <FileText size={12} color="#94a3b8" style={{ marginRight: 4 }} />
          }
          style={{ fontSize: 13, padding: "4px 8px" }}
        />
      </div>

      <div>
        <label
          style={{
            fontSize: 11,
            color: "#64748b",
            fontWeight: 600,
            display: "block",
            marginBottom: 4,
          }}
        >
          Unggah File (PDF / Gambar)
        </label>
        <InputFileUploadVisit
          filetype="application/pdf, image/*"
          record={{ name: file.name || `Berkas ${index + 1}`, url: file.url }}
          ondelete={() => onUpdate({ url: "" })}
          onchange={(e: { name: string; url: string | null }) =>
            onUpdate({ url: e.url ?? "" })
          }
          noname
        />
      </div>
    </div>
  );
};

const FileListEditor = ({
  files,
  onChange,
}: {
  files: FileEntry[];
  onChange: (files: FileEntry[]) => void;
}) => {
  const update = (index: number, patch: Partial<FileEntry>) =>
    onChange(files.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  const remove = (index: number) =>
    onChange(files.filter((_, i) => i !== index));
  const add = () => onChange([...files, { name: "", url: "" }]);
  const uploadedCount = files.filter((f) => f.url).length;

  return (
    <div>
      <SectionHeader
        icon={<FileArchive size={16} />}
        title="Berkas & Dokumen"
        subtitle={
          files.length
            ? `${uploadedCount} dari ${files.length} berkas tersedia`
            : "Belum ada berkas terlampir"
        }
        color="#0891b2"
        bgColor="linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)"
        borderColor="#a5f3fc"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {files.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "24px 16px",
              border: "2px dashed #e2e8f0",
              borderRadius: 12,
              background: "#f8fafc",
              color: "#64748b",
            }}
          >
            <Upload size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 13 }}>
              Klik <strong>Tambah Berkas</strong> di bawah untuk melampirkan
              dokumen baru.
            </p>
          </div>
        )}
        {files.map((file, i) => (
          <FileCard
            key={i}
            file={file}
            index={i}
            onUpdate={(patch) => update(i, patch)}
            onRemove={() => remove(i)}
          />
        ))}
      </div>
      <Button
        type="dashed"
        icon={<PlusCircle size={14} />}
        onClick={add}
        style={{
          marginTop: 12,
          width: "100%",
          height: 36,
          fontSize: 13,
          fontWeight: 500,
          borderColor: "#cbd5e1",
          color: "#475569",
        }}
      >
        Tambah Lembar Berkas
      </Button>
    </div>
  );
};

// ─── Kolom Display ────────────────────────────────────────────────────────────

const FileListDisplay = ({ raw }: { raw: string | null | undefined }) => {
  const files = parseFiles(raw);
  if (!files.length)
    return <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {files.map((f, i) => (
        <Tooltip key={i} title={f.url || "Belum ada URL"}>
          <a
            href={f.url || undefined}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => !f.url && e.preventDefault()}
          >
            <Tag
              icon={<FileText size={10} style={{ marginRight: 3 }} />}
              color={f.url ? "blue" : "default"}
              style={{
                cursor: f.url ? "pointer" : "default",
                fontSize: 11,
                padding: "2px 6px",
                margin: 0,
                borderRadius: 4,
                border: f.url ? "1px solid #93c5fd" : "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              {f.name || `Berkas ${i + 1}`}
            </Tag>
          </a>
        </Tooltip>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DataLibrary() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<ExtendedLibrary>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    categoryId: null,
  });
  const [action, setAction] = useState<IActionPage<ExtendedLibrary>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const [libcate, setLibcate] = useState<ILibraryCategory[]>([]);
  const [catModalOpen, setCatModalOpen] = useState(false); // State untuk modal kategori
  const { modal, message } = App.useApp();
  const { hasAccess } = useContext((state: any) => state);

  const getData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) params.append("search", pageprops.search);
    if (pageprops.categoryId) params.append("categoryId", pageprops.categoryId);

    try {
      const res = await api.request({
        url: `${import.meta.env.VITE_API_URL}/library?${params}`,
        method: "GET",
      });
      setPageprops((prev) => ({
        ...prev,
        data: res.data.data,
        total: res.data.total,
      }));
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [pageprops.page, pageprops.limit, pageprops.search, pageprops.categoryId]);

  const getCategory = async () => {
    try {
      const res = await api.request({
        url: `${import.meta.env.VITE_API_URL}/library_category?limit=100`,
        method: "GET",
      });
      setLibcate(res.data.data);
    } catch (error) {
      console.error("Fetch Category Error:", error);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      getData();
    }, 500);
    return () => clearTimeout(t);
  }, [getData]);

  useEffect(() => {
    getCategory();
  }, []);

  const columns: TableProps<ExtendedLibrary>["columns"] = useMemo(
    () => [
      {
        title: "ID",
        key: "id",
        dataIndex: "id",
        width: 60,
        render(value, _r, index) {
          return (
            <>
              <div className="font-semibold text-slate-700">
                {(pageprops.page - 1) * pageprops.limit + index + 1}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {value.substring(0, 5)}..
              </div>
            </>
          );
        },
      },
      {
        title: "Informasi",
        key: "name",
        width: 250,
        fixed: window && window.innerWidth > 600 ? "left" : false,
        render(_v, record) {
          return (
            <div className="flex flex-col gap-1">
              <div className="font-bold text-slate-800 text-sm">
                {record.name}
              </div>
              <div className="flex items-center gap-2">
                <Tag
                  color="cyan"
                  style={{
                    margin: 0,
                    fontSize: 10,
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  @{record.code}
                </Tag>
                {record.LibraryCategory?.name && (
                  <Tag
                    icon={<FolderTree size={10} className="mr-1" />}
                    color="purple"
                    style={{ margin: 0, fontSize: 10, borderRadius: 4 }}
                  >
                    {record.LibraryCategory.name}
                  </Tag>
                )}
              </div>
            </div>
          );
        },
      },
      {
        title: "Dokumen & Lemari",
        key: "contract",
        width: 300,
        render(_v, record) {
          return (
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                <FileArchive size={12} /> Loker / Lemari:{" "}
                <span className="text-slate-800">
                  {record.drawer_code || "—"}
                </span>
              </div>
              <FileListDisplay raw={record.file} />
            </div>
          );
        },
      },
      {
        title: "Kategori",
        key: "category",
        render(_v, record) {
          return <Tag>{record.LibraryCategory.name}</Tag>;
        },
      },
      {
        title: "Aksi",
        key: "action",
        width: 100,
        align: "center",
        render(_v, record) {
          return (
            <div className="flex items-center justify-center gap-2">
              {hasAccess(window.location.pathname, "update") && (
                <Tooltip title="Edit Data">
                  <Button
                    icon={<Edit size={14} />}
                    size="small"
                    type="primary"
                    ghost
                    onClick={() =>
                      setAction((prev) => ({ ...prev, upsert: true, record }))
                    }
                  />
                </Tooltip>
              )}
              {hasAccess(window.location.pathname, "delete") && (
                <Tooltip title="Hapus Data">
                  <Button
                    icon={<Trash size={14} />}
                    size="small"
                    danger
                    onClick={() =>
                      setAction((prev) => ({ ...prev, delete: true, record }))
                    }
                  />
                </Tooltip>
              )}
            </div>
          );
        },
      },
    ],
    [pageprops.page, pageprops.limit, hasAccess],
  );

  return (
    <div className="space-y-4 max-w-full">
      {/* Header Halaman */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 size={24} className="text-indigo-600" /> E-Library
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola data berkas-berkas internal dan eksternal.
          </p>
        </div>
        <div className="flex gap-2">
          {hasAccess(window.location.pathname, "write") && (
            <Button
              onClick={() => setCatModalOpen(true)}
              icon={<Tags size={15} />}
              style={{
                background: "#f8fafc",
                borderColor: "#cbd5e1",
                color: "#334155",
                fontWeight: 500,
              }}
            >
              Kategori
            </Button>
          )}
          {hasAccess(window.location.pathname, "write") && (
            <Button
              onClick={() => setAction({ ...action, upsert: true })}
              icon={<Plus size={15} />}
              type="primary"
              style={{
                background: "linear-gradient(to right, #4f46e5, #6366f1)",
                fontWeight: 500,
              }}
            >
              Berkas Baru
            </Button>
          )}
        </div>
      </div>

      {/* Konten Tabel */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-end mb-3">
          <Select
            placeholder="Semua Kategori"
            allowClear
            suffixIcon={<Filter size={14} className="text-slate-400" />}
            style={{ width: 180 }}
            value={pageprops.categoryId}
            options={libcate.map((c) => ({ label: c.name, value: c.id }))}
            onChange={(val) =>
              setPageprops((prev) => ({ ...prev, categoryId: val, page: 1 }))
            }
          />
          <Input.Search
            placeholder="Cari berdasarkan nama atau kode..."
            size="middle"
            allowClear
            style={{ maxWidth: 300 }}
            onChange={(e) =>
              setPageprops((prev) => ({
                ...prev,
                search: e.target.value,
                page: 1,
              }))
            }
          />
        </div>
        <Table
          size="middle"
          loading={loading}
          rowKey="id"
          scroll={{
            x: "max-content",
            y: window.innerWidth > 600 ? "55vh" : "65vh",
          }}
          columns={columns}
          dataSource={pageprops.data}
          pagination={{
            current: pageprops.page,
            pageSize: pageprops.limit,
            total: pageprops.total,
            onChange: (page, pageSize) =>
              setPageprops((p) => ({ ...p, page, limit: pageSize })),
            pageSizeOptions: [20, 50, 100],
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} data`,
          }}
          rowClassName="hover:bg-slate-50 transition-colors"
        />
      </div>

      {/* UPSERT MODAL MITRA */}
      <UpsertData
        open={action.upsert}
        setOpen={(val) =>
          setAction((prev) => ({ ...prev, upsert: val, record: undefined }))
        }
        record={action.record}
        categories={libcate}
        getData={getData}
        hook={modal}
        key={action.record ? "upsert" + action.record.id : "upsert_new"}
      />

      {/* DELETE MODAL MITRA */}
      {action.delete && action.record && (
        <DeleteData
          open={action.delete}
          setOpen={(val) =>
            setAction((prev) => ({ ...prev, delete: val, record: undefined }))
          }
          record={action.record}
          getData={getData}
          hook={modal}
          key={"delete" + action.record.id}
        />
      )}

      {/* KATEGORI MANAGER MODAL */}
      <CategoryManager
        open={catModalOpen}
        onClose={() => {
          setCatModalOpen(false);
          getCategory(); // Refresh list setelah manage category
        }}
        hook={modal}
        messageApi={message}
      />
    </div>
  );
}

// ─── Kategori Manager Modal ───────────────────────────────────────────────────

const CategoryManager = ({
  open,
  onClose,
  hook,
  messageApi,
}: {
  open: boolean;
  onClose: () => void;
  hook: HookAPI;
  messageApi: any;
}) => {
  const [categories, setCategories] = useState<ILibraryCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: `${import.meta.env.VITE_API_URL}/library_category?limit=100`,
        method: "GET",
      });
      setCategories(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchCategories();
  }, [open]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      setLoading(true);
      await api.request({
        url: `${import.meta.env.VITE_API_URL}/library_category`,
        method: "POST",
        data: { name: newName },
      });
      messageApi.success("Kategori berhasil ditambahkan");
      setNewName("");
      fetchCategories();
    } catch (e: any) {
      hook.error({ title: "Gagal", content: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setLoading(true);
      await api.request({
        url: `${import.meta.env.VITE_API_URL}/library_category?id=${id}`,
        method: "PUT",
        data: { name: editName },
      });
      messageApi.success("Kategori diperbarui");
      setEditId(null);
      fetchCategories();
    } catch (e: any) {
      hook.error({ title: "Gagal", content: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await api.request({
        url: `${import.meta.env.VITE_API_URL}/library_category?id=${id}`,
        method: "DELETE",
      });
      messageApi.success("Kategori dihapus");
      fetchCategories();
    } catch (e: any) {
      hook.error({ title: "Gagal", content: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 text-indigo-700">
          <Tags size={18} /> <span>Manajemen Kategori</span>
        </div>
      }
      footer={null}
      width={500}
    >
      <div className="space-y-4 mt-4">
        {/* Input Tambah */}
        <div className="flex gap-2">
          <Input
            placeholder="Nama kategori baru..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onPressEnter={handleAdd}
          />
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleAdd}
            loading={loading}
          >
            Tambah
          </Button>
        </div>
        <Divider style={{ margin: "12px 0" }} />
        {/* List Kategori */}
        <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
            >
              {editId === cat.id ? (
                <div className="flex gap-2 flex-1 mr-2">
                  <Input
                    size="small"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <Button
                    size="small"
                    type="primary"
                    icon={<Save size={12} />}
                    onClick={() => handleSaveEdit(cat.id)}
                  />
                  <Button
                    size="small"
                    icon={<X size={12} />}
                    onClick={() => setEditId(null)}
                  />
                </div>
              ) : (
                <>
                  <span className="font-medium text-slate-700">{cat.name}</span>
                  <div className="flex gap-1">
                    <Button
                      size="small"
                      type="text"
                      icon={<Edit size={14} className="text-blue-500" />}
                      onClick={() => {
                        setEditId(cat.id);
                        setEditName(cat.name);
                      }}
                    />
                    <Popconfirm
                      title="Hapus kategori ini?"
                      onConfirm={() => handleDelete(cat.id)}
                    >
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<Trash size={14} />}
                      />
                    </Popconfirm>
                  </div>
                </>
              )}
            </div>
          ))}
          {categories.length === 0 && !loading && (
            <div className="text-center text-slate-400 py-6 text-sm">
              Belum ada data kategori.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─── UpsertData Modal ─────────────────────────────────────────────────────────

const FIELD_LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: "#475569",
  fontWeight: 600,
  marginBottom: 6,
  display: "block",
};

const UpsertData = ({
  open,
  setOpen,
  record,
  categories,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  record?: ExtendedLibrary;
  categories: ILibraryCategory[];
  getData: () => Promise<void>;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>(() =>
    parseFiles(record?.file),
  );
  const [data, setData] = useState<ExtendedLibrary>(() => ({
    ...defaultData,
    ...record,
  }));

  const set = (patch: Partial<ExtendedLibrary>) =>
    setData((p) => ({ ...p, ...patch }));

  const handleSubmit = async () => {
    if (!data.name) {
      hook.error({
        title: "Validasi Gagal",
        content: "Nama wajib diisi!",
      });
      return;
    }
    setLoading(true);
    const payload: ExtendedLibrary = { ...data, file: serializeFiles(files) };
    try {
      const res = await api.request({
        url: `${import.meta.env.VITE_API_URL}/library?id=${record?.id ?? ""}`,
        method: record ? "PUT" : "POST",
        data: payload,
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 200 || res.status === 201) {
        hook.success({
          title: "BERHASIL",
          content: res.data.msg || "Data berhasil disimpan",
        });
        setOpen(false);
        await getData();
      } else {
        hook.error({ title: "ERROR", content: res.data.msg });
      }
    } catch (err: any) {
      console.error(err);
      hook.error({
        title: "ERROR",
        content:
          err.response?.data?.msg || err.message || "Terjadi kesalahan server",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={null}
      style={{ top: 30 }}
      width={850}
      footer={null}
      styles={{ body: { padding: 0 } }}
      destroyOnClose
    >
      {/* ── Modal Header ── */}
      <div
        style={{
          padding: "20px 24px 16px",
          background: "linear-gradient(135deg, #f8faff 0%, #eff6ff 100%)",
          borderBottom: "1px solid #dbeafe",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(to right, #4f46e5, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.2)",
            }}
          >
            <Building2 size={22} color="white" />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: 18,
                color: "#1e293b",
                letterSpacing: "-0.01em",
              }}
            >
              {record ? "Edit Data " : "Registrasi Baru"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#64748b",
                marginTop: 2,
              }}
            >
              {record
                ? `ID: ${record.id} · @${record.code}`
                : "Lengkapi form di bawah untuk menambahkan data ke sistem"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal Body ── */}
      <div
        style={{ padding: "24px 28px", maxHeight: "65vh", overflowY: "auto" }}
      >
        {/* Seksi 1: Identitas */}
        <SectionHeader
          icon={<Building2 size={16} />}
          title="Identitas & Profil"
          subtitle="Informasi dasar"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px 20px",
            marginBottom: 28,
          }}
        >
          <div>
            <label style={FIELD_LABEL_STYLE}>
              Nama <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <InputUtil
              label=""
              type="text"
              value={data.name}
              placeholder="Contoh: Kepatuhan OJK"
              onchage={(e: string) => set({ name: e })}
            />
          </div>
          <div>
            <label style={FIELD_LABEL_STYLE}>
              Kode <span style={{ color: "#ef4444" }}></span>
            </label>
            <InputUtil
              label=""
              type="text"
              value={data.code}
              placeholder="Kode unik (mis. OJK)"
              onchage={(e: string) => set({ code: e })}
            />
          </div>
          <div>
            <label style={FIELD_LABEL_STYLE}>Kategori </label>
            <Select
              style={{ width: "100%" }}
              placeholder="Pilih Kategori"
              allowClear
              value={data.libraryCategoryId || undefined}
              onChange={(val) => set({ libraryCategoryId: val })}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              suffixIcon={<FolderTree size={14} />}
            />
          </div>
          <div>
            <label style={FIELD_LABEL_STYLE}>No Loker / Lemari</label>
            <InputUtil
              label=""
              type="text"
              value={data.drawer_code}
              placeholder="Kode penyimpanan fisik"
              onchage={(e: string) => set({ drawer_code: e })}
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={FIELD_LABEL_STYLE}>Catatan Tambahan (Opsional)</label>
            <InputUtil
              label=""
              type="area"
              value={data.desc}
              placeholder="Tuliskan keterangan detail terkait dara ini..."
              onchage={(e: string) => set({ desc: e })}
            />
          </div>
        </div>

        <Divider style={{ margin: "0 0 24px" }} />

        {/* Multi-file editor */}
        <div
          style={{
            borderRadius: 16,
            background: "#fff",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ padding: "16px" }}>
            <FileListEditor files={files} onChange={setFiles} />
          </div>
        </div>
      </div>

      {/* ── Modal Footer ── */}
      <div
        style={{
          padding: "16px 28px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          background: "#f8fafc",
          borderRadius: "0 0 8px 8px",
        }}
      >
        <Button
          onClick={() => setOpen(false)}
          style={{ borderRadius: 6, fontWeight: 500 }}
        >
          Batal
        </Button>
        <Button
          type="primary"
          loading={loading}
          disabled={!data.name || !data.code}
          onClick={handleSubmit}
          icon={<Save size={16} />}
          style={{
            minWidth: 100,
            borderRadius: 6,
            background: "linear-gradient(to right, #4f46e5, #6366f1)",
            fontWeight: 600,
          }}
        >
          Simpan Data
        </Button>
      </div>
    </Modal>
  );
};

// ─── DeleteData Modal ─────────────────────────────────────────────────────────

const DeleteData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  record: ExtendedLibrary;
  getData: () => Promise<void>;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: `${import.meta.env.VITE_API_URL}/library?id=${record.id}`,
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 200 || res.status === 201) {
        hook.success({
          title: "BERHASIL",
          content: res.data.msg || "Data berhasil dihapus",
        });
        setOpen(false);
        await getData();
      } else {
        hook.error({ title: "ERROR", content: res.data.msg });
      }
    } catch (err: any) {
      console.error(err);
      hook.error({
        title: "ERROR",
        content:
          err.response?.data?.msg || err.message || "Internal Server Error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-2 text-rose-600">
          <Trash size={18} /> <span>Konfirmasi Penghapusan</span>
        </div>
      }
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      okButtonProps={{ loading, danger: true }}
      okText="Ya, Hapus Permanen"
      cancelText="Batal"
      centered
    >
      <div className="py-4">
        <p className="text-slate-700 text-sm">
          Apakah Anda yakin ingin menghapus data{" "}
          <strong className="text-slate-900">{record.name}</strong> secara
          permanen?
        </p>
        <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2">
          <span className="text-rose-500 mt-0.5">⚠️</span>
          <p className="text-xs text-rose-700 m-0">
            Tindakan ini tidak dapat dibatalkan. Seluruh tautan dokumen dan
            riwayat yang terhubung dengan ini juga akan dihapus dari arsip
            sistem.
          </p>
        </div>
      </div>
    </Modal>
  );
};

// ─── Default data ─────────────────────────────────────────────────────────────

const defaultData: ExtendedLibrary = {
  id: "",
  name: "",
  code: "",
  drawer_code: "",
  file: "",
  desc: "",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  LibraryCategory: {} as ILibraryCategory,
  libraryCategoryId: "", // Tambahan untuk memfasilitasi relasi Dropdown
};
