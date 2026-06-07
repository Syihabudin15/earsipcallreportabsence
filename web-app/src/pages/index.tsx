import { useEffect, useState } from "react";
import {
  LogOut,
  Bell,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import AppRouter from "./AppRouter";
import useContext from "../libs/context";
import { Modal, Dropdown } from "antd";
import { Link, useNavigate } from "react-router-dom";
import AbsenceWidget from "./absensi/AbsenceWidget";
import api from "../libs/api";
// import HeaderAbsenceButton from "../components/HeaderAbsenceButton";

export default function MainLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false); // State untuk collapse di desktop
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [openLogout, setOpenLogout] = useState(false);
  const navigate = useNavigate();
  const { user, getMenu, logout, absence_config } = useContext(
    (state: any) => state,
  );
  const [openAbsen, setOpenAbse] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState({
    downloads: 0,
    deletes: 0,
    absences: 0,
  });
  const notifications = [
    {
      id: 1,
      text: "Permohonan Download",
      href: "/app/earsip/permit_download",
      value: notifs.downloads,
    },
    {
      id: 2,
      text: "Permohonan Hapus",
      href: "/app/earsip/permit_delete",
      value: notifs.deletes,
    },
    {
      id: 3,
      text: "Permohonan izin",
      href: "/app/absensi/permit",
      value: notifs.absences,
    },
  ];

  const toggleSubMenu = (key: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getNotif = async () => {
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/notif",
        method: "GET",
      })
      .then((res) =>
        setNotifs({
          downloads: res.data.downloads || 0,
          deletes: res.data.deletes || 0,
          absences: res.data.absences | 0,
        }),
      );
  };

  useEffect(() => {
    (async () => {
      await getNotif();
    })();
    setTimeout(async () => {
      await getNotif();
    }, 2000);
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      {/* --- MOBILE SIDEBAR OVERLAY --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside
        className={`
    fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out
    lg:relative lg:translate-x-0 flex flex-col h-full shrink-0
    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
    ${isCollapsed ? "lg:w-20" : "lg:w-60"}
    h-full
  `}
      >
        {/* LOGO SECTION */}
        <div
          className={`p-6 flex items-center shrink-0 ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div className="flex items-center gap-3">
            {/* <div> */}
            {/* <ShieldCheck size={20} /> */}
            {/* </div> */}
            {!isCollapsed ? (
              // <span className="font-black text-lg tracking-tighter whitespace-nowrap">
              //   <span className="text-orange-500">HASA</span>
              //   <span className="text-green-600">MITRA</span>
              // </span>
              <img src="/assets/logo.png" width={150} />
            ) : (
              <img src="/assets/android-chrome-512x512.png" width={30} />
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            className="lg:hidden text-slate-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* DESKTOP COLLAPSE TOGGLE */}
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-15 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-orange-500 shadow-sm z-50"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 mt-4 space-y-2 overflow-y-auto custom-scrollbar">
          {getMenu().map((m: any, i: number) => (
            <SidebarMenuItem
              key={`${m.path}-${m.name}-${i}`}
              item={m}
              isCollapsed={isCollapsed}
              openMenus={openMenus}
              toggleSubMenu={toggleSubMenu}
            />
          ))}
        </nav>

        {/* LOGOUT BUTTON REMOVED - MOVED TO HEADER */}
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 h overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-white border-b  border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            {/* SEARCH DIHAPUS - Area ini sekarang kosong atau bisa untuk Breadcrumbs */}
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button
              className="relative p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl cursor-pointer"
              onClick={() => setOpenAbse(!openAbsen)}
            >
              <Calendar size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button
              className="relative p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl cursor-pointer"
              // onMouseEnter={() => setIsOpen(true)}
              // onMouseLeave={() => setIsOpen(false)}
              onClick={() => setIsOpen(true)}
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            {isOpen && (
              <div
                className="absolute top-12 right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
                onMouseLeave={() => setIsOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-sm font-semibold text-slate-700">
                    Notifikasi
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <span className="truncate">{item.text}</span>
                      <span className="truncate">{item.value}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {/* <HeaderAbsenceButton /> */}
            <Dropdown
              menu={{
                items: [
                  {
                    label: (
                      <div>
                        <p className="font-bold text-slate-800">
                          {user && user.fullname}
                        </p>
                        <p className="text-xs text-slate-500">
                          {user && user.Position.name}
                        </p>
                      </div>
                    ),
                    disabled: true,
                    key: "profile-header",
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "edit-profile",
                    label: (
                      <span className="flex items-center gap-2">
                        <User size={16} /> Profil
                      </span>
                    ),
                    onClick: () => navigate("/app/profile"),
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "logout",
                    label: (
                      <span className="text-red-600 font-semibold flex items-center gap-2">
                        <LogOut size={16} /> Keluar
                      </span>
                    ),
                    onClick: () => setOpenLogout(true),
                  },
                ],
              }}
              placement="bottomRight"
            >
              <button className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-colors border-l border-slate-200 pl-4 lg:pl-6 cursor-pointer">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800 leading-none">
                    {user && user.fullname}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">
                    {user && user.Position.name}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <User size={20} className="text-slate-400" />
                </div>
              </button>
            </Dropdown>
          </div>
        </header>

        {/* PAGE CONTENT SCROLLABLE AREA */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-slate-50 p-3 lg:p-4">
          <div className="max-w-7xl mx-auto">
            {children}
            <AppRouter />
          </div>
        </main>
      </div>

      <Modal
        title="Konfirmasi Logout"
        open={openLogout}
        onCancel={() => setOpenLogout(false)}
        onOk={() => logout()}
      >
        <p>Apakah anda yakin untuk keluar?</p>
      </Modal>
      {user && (
        <AbsenceWidget
          open={openAbsen}
          setOpen={(v: boolean) => setOpenAbse(v)}
          user={user}
          config={absence_config}
        />
      )}
    </div>
  );
}

function SidebarMenuItem({
  item,
  level = 0,
  isCollapsed,
  openMenus,
  toggleSubMenu,
}: {
  item: any;
  level?: number;
  isCollapsed: boolean;
  openMenus: Record<string, boolean>;
  toggleSubMenu: (key: string) => void;
}) {
  const hasChildren = item.children && item.children.length > 0;

  // Pakai path + name supaya key tidak bentrok kalau ada nama menu yang sama
  const menuKey = `${item.path}-${item.name}`;
  const isOpen = openMenus[menuKey];

  return (
    <div className="w-full">
      <Link
        to={hasChildren ? "#" : item.path}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault();
            toggleSubMenu(menuKey);
          }
        }}
        className={`
          w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all
          text-slate-500! hover:bg-slate-50 hover:text-slate-800!
          ${isCollapsed ? "justify-center" : "justify-between"}
        `}
        style={{
          paddingLeft: !isCollapsed ? `${12 + level * 14}px` : undefined,
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0">{item.icon}</span>
          {!isCollapsed && <span className="truncate">{item.name}</span>}
        </div>

        {hasChildren && !isCollapsed && (
          <ChevronRight
            size={14}
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        )}
      </Link>

      {hasChildren && isOpen && !isCollapsed && (
        <div className="mt-1 flex flex-col gap-1 border-l border-slate-100">
          {item.children.map((child: any, idx: number) => (
            <SidebarMenuItem
              key={`${child.path}-${child.name}-${idx}`}
              item={child}
              level={level + 1}
              isCollapsed={isCollapsed}
              openMenus={openMenus}
              toggleSubMenu={toggleSubMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}
