import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Spin } from "antd";
import api from "../../libs/api";
import DetailCallReport from "./DetailCallReport";

export default function DetailVisit() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("ID tidak ditemukan");
      setLoading(false);
      return;
    }

    api
      .request({
        method: "PATCH",
        url: "/visit",
        params: { id },
      })
      .then((res) => {
        if (res.status === 200 || res.status === 201) {
          setData(res.data.data);
          setError("");
        } else {
          setError("Data tidak ditemukan");
        }
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError(err.message || "Gagal mengambil data");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !id || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800 mb-2">Error</p>
          <p className="text-gray-600">{error || "Data tidak ditemukan"}</p>
        </div>
      </div>
    );
  }

  return <DetailCallReport data={data} />;
}
