import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import DashboardApp from "./app/Dashboard";
import DataDebitur from "./app/Debitur";
import DataRole from "./app/Role";
import useContext from "../libs/context";
import { Button } from "antd";
import DataPosition from "./app/Position";
import DataSubmissionType from "./earsip/SubmissionType";
import DataProductType from "./earsip/ProductType";
import DataProduct from "./earsip/Product";

function AppRouter() {
  const path = window.location.pathname;
  const navigate = useNavigate();

  return (
    <main className="bg-slate-50">
      <Routes>
        <Route path="/" element={<DashboardApp />} />
        <Route element={<ProtectedRoute path={path} />}>
          <Route path="/sub_type" element={<DataSubmissionType />} />
          <Route path="/debitur" element={<DataDebitur />} />
          <Route path="/role" element={<DataRole />} />
          <Route path="/position" element={<DataPosition />} />
          <Route path="/earsip/product_type" element={<DataProductType />} />
          <Route path="/earsip/product" element={<DataProduct />} />
        </Route>

        {/* 404 Page (Opsional) */}
        <Route
          path="/unauthorized"
          element={
            <div className="py-20 flex flex-col gap-4 items-center justify-center">
              <div className="text-center text-2xl font-bold">
                404 - Akses tidak diizinkan
              </div>
              <div>
                <Button onClick={() => navigate(-1)} block type="primary">
                  Back
                </Button>
              </div>
            </div>
          }
        />
        <Route
          path="*"
          element={
            <div className="py-20 flex flex-col gap-4 items-center justify-center">
              <div className="text-center text-2xl font-bold">
                404 - Halaman Tidak Ditemukan
              </div>
              <div>
                <Button onClick={() => navigate(-1)} block type="primary">
                  Back
                </Button>
              </div>
            </div>
          }
        />
      </Routes>
    </main>
  );
}

const ProtectedRoute = ({ path }: { path: string }) => {
  const { user, hasAccess } = useContext((state: any) => state);
  if (!user) return <Navigate to="/" replace />;
  if (!hasAccess(path, "read")) {
    return <Navigate to="/app/unauthorized" replace />;
  }

  return <Outlet />;
};

export default AppRouter;
