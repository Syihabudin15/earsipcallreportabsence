import {
  Calendar,
  User,
  MapPin,
  FileText,
  Clock,
  FileIcon,
  ExternalLink,
} from "lucide-react";
import type { IVisit } from "../../libs/interface";
import { useState } from "react";
import { App, Button, Modal } from "antd";
import { ArrowLeftOutlined, AuditOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../../libs/api";

// Props menggunakan interface IVisit yang Anda berikan

export default function DetailCallReport({ data }: { data: IVisit }) {
  const [open, setOpen] = useState(false);

  // Helper untuk format Geo (lat, lng) ke Google Maps Embed
  const getMapUrl = (geoString?: string) => {
    if (!geoString) return null;
    return `https://maps.google.com/maps?q=${geoString}&z=15&output=embed`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visit Detail</h1>
          <p className="text-sm text-gray-500">Nomor Referensi: {data.id}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Badge Status Dinamis */}
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
              data.approve_status === "APPROVED"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }`}
          >
            {data.approve_status}
          </span>

          {/* Tombol Setuju - Hanya muncul jika status belum APPROVED */}
          {data.approve_status !== "APPROVED" && (
            <button
              disabled={data.approve_status !== "PENDING"}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer"
              onClick={() => setOpen(true)}
            >
              <AuditOutlined /> Proses Laporan
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Debitur
                </label>
                <div className="flex items-center gap-2 text-gray-700">
                  <User size={18} className="text-blue-500" />
                  <span className="text-lg font-bold">
                    {data.Debitur?.fullname.toUpperCase() || "N/A"}
                  </span>
                </div>
                <div className="text-gray-700 text-xs">
                  <div className="font-medium">
                    NIK : {data.Debitur?.nik || "N/A"}
                  </div>
                  <div className="font-medium">
                    CIF : {data.Debitur?.cif || "N/A"}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Rencana Kunjungan
                </label>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar size={18} className="text-blue-500" />
                  <span>
                    {new Date(data.date).toLocaleDateString("id-ID", {
                      dateStyle: "full",
                    })}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Metode/Kategori Kunjungan
                </label>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-sm font-medium border border-blue-100">
                    {data.VisitCategory?.name}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Tujuan Kunjungan
                </label>
                <p className="text-gray-700 font-medium">
                  {data.VisitPurpose?.name}
                </p>
              </div>
            </div>

            <hr className="my-6 border-gray-100" />

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <FileText size={14} /> Ringkasan Percakapan
                </label>
                <div className="bg-gray-50 p-4 rounded-xl text-gray-600 leading-relaxed border border-gray-100">
                  {data.summary || "No summary provided."}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                  <label className="text-xs font-bold text-orange-400 uppercase mb-1 block">
                    Rencana Tindak Lanjut
                  </label>
                  <p className="text-orange-700 font-medium">
                    {data.next_action || "-"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                  <label className="text-xs font-bold text-green-400 uppercase mb-1 block">
                    Hasil Kunjungan
                  </label>
                  <p className="text-green-700 font-medium">
                    {data.VisitStatus?.name}
                  </p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Clock size={12} />{" "}
                    {data.date_action
                      ? new Date(data.date_action).toLocaleDateString()
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Files / Attachments */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileIcon size={20} className="text-blue-500" />
              Attachments ({data.files?.length || 0})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.files?.map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square rounded-xl bg-gray-100 overflow-hidden border border-gray-200 hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ExternalLink className="text-white" size={20} />
                  </div>
                </a>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Link to={"/app/callreport/visit"}>
              <Button
                type="primary"
                icon={<ArrowLeftOutlined />}
                onClick={() => window.history.back()}
              >
                Kembali
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Geo & User */}
        <div className="space-y-6">
          {/* Map Card */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold">
              <MapPin size={18} className="text-red-500" /> Location Tag
            </div>
            {data.geo ? (
              <div className="rounded-xl overflow-hidden h-64 border border-gray-100">
                <iframe
                  title="visit-location"
                  width="100%"
                  height="100%"
                  src={getMapUrl(data.geo)!}
                  className="border-0"
                  loading="lazy"
                ></iframe>
              </div>
            ) : (
              <div className="h-64 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200">
                <MapPin size={40} className="mb-2 opacity-20" />
                <p className="text-sm">No location data tagged</p>
              </div>
            )}
            <p className="mt-3 text-xs text-center text-gray-400 break-all">
              {data.geo}
            </p>
          </div>

          {/* User / Officer Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
              Reporting Officer
            </label>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                {data.User?.fullname?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-800">{data.User?.fullname}</p>
                <p className="text-xs text-gray-500">ID: {data.userId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ModalProccess
        record={data}
        open={open}
        setOpen={(open) => setOpen(open)}
      />
    </div>
  );
}

const ModalProccess = ({
  record,
  open,
  setOpen,
}: {
  record: IVisit;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const { modal } = App.useApp();

  const handleSubmit = async (status: string) => {
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/visit?id=" + record?.id,
        method: "PUT",
        headers: { "Content-Type": "Application/json" },
        data: { ...record, status },
      })
      .then(async (res) => {
        if (res.status === 201 || res.status === 200) {
          modal.success({
            title: "BERHASIL",
            content: res.data.msg,
          });
        } else {
          modal.error({
            title: "ERROR",
            content: res.data.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR",
          content: err.message || "Internal Server Error",
        });
      });
    setLoading(false);
  };

  return (
    <Modal
      title="Konfirmasi Proses"
      open={open}
      loading={loading}
      onCancel={() => setOpen(false)}
      footer={[
        <Button
          key={"tolak"}
          type="primary"
          danger
          loading={loading}
          onClick={() => handleSubmit("REJECTED")}
        >
          Tolak
        </Button>,
        <Button
          key={"setujui"}
          type="primary"
          loading={loading}
          onClick={() => handleSubmit("APPROVED")}
        >
          Setujui
        </Button>,
      ]}
    >
      <div className="p-4">
        Konfirmasi Proses Persetujuan/Penolakan pada data kunjungan ini *
        {record.id}*?
      </div>
    </Modal>
  );
};
