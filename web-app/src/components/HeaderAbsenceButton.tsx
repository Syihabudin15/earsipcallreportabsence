import React, { useState } from "react";
import { Drawer, Tooltip } from "antd";
import { UserCheck } from "lucide-react";
import SelfAbsence from "../pages/absensi/SelfAbsence";

const HeaderAbsenceButton: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <Tooltip title="Absensi">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="relative p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl hover:text-orange-500"
        >
          <UserCheck size={20} />
        </button>
      </Tooltip>

      {/* Drawer */}
      <Drawer
        title="Absensi"
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
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

export default HeaderAbsenceButton;
