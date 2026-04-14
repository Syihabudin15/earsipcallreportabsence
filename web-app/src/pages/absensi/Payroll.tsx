import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  message,
  Space,
  Popconfirm,
  Tag,
  Drawer,
  Card,
  Row,
  Col,
  Divider,
  Statistic,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined,
  EyeOutlined,
  BgColorsOutlined,
} from "@ant-design/icons";
import api from "../../libs/api";
import dayjs from "dayjs";

const { Option } = Select;

interface PayrollData {
  id: string;
  userId: string;
  month: number;
  year: number;
  base_salary: number;
  bonus_incentive: number;
  total_deduction: number;
  net_salary: number;
  status: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  User: {
    id: string;
    fullname: string;
    nik: string;
    nip: string;
    email: string;
    Position: { name: string };
  };
  PayrollDetail: Array<{
    id: string;
    description: string;
    type: string;
    amount: number;
  }>;
}

const Payroll: React.FC = () => {
  const [data, setData] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculateModalVisible, setCalculateModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollData | null>(null);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [users, setUsers] = useState<{ id: string; fullname: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number>(dayjs().month() + 1);
  const [filterYear, setFilterYear] = useState<number>(dayjs().year());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/payroll?month=${filterMonth}&year=${filterYear}&limit=1000`,
      );
      setData(response.data.data || []);
    } catch (error) {
      message.error("Gagal mengambil data payroll");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get("/user?limit=1000");
      setUsers(response.data.data || []);
    } catch (error) {
      message.error("Gagal mengambil data user");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
    fetchUsers();
  }, [filterMonth, filterYear]);

  const handleCalculate = async (values: any) => {
    try {
      await api.post("/payroll/calculate", {
        userId: values.userId,
        month: values.month,
        year: values.year,
      });

      message.success("Payroll berhasil dihitung");
      setCalculateModalVisible(false);
      form.resetFields();
      fetchPayroll();
    } catch (error: any) {
      message.error(
        error.response?.data?.msg ||
          "Gagal menghitung payroll",
      );
    }
  };

  const handleBulkGenerate = async (values: any) => {
    setBulkLoading(true);
    try {
      const response = await api.post("/payroll/bulk-generate", {
        month: values.month,
        year: values.year,
      });

      message.success(
        `Payroll berhasil generate: ${response.data.success} user, skip: ${response.data.skipped}`,
      );
      setBulkModalVisible(false);
      bulkForm.resetFields();
      fetchPayroll();
    } catch (error: any) {
      message.error(
        error.response?.data?.msg ||
          "Gagal generate payroll",
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/payroll/${id}/approve`);
      message.success("Payroll berhasil disetujui");
      fetchPayroll();
    } catch (error: any) {
      message.error(error.response?.data?.msg || "Gagal approve payroll");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.delete(`/payroll/${id}/reject`);
      message.success("Payroll berhasil dihapus");
      fetchPayroll();
    } catch (error: any) {
      message.error(error.response?.data?.msg || "Gagal reject payroll");
    }
  };

  const handleViewDetail = (record: PayrollData) => {
    setSelectedPayroll(record);
    setDetailDrawerVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "default";
      case "CALCULATED":
        return "warning";
      case "APPROVED":
        return "green";
      case "PAYROLL_GENERATED":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "CALCULATED":
        return "Sudah Dihitung";
      case "APPROVED":
        return "Disetujui";
      case "PAYROLL_GENERATED":
        return "Sudah di-Payroll";
      default:
        return status;
    }
  };

  const columns = [
    {
      title: "Nama Karyawan",
      dataIndex: ["User", "fullname"],
      key: "fullname",
      render: (text: string, record: PayrollData) => (
        <div>
          <div>{text}</div>
          <small>{record.User.nik}</small>
        </div>
      ),
    },
    {
      title: "Jabatan",
      dataIndex: ["User", "Position", "name"],
      key: "position",
    },
    {
      title: "Bulan/Tahun",
      dataIndex: "month",
      key: "month",
      render: (month: number, record: PayrollData) =>
        `${String(month).padStart(2, "0")}/${record.year}`,
    },
    {
      title: "Gaji Pokok",
      dataIndex: "base_salary",
      key: "base_salary",
      render: (value: number) =>
        `Rp ${new Intl.NumberFormat("id-ID").format(value)}`,
    },
    {
      title: "Tunjangan",
      dataIndex: "bonus_incentive",
      key: "bonus_incentive",
      render: (value: number) =>
        `Rp ${new Intl.NumberFormat("id-ID").format(value)}`,
    },
    {
      title: "Potongan",
      dataIndex: "total_deduction",
      key: "total_deduction",
      render: (value: number) =>
        `Rp ${new Intl.NumberFormat("id-ID").format(value)}`,
    },
    {
      title: "Gaji Bersih",
      dataIndex: "net_salary",
      key: "net_salary",
      render: (value: number) => (
        <strong>Rp {new Intl.NumberFormat("id-ID").format(value)}</strong>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_: any, record: PayrollData) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Detail
          </Button>
          {record.status === "CALCULATED" && (
            <Popconfirm
              title="Setujui Payroll?"
              onConfirm={() => handleApprove(record.id)}
              okText="Ya"
              cancelText="Tidak"
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                style={{ backgroundColor: "#52c41a" }}
              >
                Setuju
              </Button>
            </Popconfirm>
          )}
          {record.status !== "PAYROLL_GENERATED" && (
            <Popconfirm
              title="Hapus Payroll?"
              onConfirm={() => handleReject(record.id)}
              okText="Ya"
              cancelText="Tidak"
            >
              <Button
                type="primary"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                Hapus
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          gap: 16,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <label>
            Bulan:
            <Select
              value={filterMonth}
              onChange={setFilterMonth}
              style={{ width: 100, marginLeft: 8 }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <Option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </Option>
              ))}
            </Select>
          </label>
          <label>
            Tahun:
            <Select
              value={filterYear}
              onChange={setFilterYear}
              style={{ width: 100, marginLeft: 8 }}
            >
              {Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i).map(
                (y) => (
                  <Option key={y} value={y}>
                    {y}
                  </Option>
                ),
              )}
            </Select>
          </label>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCalculateModalVisible(true)}
          >
            Hitung Payroll
          </Button>
          <Button
            type="default"
            icon={<BgColorsOutlined />}
            onClick={() => setBulkModalVisible(true)}
          >
            Bulk Generate
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1400 }}
        pagination={false}
      />

      {/* Calculate Modal */}
      <Modal
        title="Hitung Payroll"
        open={calculateModalVisible}
        onCancel={() => setCalculateModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCalculate}>
          <Form.Item
            name="userId"
            label="Karyawan"
            rules={[{ required: true, message: "Karyawan wajib dipilih" }]}
          >
            <Select
              placeholder="Pilih karyawan"
              loading={loadingUsers}
              optionLabelProp="label"
            >
              {users.map((user) => (
                <Option key={user.id} value={user.id} label={user.fullname}>
                  {user.fullname}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="month"
            label="Bulan"
            rules={[{ required: true, message: "Bulan wajib dipilih" }]}
            initialValue={filterMonth}
          >
            <Select placeholder="Pilih bulan">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <Option key={m} value={m}>
                  {String(m).padStart(2, "0")} - {dayjs()
                    .month(m - 1)
                    .format("MMMM")}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="year"
            label="Tahun"
            rules={[{ required: true, message: "Tahun wajib dipilih" }]}
            initialValue={filterYear}
          >
            <Select placeholder="Pilih tahun">
              {Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i).map(
                (y) => (
                  <Option key={y} value={y}>
                    {y}
                  </Option>
                ),
              )}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Hitung
              </Button>
              <Button onClick={() => setCalculateModalVisible(false)}>
                Batal
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Generate Modal */}
      <Modal
        title="Bulk Generate Payroll"
        open={bulkModalVisible}
        onCancel={() => setBulkModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={bulkForm} layout="vertical" onFinish={handleBulkGenerate}>
          <Form.Item
            name="month"
            label="Bulan"
            rules={[{ required: true, message: "Bulan wajib dipilih" }]}
            initialValue={filterMonth}
          >
            <Select placeholder="Pilih bulan">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <Option key={m} value={m}>
                  {String(m).padStart(2, "0")} - {dayjs()
                    .month(m - 1)
                    .format("MMMM")}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="year"
            label="Tahun"
            rules={[{ required: true, message: "Tahun wajib dipilih" }]}
            initialValue={filterYear}
          >
            <Select placeholder="Pilih tahun">
              {Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i).map(
                (y) => (
                  <Option key={y} value={y}>
                    {y}
                  </Option>
                ),
              )}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={bulkLoading}
              >
                Generate
              </Button>
              <Button onClick={() => setBulkModalVisible(false)}>
                Batal
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="Detail Payroll"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={800}
      >
        {selectedPayroll && (
          <div>
            {/* Header Info */}
            <Card
              title="Informasi Karyawan"
              style={{ marginBottom: 24 }}
              size="small"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <strong>Nama:</strong> {selectedPayroll.User.fullname}
                  </div>
                  <div>
                    <strong>NIK:</strong> {selectedPayroll.User.nik}
                  </div>
                  <div>
                    <strong>NIP:</strong> {selectedPayroll.User.nip}
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <strong>Email:</strong> {selectedPayroll.User.email}
                  </div>
                  <div>
                    <strong>Jabatan:</strong> {selectedPayroll.User.Position.name}
                  </div>
                  <div>
                    <strong>Periode:</strong> {String(selectedPayroll.month).padStart(2, "0")}/{selectedPayroll.year}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Summary */}
            <Card
              title="Ringkasan Gaji"
              style={{ marginBottom: 24 }}
              size="small"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Gaji Pokok"
                    value={selectedPayroll.base_salary}
                    precision={0}
                    prefix="Rp "
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Tunjangan & Insentif"
                    value={selectedPayroll.bonus_incentive}
                    precision={0}
                    prefix="Rp "
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Total Potongan"
                    value={selectedPayroll.total_deduction}
                    precision={0}
                    prefix="Rp "
                    valueStyle={{ color: "#ff4d4f" }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Gaji Bersih"
                    value={selectedPayroll.net_salary}
                    precision={0}
                    prefix="Rp "
                    valueStyle={{
                      color: "#722ed1",
                      fontSize: "24px",
                      fontWeight: "bold",
                    }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Deductions */}
            <Card
              title="Potongan (Deduction)"
              style={{ marginBottom: 24 }}
              size="small"
            >
              <div>
                {selectedPayroll.PayrollDetail.filter(
                  (d) => d.type === "DEDUCTION",
                ).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <span>{item.description}</span>
                    <span style={{ color: "#ff4d4f" }}>
                      -Rp {new Intl.NumberFormat("id-ID").format(item.amount)}
                    </span>
                  </div>
                ))}
                <Divider style={{ margin: "12px 0" }} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                  }}
                >
                  <span>Total Potongan</span>
                  <span style={{ color: "#ff4d4f" }}>
                    -Rp {new Intl.NumberFormat("id-ID").format(selectedPayroll.total_deduction)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Allowances */}
            <Card
              title="Tunjangan & Insentif (Allowance)"
              style={{ marginBottom: 24 }}
              size="small"
            >
              <div>
                {selectedPayroll.PayrollDetail.filter(
                  (d) => d.type === "ALLOWANCE",
                ).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <span>{item.description}</span>
                    <span style={{ color: "#52c41a" }}>
                      +Rp {new Intl.NumberFormat("id-ID").format(item.amount)}
                    </span>
                  </div>
                ))}
                <Divider style={{ margin: "12px 0" }} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                  }}
                >
                  <span>Total Tunjangan & Insentif</span>
                  <span style={{ color: "#52c41a" }}>
                    +Rp {new Intl.NumberFormat("id-ID").format(selectedPayroll.bonus_incentive)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Status */}
            <Card title="Status & Approval" size="small">
              <div style={{ marginBottom: 16 }}>
                <Tag color={getStatusColor(selectedPayroll.status)}>
                  {getStatusLabel(selectedPayroll.status)}
                </Tag>
              </div>
              {selectedPayroll.approved_at && (
                <div>
                  <div>
                    <strong>Disetujui Oleh:</strong> {selectedPayroll.approved_by}
                  </div>
                  <div>
                    <strong>Tanggal Approval:</strong>{" "}
                    {dayjs(selectedPayroll.approved_at).format(
                      "DD/MM/YYYY HH:mm:ss",
                    )}
                  </div>
                </div>
              )}
              {selectedPayroll.status === "CALCULATED" && (
                <div style={{ marginTop: 16 }}>
                  <Space>
                    <Popconfirm
                      title="Setujui payroll ini?"
                      onConfirm={() => {
                        handleApprove(selectedPayroll.id);
                        setDetailDrawerVisible(false);
                      }}
                      okText="Ya"
                      cancelText="Tidak"
                    >
                      <Button type="primary" icon={<CheckOutlined />} style={{ backgroundColor: "#52c41a" }}>
                        Setujui
                      </Button>
                    </Popconfirm>
                    <Popconfirm
                      title="Hapus payroll ini?"
                      onConfirm={() => {
                        handleReject(selectedPayroll.id);
                        setDetailDrawerVisible(false);
                      }}
                      okText="Ya"
                      cancelText="Tidak"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Hapus
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Payroll;
