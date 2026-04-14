import React, { useState } from "react";
import { Drawer } from "antd";
import { Clock, X } from "lucide-react";
import SelfAbsence from "../pages/absensi/SelfAbsence";

const FloatingAbsenceButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
          title="Absensi Cepat"
        >
          <Clock size={24} className="group-hover:animate-pulse" />

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 bg-slate-900 text-white text-sm font-semibold px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Absensi
            <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>
          </div>
        </button>
      </div>

      {/* Drawer with Absence Component */}
      <Drawer
        title="Absensi Cepat"
        placement="right"
        onClose={() => setIsOpen(false)}
        open={isOpen}
        size="large"
        styles={{ body: { padding: 0 } }}
      >
        <div className="h-full overflow-y-auto">
          <SelfAbsence />
        </div>
      </Drawer>
    </>
  );
};

export default FloatingAbsenceButton;
