import { useParams } from "react-router-dom";
import { useEffect, useState } from "react"; // Tambahkan ini
import UpsertSubmission from "./UpsertSubmission";
import api from "../../libs/api";
import type { ISubmission } from "../../libs/interface";

export default function UpdateSubmission() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lakukan request di dalam useEffect
    api
      .request({
        method: "PATCH", // Biasanya untuk ambil data awal pakai GET, bukan PATCH
        url: `${import.meta.env.VITE_API_URL}/submission?id=${id}`,
      })
      .then((res) => {
        if (res.status === 200 || res.status === 201) {
          setData(res.data.data);
        } else {
          setError("Not Found ID");
        }
      })
      .catch((err) => {
        console.log(err);
        setError("Internal Server Error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]); // Effect berjalan saat ID berubah

  // Logika Render
  if (loading) return <p>Loading...</p>;
  if (error || !id || !data)
    return (
      <div>
        <p>{error || "ID Not Found"}</p>
      </div>
    );

  return <UpsertSubmission record={data as unknown as ISubmission} />;
}
