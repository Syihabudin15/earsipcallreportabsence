import { useState } from "react";
import {
  LogOut,
  Bell,
  User,
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AppRouter from "./AppRouter";
import { menus } from "../libs/list_app";
import useContext from "../libs/context";
import { Modal } from "antd";

const APP_COLOR = import.meta.env.VITE_APP_COLOR || "#F58220";

export default function MainLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false); // State untuk collapse di desktop
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [openLogout, setOpenLogout] = useState(false);
  const { user, getMenu, logout } = useContext((state: any) => state);

  const toggleSubMenu = (name: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [name]: !prev[name], // Sekarang TypeScript tahu ini boolean
    }));
  };

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
            <div
              style={{ backgroundColor: APP_COLOR }}
              className="p-2 rounded-lg text-white shadow-lg shadow-orange-200 shrink-0"
            >
              <ShieldCheck size={20} />
            </div>
            {!isCollapsed && (
              <span className="font-black text-lg tracking-tighter whitespace-nowrap">
                <span className="text-orange-500">HASA</span>
                <span className="text-green-600">MITRA</span>
              </span>
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
          {menus &&
            getMenu().map((m: any, i: any) => {
              const hasChildren = m.children && m.children.length > 0;
              const isOpen = openMenus[m.name];

              return (
                <div key={i} className="w-full">
                  {/* Menu Utama atau Toggle Parent */}
                  <a
                    href={hasChildren ? "#" : m.path}
                    onClick={(e) => {
                      if (hasChildren) {
                        e.preventDefault();
                        toggleSubMenu(m.name);
                      }
                    }}
                    className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all 
              text-slate-500! hover:bg-slate-50 hover:text-slate-800!
              ${isCollapsed ? "justify-center" : "justify-between"}
              ${!hasChildren && !isCollapsed ? "" : ""}
            `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0">{m.icon}</span>
                      {!isCollapsed && <span>{m.name}</span>}
                    </div>

                    {/* Icon Panah untuk Children */}
                    {hasChildren && !isCollapsed && (
                      <ChevronRight
                        size={14}
                        className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                      />
                    )}
                  </a>

                  {/* Rendering Sub-Menu (Children) */}
                  {hasChildren && isOpen && !isCollapsed && (
                    <div className="mt-1 ml-9 flex flex-col gap-1 border-l border-slate-100 pl-2">
                      {m.children &&
                        m.children.map((child: any, idx: number) => (
                          <a
                            key={idx}
                            href={child.path}
                            className="px-3 py-2 text-xs font-semibold text-slate-400! hover:text-orange-500! transition-colors rounded-lg hover:bg-orange-50 flex gap-2 items-center"
                          >
                            {child.icon} <span>{child.name}</span>
                          </a>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-white">
          <button
            className={`flex items-center gap-3 px-4 py-3 w-full text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl cursor-pointer transition-colors ${isCollapsed ? "justify-center" : ""}`}
            onClick={() => setOpenLogout(true)}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
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

          <div className="flex items-center gap-3 lg:gap-6">
            <button className="relative p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 lg:pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none">
                  {user && user.fullname}
                </p>
                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">
                  {user && user.Position.name}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <User size={20} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT SCROLLABLE AREA */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-slate-50 p-3 lg:p-4">
          <div className="max-w-7xl mx-auto">
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
    </div>
  );
}
