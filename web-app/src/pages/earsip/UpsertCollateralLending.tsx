import { useEffect, useState, useRef } from "react";
import { Form, Button, DatePicker, Input, Select, Spin, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../libs/api";
import dayjs from "dayjs";
import type { ISubmission } from "../../libs/interface";

const UpsertCollateralLending = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);
  const [fetchingSelect, setFetchingSelect] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSubmissions("");
    if (id) {
      fetchDetail();
    }
    // Cleanup debounce saat komponen unmount
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [id]);

  const fetchSubmissions = async (keyword: string = "") => {
    setFetchingSelect(true);
    try {
      const res = await api.request({
        url: "/submission",
        method: "GET",
        // Limit diperkecil. Gunakan parameter search untuk API backend Anda
        params: { limit: 20, search: keyword },
      });
      if (res?.data) {
        setSubmissions(res.data.data);
      }
    } catch (error) {
      message.error("Gagal mengambil data permohonan");
    } finally {
      setFetchingSelect(false);
    }
  };

  const handleSearch = (value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // Memberikan jeda 500ms agar API tidak di-spam setiap kali user mengetik
    debounceRef.current = setTimeout(() => {
      fetchSubmissions(value);
    }, 500);
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: "/collateral_lending",
        method: "PATCH",
        params: { id },
      });
      if (res?.data) {
        const data = res.data.data;

        // Memastikan data permohonan yang sudah tersimpan tetap muncul di dropdown
        if (
          data.Submission &&
          !submissions.find((s) => s.id === data.submissionId)
        ) {
          setSubmissions((prev) => [...prev, data.Submission]);
        }

        form.setFieldsValue({
          submissionId: data.submissionId,
          description: data.description,
          start_at: dayjs(data.start_at),
          return_at: data.return_at ? dayjs(data.return_at) : null,
          end_at: data.end_at ? dayjs(data.end_at) : null,
          file: data.file ? data.file : null,
          sub_status: data.sub_status,
        });
      }
    } catch (error) {
      message.error("Gagal mengambil detail");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        submissionId: values.submissionId,
        description: values.description,
        start_at: values.start_at.toISOString(),
        return_at: values.return_at ? values.return_at.toISOString() : null,
        end_at: values.end_at ? values.end_at.toISOString() : null,
      };

      if (id) {
        await api.request({
          url: "/collateral_lending",
          method: "PUT",
          params: { id },
          data: payload,
        });
        message.success("Data berhasil diperbarui");
      } else {
        await api.request({
          url: "/collateral_lending",
          method: "POST",
          data: payload,
        });
        message.success("Data berhasil dibuat");
      }
      navigate("/app/earsip/collateral_lending");
    } catch (error) {
      message.error("Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">
          {id ? "Edit" : "Tambah"} Peminjaman Jaminan
        </h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Permohonan"
              name="submissionId"
              rules={[{ required: true, message: "Permohonan wajib dipilih" }]}
            >
              <Select
                placeholder="Ketik untuk mencari permohonan..."
                options={submissions.map((sub) => ({
                  label: `${sub.id} - ${sub.Debitur?.fullname} (${sub.account_number})`,
                  value: sub.id,
                }))}
                showSearch
                filterOption={false}
                onSearch={handleSearch}
                loading={fetchingSelect}
              />
            </Form.Item>

            <Form.Item
              label="Deskripsi"
              name="description"
              rules={[{ required: false }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Deskripsi peminjaman jaminan"
              />
            </Form.Item>

            <Form.Item
              label="Tanggal Peminjaman"
              name="start_at"
              rules={[
                { required: true, message: "Tanggal peminjaman wajib diisi" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Tanggal Rencana Pengembalian"
              name="end_at"
              dependencies={["start_at"]}
              rules={[
                {
                  required: true,
                  message: "Tanggal rencana pengembalian wajib diisi",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    const startDate = getFieldValue("start_at");
                    if (!startDate) return Promise.resolve();

                    if (value.isBefore(startDate, "day")) {
                      return Promise.reject(
                        new Error(
                          "Tanggal rencana pengembalian tidak boleh kurang dari tanggal peminjaman",
                        ),
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Tanggal Pengembalian Aktual"
              name="return_at"
              dependencies={["start_at"]}
              hidden={!id || form.getFieldValue("sub_status") !== "DISETUJUI"}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    const startDate = getFieldValue("start_at");
                    if (!startDate) return Promise.resolve();

                    if (value.isBefore(startDate, "day")) {
                      return Promise.reject(
                        new Error(
                          "Tanggal pengembalian aktual tidak boleh kurang dari tanggal peminjaman",
                        ),
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Simpan
              </Button>
              <Button
                style={{ marginLeft: 8 }}
                onClick={() => navigate("/app/earsip/collateral_lending")}
              >
                Kembali
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Spin>
  );
};

export default UpsertCollateralLending;
