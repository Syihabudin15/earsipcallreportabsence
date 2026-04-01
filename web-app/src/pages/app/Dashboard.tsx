import { Users, TrendingUp, File } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IProductType,
  ISubType,
  IVisitCategory,
  IVisitStatus,
} from "../../libs/interface";
import api from "../../libs/api";
import { IDRFormat } from "../utils/utilForm";
import useContext from "../../libs/context";

const Dashboard = () => {
  // Data dummy untuk statistik
  const [data, setData] = useState<{
    submissionType: ISubType[];
    productType: IProductType[];
    visitCategory: IVisitCategory[];
    visitStatus: IVisitStatus[];
  }>({
    submissionType: [],
    productType: [],
    visitCategory: [],
    visitStatus: [],
  });
  const { user } = useContext((state: any) => state);

  useEffect(() => {
    (async () => {
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/maindashboard`,
        })
        .then((res) => setData(res.data));
    })();
  }, []);

  return (
    <div className="space-y-8">
      {/* --- WELCOME SECTION --- */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Selamat Pagi, {user?.fullname || "No Name"}! 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Berikut adalah ringkasan performa Hasamitra wilayah Jawa Barat hari
          ini.
        </p>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex  items-center gap-4">
            <div className={`bg-blue-500 p-3 rounded-xl text-white shadow-lg`}>
              <Users size={24} />
            </div>
            <div className={`text-xs font-bold text-emerald-600`}>
              <div>
                <p className="font-bold text-slate-500 text-sm">
                  Total Debitur:{" "}
                  {data.submissionType.flatMap((d) => d.Debitur).length}
                </p>
                <div className="ms-4">
                  {data.submissionType.map((item) => (
                    <p
                      key={item.id}
                      className="text-slate-500 text-sm font-medium"
                    >
                      {item.name} : {item.Debitur.length}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {data.productType.map((item) => (
          <div
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            key={item.id}
          >
            <div className="flex  items-center gap-4">
              <div
                className={`bg-orange-500 p-3 rounded-xl text-white shadow-lg`}
              >
                <TrendingUp size={24} />
              </div>
              <div className={`text-xs  text-emerald-600`}>
                <div>
                  <p className="font-bold text-slate-500 text-sm ">
                    {item.name}
                  </p>
                  <p className=" text-slate-500 text-sm">
                    Total Permohonan:{" "}
                    {item.Product.flatMap((pd) => pd.Submission).length}
                  </p>
                  <p className=" text-slate-500 text-sm ">
                    Total Nilai : Rp.{" "}
                    {IDRFormat(
                      item.Product.flatMap((pd) => pd.Submission).reduce(
                        (acc, submission) => {
                          const nominal = submission.value || 0;
                          return acc + nominal;
                        },
                        0,
                      ),
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex  items-center gap-4">
            <div className={`bg-blue-500 p-3 rounded-xl text-white shadow-lg`}>
              <File size={24} />
            </div>
            <div className={`text-xs font-bold text-emerald-600`}>
              <div>
                <p className="font-bold text-slate-500 text-sm">
                  Total Kunjungan:{" "}
                  {data.visitCategory.flatMap((d) => d.Visit).length}
                </p>
                <div className="ms-4">
                  {data.visitCategory.map((item) => (
                    <p
                      key={item.id}
                      className="text-slate-500 text-sm font-medium"
                    >
                      {item.name} : {item.Visit.length}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- CHART PLACEHOLDER (Large Area) --- */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Grafik Pertumbuhan</h3>
            <select className="text-xs border-slate-200 rounded-lg bg-slate-50 p-1 outline-none">
              <option>7 Hari Terakhir</option>
              <option>30 Hari Terakhir</option>
            </select>
          </div>
          {/* Box abu-abu sebagai placeholder Chart */}
          <div className="h-64 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
            <p className="text-slate-400 text-sm italic">
              Area Visualisasi Grafik (Chart.js / Recharts)
            </p>
          </div>
        </div>

        {/* --- RECENT ACTIVITIES --- */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Aktivitas Terkini</h3>
            <button className="text-orange-500 text-xs font-bold hover:underline">
              Lihat Semua
            </button>
          </div>
          <div className="space-y-6">
            {/* {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <UserIcon size={18} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    Pencairan Dana Baru
                  </p>
                  <p className="text-xs text-slate-500">
                    Nasabah: Bambang Pamungkas
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">
                  2m ago
                </p>
              </div>
            ))} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
