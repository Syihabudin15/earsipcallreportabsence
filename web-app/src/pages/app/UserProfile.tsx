import {
  Button,
  Card,
  Descriptions,
  Avatar,
  Space,
  Typography,
  Upload,
  message,
  Form,
  Input,
  InputNumber,
  Modal,
  Divider,
} from "antd";
import { Upload as UploadIcon, Edit, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import useContext from "../../libs/context";
import api from "../../libs/api";
import type { IUser } from "../../libs/interface";

const { Title, Text } = Typography;

export default function UserProfile() {
  const { user, modal } = useContext((state: any) => state);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<IUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [formData, setFormData] = useState<Partial<IUser>>({});

  useEffect(() => {
    if (user) {
      setUserData(user);
      setFormData({
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        nik: user.nik,
        nip: user.nip,
      });
      editForm.setFieldsValue({
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        nik: user.nik,
        nip: user.nip,
      });
    }
  }, [user, editForm]);

  const handlePhotoUpload = async (file: File) => {
    setLoading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      // Upload file ke server
      const uploadResponse = await api.request({
        url: `${import.meta.env.VITE_API_URL}/file`,
        method: "POST",
        data: formDataUpload,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (uploadResponse.data.url) {
        // Update user photo
        await api.request({
          url: `${import.meta.env.VITE_API_URL}/user?id=${user.id}`,
          method: "PUT",
          data: { photo: uploadResponse.data.url },
        });

        message.success("Foto profil berhasil diupdate");
        // Refresh user data
        window.location.reload();
      }
    } catch (error) {
      message.error("Gagal upload foto");
    }
    setLoading(false);
    return false; // Prevent default upload behavior
  };

  const handleEditSubmit = async (values: any) => {
    setLoading(true);
    try {
      await api.request({
        url: `${import.meta.env.VITE_API_URL}/user?id=${user.id}`,
        method: "PUT",
        data: {
          fullname: values.fullname,
          email: values.email,
          phone: values.phone,
          nik: values.nik,
          nip: values.nip,
        },
      });
      message.success("Profil berhasil diperbarui");
      setIsEditing(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      message.error("Gagal memperbarui profil");
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    editForm.resetFields();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={2}>Profil Pengguna</Title>
          <p className="text-slate-500 text-sm">
            Kelola informasi profil Anda dengan lengkap dan aman.
          </p>
        </div>
        {!isEditing && (
          <Button
            type="primary"
            icon={<Edit size={16} />}
            onClick={() => setIsEditing(true)}
          >
            Edit Profil
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo Section */}
        <Card className="text-center shadow-sm">
          <Space direction="vertical" size="large" className="w-full">
            <Avatar
              size={120}
              src={userData?.photo}
              alt={userData?.fullname}
              style={{ fontSize: "48px", backgroundColor: "#F58220" }}
            >
              {userData?.fullname?.charAt(0).toUpperCase()}
            </Avatar>

            <div>
              <Title level={4}>{userData?.fullname}</Title>
              <Text type="secondary" className="text-xs">
                {userData?.email}
              </Text>
              <Divider style={{ margin: "12px 0" }} />
              <Text
                className="text-xs font-semibold"
                style={{ color: "#F58220" }}
              >
                {userData?.Position?.name}
              </Text>
            </div>

            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handlePhotoUpload}
              disabled={loading || isEditing}
            >
              <Button
                icon={<UploadIcon size={16} />}
                loading={loading}
                block
                disabled={isEditing}
              >
                {loading ? "Uploading..." : "Upload Foto"}
              </Button>
            </Upload>
          </Space>
        </Card>

        {/* Profile Information */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <Card title="Edit Informasi Pribadi">
              <Form
                form={editForm}
                layout="vertical"
                onFinish={handleEditSubmit}
              >
                <Form.Item
                  label="Nama Lengkap"
                  name="fullname"
                  rules={[
                    {
                      required: true,
                      message: "Nama lengkap wajib diisi",
                    },
                  ]}
                >
                  <Input placeholder="Masukkan nama lengkap" />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    {
                      required: true,
                      type: "email",
                      message: "Email tidak valid",
                    },
                  ]}
                >
                  <Input type="email" placeholder="Masukkan email" />
                </Form.Item>

                <Form.Item
                  label="No. Telepon"
                  name="phone"
                  rules={[
                    {
                      pattern: /^[0-9\-+()]*$/,
                      message: "No. telepon tidak valid",
                    },
                  ]}
                >
                  <Input placeholder="Masukkan no. telepon" />
                </Form.Item>

                <Form.Item label="NIK" name="nik">
                  <Input placeholder="Masukkan NIK" />
                </Form.Item>

                <Form.Item label="NIP" name="nip">
                  <Input placeholder="Masukkan NIP" />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<Save size={16} />}
                    >
                      Simpan Perubahan
                    </Button>
                    <Button icon={<X size={16} />} onClick={handleCancel}>
                      Batal
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          ) : (
            <>
              <Card title="Informasi Pribadi" className="shadow-sm">
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="Nama Lengkap">
                    {userData?.fullname}
                  </Descriptions.Item>
                  <Descriptions.Item label="Username">
                    {userData?.username}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {userData?.email || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="No. Telepon">
                    {userData?.phone || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="NIK">
                    {userData?.nik || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="NIP">
                    {userData?.nip || "-"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Informasi Pekerjaan" className="mt-4 shadow-sm">
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="Posisi">
                    {userData?.Position?.name || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Role">
                    {userData?.Role?.name || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Gaji">
                    {userData?.salary
                      ? `Rp ${userData.salary.toLocaleString()}`
                      : "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="PTKP">
                    {userData?.ptkp || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Metode Absensi">
                    {userData?.absence_method === "FACE"
                      ? "Face Recognition"
                      : "Button"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        userData?.status
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {userData?.status ? "Aktif" : "Non-Aktif"}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Informasi Sistem" className="mt-4 shadow-sm">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Dibuat">
                    {userData?.created_at
                      ? new Date(userData.created_at).toLocaleString("id-ID")
                      : "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Terakhir Update">
                    {userData?.updated_at
                      ? new Date(userData.updated_at).toLocaleString("id-ID")
                      : "-"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
