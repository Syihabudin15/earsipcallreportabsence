import {
  Users,
  TrendingUp,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Spin, message } from "antd";
import api from "../../libs/api";

interface IGuestBook {
  id: string;
  date: string;
  description?: string;
  created_at: string;
  Participant?: any[];
}

const DashboardGuestBook = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    average: 0,
  });
  const [activities, setActivities] = useState<IGuestBook[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: "/guestbook",
        method: "GET",
        params: { limit: 1000 },
      });
      if (res?.data) {
        const data = res.data.data || [];
        const total = res.data.total || 0;

        // Calculate today's guests
        const today = new Date().toISOString().split("T")[0];
        const todayGuests = data.filter(
          (g: IGuestBook) => g.date.split("T")[0] === today,
        ).length;

        // Calculate average
        const average = Math.ceil(total / 30) || 0;

        setStats({
          total: total,
          today: todayGuests,
          average: average,
        });

        // Set recent activities
        setActivities(data.slice(0, 4));
      }
    } catch (error) {
      message.error("Gagal mengambil data tamu");
    } finally {
      setLoading(false);
    }
  };

  const statsDisplay = [
    {
      label: "Total Tamu",
      value: stats.total.toString(),
      icon: <Users size={24} />,
      trend: "+18.2%",
      trendUp: true,
      color: "bg-blue-500",
    },
    {
      label: "Tamu Hari Ini",
      value: stats.today.toString(),
      icon: <BookOpen size={24} />,
      trend: "+12.5%",
      trendUp: true,
      color: "bg-purple-500",
    },
    {
      label: "Rata-rata Tamu/Hari",
      value: stats.average.toString(),
      icon: <TrendingUp size={24} />,
      trend: "+7.3%",
      trendUp: true,
      color: "bg-pink-500",
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="space-y-8">
        {/* --- WELCOME SECTION --- */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Selamat Pagi, Syihabudin! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Berikut adalah ringkasan data tamu yang berkunjung.
          </p>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsDisplay.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div
                  className={`${stat.color} p-3 rounded-xl text-white shadow-lg`}
                >
                  {stat.icon}
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-bold ${stat.trendUp ? "text-emerald-600" : "text-red-500"}`}
                >
                  {stat.trend}
                  {stat.trendUp ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-slate-500 text-sm font-medium">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {stat.value}
                </h3>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- CHART PLACEHOLDER (Large Area) --- */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">
                Grafik Kunjungan Tamu Mingguan
              </h3>
              <select className="text-xs border-slate-200 rounded-lg bg-slate-50 p-1 outline-none">
                <option>7 Hari Terakhir</option>
                <option>30 Hari Terakhir</option>
              </select>
            </div>
            {/* Box abu-abu sebagai placeholder Chart */}
            <div className="h-64 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
              <p className="text-slate-400 text-sm italic">
                Area Visualisasi Grafik Kunjungan Tamu
              </p>
            </div>
          </div>

          {/* --- RECENT ACTIVITIES --- */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">Tamu Terkini</h3>
              <button className="text-orange-500 text-xs font-bold hover:underline">
                Lihat Semua
              </button>
            </div>
            <div className="space-y-6">
              {activities.length > 0 ? (
                activities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <UserIcon size={18} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        Tamu Baru
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.description || "Kunjungan"}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium italic">
                      {new Date(item.created_at).toLocaleTimeString("id-ID")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">Tidak ada data tamu</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Spin>
  );
};

// Helper internal untuk icon di list
const UserIcon = ({ size, className }: { size: any; className: any }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default DashboardGuestBook;
