import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  InputNumber,
  message,
  Space,
  Input,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Spin,
} from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "../../libs/api";

const { Title, Text } = Typography;

interface AbsenceConfig {
  id: string;
  late_eduction: number;
  fast_leave_deduction: number;
  alpha_deduction: number;
  shift_start: number;
  shift_end: number;
  shift_tolerance: number;
  last_shift: number;
  geo_location: string;
  meter_tolerance: number;
  updated_at: string;
}

const AbsenceConfigAbsensi: React.FC = () => {
  const [config, setConfig] = useState<AbsenceConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/absence_config");
      if (response.data.data) {
        setConfig(response.data.data);
        form.setFieldsValue(response.data.data);
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

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (config) {
        await api.put(`/absence_config?id=${config.id}`, values);
        message.success("Data berhasil diupdate");
      } else {
        await api.post("/absence_config", values);
        message.success("Data berhasil dibuat");
        message.info("Refresh halaman untuk melihat data terbaru");
      }
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.msg || "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Title level={2}>Konfigurasi Absence</Title>
        <Text type="secondary">
          Pengaturan global untuk sistem absence seluruh organisasi
        </Text>
      </div>

      <Spin spinning={loading}>
        <Card>
          {config ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <Text strong>Status: </Text>
                  <Text type="success">✓ Konfigurasi Aktif</Text>
                </div>
                <Text type="secondary" className="text-sm">
                  Terakhir diperbarui:{" "}
                  {new Date(config.updated_at).toLocaleString()}
                </Text>
              </div>
              <Divider />
            </div>
          ) : null}

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Title level={4}>💰 Pengaturan Potongan Gaji</Title>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="late_eduction"
                  label="Late Deduction (Rp)"
                  rules={[
                    { required: true, message: "Late deduction wajib diisi" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    placeholder="Masukkan late deduction"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="fast_leave_deduction"
                  label="Fast Leave Deduction (Rp)"
                  rules={[
                    {
                      required: true,
                      message: "Fast leave deduction wajib diisi",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    placeholder="Masukkan fast leave deduction"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="alpha_deduction"
                  label="Alpha Deduction (Rp)"
                  rules={[
                    { required: true, message: "Alpha deduction wajib diisi" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    placeholder="Masukkan alpha deduction"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />
            <Title level={4}>⏰ Pengaturan Shift</Title>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="shift_start"
                  label="Shift Start (Hour)"
                  rules={[
                    { required: true, message: "Shift start wajib diisi" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={23}
                    placeholder="Contoh: 8"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="shift_end"
                  label="Shift End (Hour)"
                  rules={[{ required: true, message: "Shift end wajib diisi" }]}
                >
                  <InputNumber
                    min={0}
                    max={23}
                    placeholder="Contoh: 17"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="shift_tolerance"
                  label="Shift Tolerance (Minutes)"
                  rules={[
                    {
                      required: true,
                      message: "Shift tolerance wajib diisi",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    placeholder="Contoh: 15"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="last_shift"
                  label="Last Shift (Hour)"
                  rules={[
                    { required: true, message: "Last shift wajib diisi" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={23}
                    placeholder="Contoh: 18"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />
            <Title level={4}>📍 Pengaturan Lokasi</Title>
            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="geo_location"
                  label="Geo Location (Latitude, Longitude)"
                  rules={[
                    { required: true, message: "Geo location wajib diisi" },
                  ]}
                >
                  <Input placeholder="Contoh: -6.200000,106.816666" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="meter_tolerance"
                  label="Meter Tolerance (Meter)"
                  rules={[
                    { required: true, message: "Meter tolerance wajib diisi" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    placeholder="Contoh: 100"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Simpan Konfigurasi
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchData()}
                  size="large"
                >
                  Muat Ulang
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  );
};

export default AbsenceConfigAbsensi;
