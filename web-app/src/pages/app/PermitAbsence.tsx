import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Space,
  Popconfirm,
  Tag,
  Upload,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import api from "../../libs/api";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

interface PermitAbsence {
  id: string;
  type: string;
  description: string;
  file: string;
  absence_date: string;
  end_date: string;
  deduction: number;
  allowance: number;
  permis_status: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

const PermitAbsence: React.FC = () => {
  const [data, setData] = useState<PermitAbsence[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PermitAbsence | null>(
    null,
  );
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/permit_absence");
      setData(response.data.data || []);
    } catch (error) {
      message.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: PermitAbsence) => {
    setEditingRecord(record);
    form.setFieldsValue({
      type: record.type,
      description: record.description,
      absence_date: dayjs(record.absence_date),
      end_date: record.end_date ? dayjs(record.end_date) : null,
      deduction: record.deduction,
      allowance: record.allowance,
      permis_status: record.permis_status,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/permit_absence?id=${id}`);
      message.success("Data berhasil dihapus");
      fetchData();
    } catch (error) {
      message.error("Gagal menghapus data");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();

      // Handle file upload
      if (values.file && values.file[0]) {
        formData.append("file", values.file[0].originFileObj);
      }

      // Add other fields
      Object.keys(values).forEach((key) => {
        if (key !== "file") {
          if (values[key] instanceof dayjs) {
            formData.append(key, values[key].format("YYYY-MM-DD HH:mm:ss"));
          } else {
            formData.append(key, values[key]);
          }
        }
      });

      if (editingRecord) {
        await api.put(`/permit_absence?id=${editingRecord.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.success("Data berhasil diupdate");
      } else {
        await api.post("/permit_absence", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.success("Data berhasil dibuat");
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error("Gagal menyimpan data");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "orange";
      case "APPROVED":
        return "green";
      case "REJECTED":
        return "red";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Absence Date",
      dataIndex: "absence_date",
      key: "absence_date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      key: "end_date",
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Deduction",
      dataIndex: "deduction",
      key: "deduction",
      render: (value: number) => `Rp ${value.toLocaleString()}`,
    },
    {
      title: "Allowance",
      dataIndex: "allowance",
      key: "allowance",
      render: (value: number) => `Rp ${value.toLocaleString()}`,
    },
    {
      title: "Status",
      dataIndex: "permis_status",
      key: "permis_status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Active",
      dataIndex: "status",
      key: "status",
      render: (status: boolean) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: PermitAbsence) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Apakah Anda yakin ingin menghapus?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Tambah Permit Absence
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingRecord ? "Edit Permit Absence" : "Tambah Permit Absence"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: "Type wajib dipilih" }]}
          >
            <Select placeholder="Pilih type">
              <Option value="CUTI">CUTI</Option>
              <Option value="SAKIT">SAKIT</Option>
              <Option value="PERDIN">PERDIN</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description wajib diisi" }]}
          >
            <TextArea rows={3} placeholder="Masukkan description" />
          </Form.Item>

          <Form.Item
            name="absence_date"
            label="Absence Date"
            rules={[{ required: true, message: "Absence Date wajib diisi" }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="Pilih tanggal absence"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item name="end_date" label="End Date">
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="Pilih tanggal akhir (opsional)"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="deduction"
            label="Deduction"
            rules={[{ required: true, message: "Deduction wajib diisi" }]}
          >
            <InputNumber
              min={0}
              placeholder="Masukkan deduction"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="allowance"
            label="Allowance"
            rules={[{ required: true, message: "Allowance wajib diisi" }]}
          >
            <InputNumber
              min={0}
              placeholder="Masukkan allowance"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="permis_status"
            label="Permission Status"
            rules={[{ required: true, message: "Status wajib dipilih" }]}
          >
            <Select placeholder="Pilih status">
              <Option value="PENDING">PENDING</Option>
              <Option value="APPROVED">APPROVED</Option>
              <Option value="REJECTED">REJECTED</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Active Status"
            rules={[{ required: true, message: "Active status wajib dipilih" }]}
          >
            <Select placeholder="Pilih status">
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item name="file" label="File">
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>Upload File</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? "Update" : "Simpan"}
              </Button>
              <Button onClick={() => setModalVisible(false)}>Batal</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PermitAbsence;
