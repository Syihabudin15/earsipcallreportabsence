import {
  App,
  Button,
  Checkbox,
  Input,
  Modal,
  Table,
  Typography,
  type TableProps,
} from "antd";
import { Plus, Edit, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IPageProps,
  IPermission,
  IRole,
} from "../../libs/interface";
import { menus } from "../../libs/list_app";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
const { Text } = Typography;

export default function DataRole() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IRole>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
  });
  const [action, setAction] = useState<IActionPage<IRole>>({
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
        url: `${import.meta.env.VITE_API_URL}/role?${params.toString()}`,
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

  const columns: TableProps<IRole>["columns"] = [
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
      title: "Role",
      key: "name",
      dataIndex: "name",
    },
    {
      title: "Jumlah Menu",
      key: "permission",
      dataIndex: "permission",
      render(_value, record, _index) {
        return (
          <>
            {record.permission
              ? JSON.parse(String(record.permission) || "[]").length
              : "0"}
          </>
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
  return (
    <div className="space-y-2">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Role
          </h1>
          <p className="text-slate-500 text-sm">Manajemen Peran Pengguna.</p>
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
  record?: IRole;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IRole>(record || defaultData);
  const [usermenu, setUsermenu] = useState<IPermission[]>(
    record
      ? (MergeMenu(
          defaultMenu,
          JSON.parse(String(record.permission) || "[]"),
        ) as IPermission[])
      : defaultMenu,
  );

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
        url: import.meta.env.VITE_API_URL + "/role?id=" + record?.id,
        method: record ? "PUT" : "POST",
        data: {
          ...data,
          permission: usermenu.filter((u) => u.access.length !== 0),
        },
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

  const columns: TableProps<IPermission>["columns"] = [
    {
      title: "Menu",
      key: "menu",
      dataIndex: "name",
    },
    {
      title: "Path",
      key: "path",
      dataIndex: "path",
    },
    {
      title: "Hak Akses",
      dataIndex: "access",
      key: "access",
      className: "text-xs",
      onHeaderCell: () => {
        return {
          ["style"]: {
            textAlign: "center",
            fontSize: 12,
          },
        };
      },
      render(_value, record, _index) {
        return (
          <>
            <Checkbox.Group
              options={[
                "read",
                "write",
                "update",
                "delete",
                "proses",
                "download",
              ]}
              value={record.access}
              onChange={(e) => {
                setUsermenu((prev: IPermission[]) => {
                  const filter = prev.map((p) => {
                    if (p.path === record.path) {
                      p.access = e;
                    }
                    return p;
                  });
                  return filter;
                });
              }}
            />
          </>
        );
      },
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={`Upsert Data ${record ? record.name : ""}`}
      style={{ top: 10 }}
      width={1000}
      onOk={handleSubmit}
      okButtonProps={{ loading: loading, disabled: !data.id || !data.name }}
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
          <Text strong>Nama Role:</Text>
          <Input
            placeholder="Masukkan nama..."
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            style={{ marginTop: "8px" }}
          />
        </div>

        <div>
          <Text strong>Permissions:</Text>
          <div>
            <Table
              rowKey={"path"}
              columns={columns}
              dataSource={usermenu}
              size="small"
              pagination={false}
              scroll={{
                x: "max-content",
                y: window.innerWidth > 600 ? "45vh" : "60vh",
              }}
              bordered
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

const defaultMenu: IPermission[] = menus
  .filter((u) => u.need_access)
  .flatMap((m) => {
    if (m.children && m.children.length > 0) {
      return m.children
        .filter((c) => c.need_access)
        .map((c) => ({
          ...c,
          access: [],
        }));
    } else {
      return {
        ...m,
        access: [],
      };
    }
  });

function MergeMenu(allmenus: IPermission[], usermenus: IPermission[]) {
  const mergedMenu = allmenus.map((item) => {
    const found = usermenus.find((r) => r.path === item.path);
    return {
      ...item,
      access: found ? found.access : [],
    };
  });
  return mergedMenu;
}

const defaultData: IRole = {
  id: "",
  name: "",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  permission: [],
  data_status: "ALL",
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
  record: IRole;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/role?id=" + record?.id,
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
