import React, { useState } from "react";
import { Card, Button, Space, Tooltip, Drawer } from "antd";
import { Clock, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SelfAbsence from "../pages/absensi/SelfAbsence";

const DashboardAbsenceWidget: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Card
        className="shadow-md hover:shadow-lg transition-all duration-300"
        bodyStyle={{ padding: "24px" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-orange-500" />
              Absensi
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Lakukan absensi sekarang
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="primary"
            block
            size="large"
            onClick={() => setIsDrawerOpen(true)}
            icon={<Clock size={16} />}
            className="h-10 text-base font-semibold"
          >
            Absensi Sekarang
          </Button>

          <Tooltip title="Buka halaman absensi fullscreen mode">
            <Button
              block
              size="large"
              onClick={() => navigate("/absensi/kiosk")}
              icon={<QrCode size={16} />}
              className="h-10 text-base font-semibold"
            >
              Mode Kiosk
            </Button>
          </Tooltip>

          <Button
            type="dashed"
            block
            size="large"
            onClick={() => navigate("/absensi/report")}
            className="h-10 text-base font-semibold"
          >
            Lihat Laporan
          </Button>
        </div>

        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-700 text-center">
            💡 Tip: Gunakan floating button di bawah kanan untuk akses cepat
            absensi
          </p>
        </div>
      </Card>

      {/* Drawer */}
      <Drawer
        title="Absensi"
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        width={400}
        bodyStyle={{ padding: 0 }}
      >
        <div className="h-full overflow-y-auto">
          <SelfAbsence />
        </div>
      </Drawer>
    </>
  );
};

export default DashboardAbsenceWidget;
