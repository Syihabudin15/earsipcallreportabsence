import {
  FileText,
  PhoneCall,
  UserCheck,
  Code,
  FolderArchive,
  FormInput,
  ClipboardPlus,
  Hash,
  Calendars,
  Key,
  SquareDashedKanbanIcon,
  Users,
  User,
  BriefcaseBusiness,
  ChartBarBig,
  SquareChartGantt,
} from "lucide-react";
import type { IMenu } from "./interface";

export type AppType = "earsip" | "callreport" | "absensi" | "all";

export interface AppConfig {
  id: AppType;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  redirect_url: string;
}

export const apps: AppConfig[] = [
  {
    id: "earsip",
    title: "E-Arsip",
    icon: FileText,
    description: "Manajemen dokumen elektronik",
    redirect_url: "/earsip",
  },
  {
    id: "callreport",
    title: "Call Report",
    icon: PhoneCall,
    description: "Laporan aktivitas harian & nasabah",
    redirect_url: "/creport",
  },
  {
    id: "absensi",
    title: "Absensi & Buku Tamu",
    icon: UserCheck,
    description: "Pencatatan kehadiran & tamu",
    redirect_url: "/absensi",
  },
  {
    id: "all",
    title: "All App",
    icon: Code,
    description: "All In One App",
    redirect_url: "/app",
  },
];

export const menus: IMenu[] = [
  {
    name: "Dashboard",
    path: "/app",
    icon: <SquareDashedKanbanIcon size={20} />,
    need_access: false,
  },

  {
    name: "E-Arsip",
    path: "/app/earsip",
    icon: <FolderArchive size={20} />,
    need_access: true,
    children: [
      {
        name: "Dashboard",
        path: "/app/earsip",
        icon: <FolderArchive size={15} />,
        need_access: false,
      },
      {
        name: "Tipe Permohonan",
        path: "/app/earsip/product_type",
        icon: <Hash size={15} />,
        need_access: true,
      },
      {
        name: "Produk",
        path: "/app/earsip/product",
        icon: <SquareChartGantt size={15} />,
        need_access: true,
      },
      {
        name: "Dokumen",
        path: "/app/earsip/document",
        icon: <FolderArchive size={15} />,
        need_access: true,
      },
      {
        name: "Permohonan",
        path: "/app/earsip/submission",
        icon: <FormInput size={15} />,
        need_access: true,
      },
      {
        name: "Permohonan Download",
        path: "/app/earsip/download",
        icon: <FormInput size={15} />,
        need_access: true,
      },
      {
        name: "Permohonan Hapus",
        path: "/app/earsip/delete",
        icon: <FormInput size={15} />,
        need_access: true,
      },
    ],
  },
  {
    name: "Call Report",
    path: "/app/creport",
    icon: <ClipboardPlus size={20} />,
    need_access: true,
    children: [
      {
        name: "Dashboard",
        path: "/app/creport",
        icon: <FolderArchive size={15} />,
        need_access: false,
      },
      {
        name: "Kategori Kunjungan",
        path: "/app/creport/category",
        icon: <Hash size={15} />,
        need_access: true,
      },
      {
        name: "Kunjungan",
        path: "/app/creport/visit",
        icon: <FormInput size={15} />,
        need_access: true,
      },
      {
        name: "Follow Up",
        path: "/app/creport/followup",
        icon: <Calendars size={15} />,
        need_access: true,
      },
    ],
  },
  {
    name: "Jenis Pemohon",
    path: "/app/sub_type",
    icon: <ChartBarBig size={20} />,
    need_access: true,
  },
  {
    name: "Debitur",
    path: "/app/debitur",
    icon: <Users size={20} />,
    need_access: true,
  },
  {
    name: "Role",
    path: "/app/role",
    icon: <Key size={20} />,
    need_access: true,
  },
  {
    name: "Posisi",
    path: "/app/position",
    icon: <BriefcaseBusiness size={20} />,
    need_access: true,
  },
  {
    name: "User",
    path: "/app/user",
    icon: <User size={20} />,
    need_access: true,
  },
];
