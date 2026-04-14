import { useParams } from "react-router-dom";
import { useEffect, useState } from "react"; // Tambahkan ini
import api from "../../libs/api";
import type { IVisit } from "../../libs/interface";
import UpsertVisit from "./UpsertVisit";

export default function UpdateVisit() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lakukan request di dalam useEffect
    api
      .request({
        method: "GET",
        url: "/visit",
        params: { id },
      })
      .then((res) => {
        if (res.status === 200 || res.status === 201) {
          setData(res.data.data[0] || res.data.data);
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

  return <UpsertVisit record={data as unknown as IVisit} />;
}
