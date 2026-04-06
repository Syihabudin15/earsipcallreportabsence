import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Popconfirm,
  Tag,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import api from "../../libs/api";

const { Option } = Select;

interface AbsenceConfig {
  id: string;
  drawer_code: string;
  status_submission_active: boolean;
  created_at: string;
  updated_at: string;
}

const AbsenceConfig: React.FC = () => {
  const [data, setData] = useState<AbsenceConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AbsenceConfig | null>(
    null,
  );
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/absence_config");
      if (response.data.data) {
        setData([response.data.data]);
      } else {
        setData([]);
      }
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

  const handleEdit = (record: AbsenceConfig) => {
    setEditingRecord(record);
    form.setFieldsValue({
      drawer_code: record.drawer_code,
      status_submission_active: record.status_submission_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/absence_config?id=${id}`);
      message.success("Data berhasil dihapus");
      fetchData();
    } catch (error) {
      message.error("Gagal menghapus data");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRecord) {
        await api.put(`/absence_config?id=${editingRecord.id}`, values);
        message.success("Data berhasil diupdate");
      } else {
        await api.post("/absence_config", values);
        message.success("Data berhasil dibuat");
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error("Gagal menyimpan data");
    }
  };

  const columns = [
    {
      title: "Drawer Code",
      dataIndex: "drawer_code",
      key: "drawer_code",
    },
    {
      title: "Status Submission Active",
      dataIndex: "status_submission_active",
      key: "status_submission_active",
      render: (status: boolean) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Updated At",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: AbsenceConfig) => (
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
          Tambah Absence Config
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title={editingRecord ? "Edit Absence Config" : "Tambah Absence Config"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="drawer_code"
            label="Drawer Code"
            rules={[{ required: true, message: "Drawer Code wajib diisi" }]}
          >
            <Input placeholder="Masukkan drawer code" />
          </Form.Item>

          <Form.Item
            name="status_submission_active"
            label="Status Submission Active"
            rules={[{ required: true, message: "Status wajib dipilih" }]}
          >
            <Select placeholder="Pilih status">
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
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

export default AbsenceConfig;
