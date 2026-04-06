import {
  Button,
  Input,
  Popover,
  Select,
  Table,
  type TableProps,
  Card,
  Row,
  Col,
  Tag,
  message,
  Popconfirm,
  Modal,
  Form,
} from "antd";
import {
  Plus,
  Filter,
  Users,
  UserCheck,
  Phone,
  Mail,
  Edit2,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { IPageProps, IUser, IRole, IPosition } from "../../libs/interface";
import useContext from "../../libs/context";
import { CloseOutlined } from "@ant-design/icons";
import api from "../../libs/api";

export default function UserManagement() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IUser>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
  });
  const { hasAccess } = useContext((state: any) => state);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [positions, setPositions] = useState<IPosition[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [openModal, setOpenModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);

  // Calculate statistics from data
  const stats = {
    total: pageprops.total,
    active: pageprops.data.length,
  };

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) params.append("search", pageprops.search);

    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/user?${params.toString()}`,
        method: "GET",
      })
      .then((res) =>
        setPageprops((prev) => ({
          ...prev,
          data: res.data.data,
          total: res.data.total,
        })),
      )
      .catch(() => console.log("Error fetching users"));
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const [rolesRes, positionsRes] = await Promise.all([
          api.request({
            method: "GET",
            url: `${import.meta.env.VITE_API_URL}/role`,
          }),
          api.request({
            method: "GET",
            url: `${import.meta.env.VITE_API_URL}/position`,
          }),
        ]);
        setRoles(rolesRes.data.data);
        setPositions(positionsRes.data.data);
      } catch (err) {
        console.log("Error fetching roles/positions");
      }
    })();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageprops.page, pageprops.limit, pageprops.search]);

  const handleOpenModal = (user?: IUser) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        nik: user.nik,
        nip: user.nip,
        position_id: (user as any).position_id || user.Position?.id,
        role_id: (user as any).role_id || user.Role?.id,
        absence_method: user.absence_method,
      });
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleSaveUser = async (values: any) => {
    setModalLoading(true);
    try {
      if (editingUser) {
        await api.request({
          url: `${import.meta.env.VITE_API_URL}/user/${editingUser.id}`,
          method: "PUT",
          data: values,
        });
        messageApi.success("User berhasil diupdate!");
      } else {
        await api.request({
          url: `${import.meta.env.VITE_API_URL}/user`,
          method: "POST",
          data: values,
        });
        messageApi.success("User berhasil ditambahkan!");
      }
      handleCloseModal();
      await getData();
    } catch (err: any) {
      messageApi.error(err.response?.data?.message || "Terjadi kesalahan!");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.request({
        url: `${import.meta.env.VITE_API_URL}/user/${id}`,
        method: "DELETE",
      });
      messageApi.success("User berhasil dihapus!");
      await getData();
    } catch (err: any) {
      messageApi.error(err.response?.data?.message || "Terjadi kesalahan!");
    }
  };

  const columns: TableProps<IUser>["columns"] = [
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
      title: "Nama User",
      key: "fullname",
      dataIndex: "fullname",
      fixed: window.innerWidth > 600 ? "left" : undefined,
      render(value, record, _index) {
        return (
          <div>
            <div className="font-semibold">{value}</div>
            <div className="text-xs opacity-80">
              Username: {record.username}
            </div>
          </div>
        );
      },
    },
    {
      title: "NIK/NIP",
      key: "nik",
      dataIndex: "nik",
      render(_value, record, _index) {
        return (
          <div className="text-xs">
            <div>NIK: {record.nik || "-"}</div>
            <div>NIP: {record.nip || "-"}</div>
          </div>
        );
      },
    },
    {
      title: "Kontak",
      key: "contact",
      dataIndex: "phone",
      render(_value, record, _index) {
        return (
          <div className="space-y-1">
            <div className="text-xs flex items-center gap-1">
              <Phone size={12} />
              {record.phone || "-"}
            </div>
            <div className="text-xs flex items-center gap-1">
              <Mail size={12} />
              {record.email || "-"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Jabatan",
      key: "position",
      dataIndex: ["Position", "name"],
      render(value) {
        return <Tag color="cyan">{value}</Tag>;
      },
    },
    {
      title: "Role",
      key: "role",
      dataIndex: ["Role", "name"],
      render(value) {
        return <Tag color="blue">{value || "N/A"}</Tag>;
      },
    },
    {
      title: "Metode Absensi",
      key: "absence_method",
      dataIndex: "absence_method",
      render(value) {
        return (
          <Tag
            color={value === "FACE" ? "purple" : "green"}
            className="text-xs"
          >
            {value === "FACE" ? "👤 Face Recognition" : "🔘 Button"}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "id",
      render(_value, _record, _index) {
        return (
          <div className="flex justify-center">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <UserCheck size={14} /> Aktif
            </span>
          </div>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      fixed: "right",
      width: 100,
      render(_value, record, _index) {
        return (
          <div className="flex items-center gap-1">
            {hasAccess(window.location.pathname, "write") && (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<Edit2 size={14} />}
                  onClick={() => handleOpenModal(record)}
                  className="text-blue-500 hover:text-blue-700"
                />
                <Popconfirm
                  title="Hapus User"
                  description="Apakah Anda yakin ingin menghapus user ini?"
                  onConfirm={() => handleDeleteUser(record.id)}
                  okText="Ya"
                  cancelText="Tidak"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<Trash2 size={14} />}
                    className="text-red-500 hover:text-red-700"
                  />
                </Popconfirm>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const content = (
    <div className="p-4 w-96 max-h-96 overflow-y-auto space-y-4">
      <div className="flex flex-col w-full">
        <label className="mb-2 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Role
        </label>
        <Select
          placeholder="Pilih role..."
          className="w-full"
          options={roles.map((r) => ({ label: r.name, value: r.id }))}
          onChange={(val) =>
            setPageprops({ ...pageprops, submissionTypeId: val })
          }
          allowClear
          optionFilterProp={"label"}
          showSearch
          size="large"
        />
      </div>
      <div className="flex flex-col w-full">
        <label className="mb-2 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Jabatan
        </label>
        <Select
          placeholder="Pilih jabatan..."
          className="w-full"
          options={positions.map((p) => ({ label: p.name, value: p.id }))}
          allowClear
          optionFilterProp={"label"}
          showSearch
          size="large"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          size="large"
          danger
          icon={<CloseOutlined />}
          onClick={() =>
            setPageprops({
              ...pageprops,
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
    <div className="space-y-3 min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 p-3 md:p-4">
      {/* --- HEADER WITH GRADIENT --- */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl p-4 md:p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              👤 Manajemen User
            </h1>
            <p className="text-blue-100 text-sm md:text-base hidden md:block">
              Kelola data pengguna sistem
            </p>
          </div>
        </div>
      </div>

      {/* --- STATISTICS CARDS --- */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow"
            styles={{ body: { padding: "10px" } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-xs font-semibold">
                  Total User
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
              </div>
              <Users className="text-blue-200" size={32} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-shadow"
            styles={{ body: { padding: "10px" } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-xs font-semibold">Aktif</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
              </div>
              <UserCheck className="text-green-200" size={32} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex gap-2">
            {hasAccess(window.location.pathname, "write") && (
              <Button
                icon={<Plus size={14} />}
                type="primary"
                size="middle"
                className="flex items-center gap-1 text-sm"
                onClick={() => handleOpenModal()}
              >
                Tambah
              </Button>
            )}
          </div>
          <div className="flex-1 flex items-center gap-2 justify-end flex-wrap">
            <Input.Search
              type="text"
              placeholder="Cari nama/username/email..."
              className="transition-all"
              size="middle"
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
                size="middle"
                type="default"
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

      {/* --- MODAL FORM (2-COLUMN LAYOUT) --- */}
      <Modal
        title={editingUser ? "✏️ Edit User" : "➕ Tambah User Baru"}
        open={openModal}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
        styles={{ body: { padding: "24px" } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveUser}
          autoComplete="off"
        >
          <Row gutter={[24, 0]}>
            {/* --- COLUMN 1: BASIC INFO --- */}
            <Col xs={24} lg={12}>
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  📋 Informasi Dasar
                </h3>

                <Form.Item
                  label="Username"
                  name="username"
                  rules={[
                    { required: true, message: "Username harus diisi!" },
                    { min: 3, message: "Username minimal 3 karakter!" },
                  ]}
                >
                  <Input placeholder="Masukkan username" size="large" />
                </Form.Item>

                <Form.Item
                  label="Nama Lengkap"
                  name="fullname"
                  rules={[
                    { required: true, message: "Nama lengkap harus diisi!" },
                  ]}
                >
                  <Input placeholder="Masukkan nama lengkap" size="large" />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Email harus diisi!" },
                    { type: "email", message: "Format email tidak valid!" },
                  ]}
                >
                  <Input
                    placeholder="Masukkan email"
                    type="email"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="No. Telepon"
                  name="phone"
                  rules={[
                    { required: true, message: "No. telepon harus diisi!" },
                  ]}
                >
                  <Input placeholder="Masukkan no. telepon" size="large" />
                </Form.Item>

                <Form.Item label="NIK" name="nik">
                  <Input placeholder="Masukkan NIK (opsional)" size="large" />
                </Form.Item>

                <Form.Item label="NIP" name="nip">
                  <Input placeholder="Masukkan NIP (opsional)" size="large" />
                </Form.Item>
              </div>
            </Col>

            {/* --- COLUMN 2: ACCESS SETTINGS --- */}
            <Col xs={24} lg={12}>
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  🔐 Pengaturan Akses
                </h3>

                <Form.Item
                  label="Jabatan"
                  name="position_id"
                  rules={[
                    { required: true, message: "Jabatan harus dipilih!" },
                  ]}
                >
                  <Select
                    placeholder="Pilih jabatan"
                    options={positions.map((p) => ({
                      label: p.name,
                      value: p.id,
                    }))}
                    optionFilterProp="label"
                    showSearch
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="Role"
                  name="role_id"
                  rules={[{ required: true, message: "Role harus dipilih!" }]}
                >
                  <Select
                    placeholder="Pilih role"
                    options={roles.map((r) => ({
                      label: r.name,
                      value: r.id,
                    }))}
                    optionFilterProp="label"
                    showSearch
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="Metode Absensi"
                  name="absence_method"
                  rules={[
                    {
                      required: true,
                      message: "Metode absensi harus dipilih!",
                    },
                  ]}
                >
                  <Select
                    placeholder="Pilih metode absensi"
                    options={[
                      { label: "🔘 Button", value: "BUTTON" },
                      { label: "👤 Face Recognition", value: "FACE" },
                    ]}
                    size="large"
                  />
                </Form.Item>

                {!editingUser && (
                  <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                      { required: true, message: "Password harus diisi!" },
                      {
                        min: 6,
                        message: "Password minimal 6 karakter!",
                      },
                    ]}
                  >
                    <Input.Password
                      placeholder="Masukkan password"
                      size="large"
                    />
                  </Form.Item>
                )}

                {editingUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    💡 Password tidak ditampilkan. Hubungi admin untuk reset
                    password.
                  </div>
                )}

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <Button
                    size="large"
                    onClick={handleCloseModal}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={modalLoading}
                    className="flex-1"
                  >
                    {editingUser ? "Update User" : "Tambah User"}
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>

      {contextHolder}
    </div>
  );
}
