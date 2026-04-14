import { Button, Typography } from "antd";
import { ArrowLeft, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SelfAbsence from "./SelfAbsence";

const { Title, Text } = Typography;

export default function AttendanceKiosk() {
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-orange-50 via-slate-50 to-blue-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-lg text-white shadow-lg">
            <Clock size={28} />
          </div>
          <div>
            <Title level={2} className="m-0">
              Kiosk Absensi
            </Title>
            <Text type="secondary" className="text-sm">
              Sistem Pencatatan Kehadiran Elektronik
            </Text>
          </div>
        </div>

        <Button
          type="default"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate("/absensi")}
          size="large"
        >
          Kembali
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 h-2"></div>

            <div className="p-8">
              <div className="text-center mb-8">
                <Title level={3} className="text-slate-700 mb-2">
                  Selamat Datang
                </Title>
                <Text type="secondary" className="text-base">
                  Silakan gunakan tombol di bawah untuk melakukan absensi
                </Text>
              </div>

              {/* Absence Component */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <SelfAbsence />
              </div>

              {/* Time Display */}
              <div className="mt-8 text-center p-6 bg-gradient-to-r from-orange-50 to-blue-50 rounded-2xl border border-slate-200">
                <Text className="block text-sm text-slate-600 mb-2">
                  Waktu Server
                </Text>
                <div className="text-3xl font-bold text-slate-900 font-mono">
                  {new Date().toLocaleTimeString("id-ID")}
                </div>
                <Text className="block text-xs text-slate-500 mt-2">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 px-6 py-3 text-center">
        <Text type="secondary" className="text-xs">
          © 2026 HASAMITRA - Sistem Absensi Elektronik | Hubungi Admin untuk
          bantuan
        </Text>
      </div>
    </div>
  );
}
