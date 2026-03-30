import { Input, Table, type TableProps } from "antd";
import { Plus, Filter, Download } from "lucide-react";
import { useState } from "react";

const DataDebitur = () => {
  const [loading, _setLoading] = useState(false);

  const columns: TableProps["columns"] = [
    {
      title: "ID",
      key: "id",
      dataIndex: "id",
      render(_value, _record, index) {
        return <>{index + 1}</>;
      },
    },
    {
      title: "Nama Lengkap",
      key: "fullname",
      dataIndex: "fullname",
    },
    {
      title: "Alamat",
      key: "address",
      dataIndex: "address",
    },
    {
      title: "Kontak",
      key: "contact",
      dataIndex: "contact",
    },
    {
      title: "Kredit",
      key: "credit",
      dataIndex: "credit",
    },
    {
      title: "Visit",
      key: "survey",
      dataIndex: "survey",
    },
    {
      title: "Aksi",
      key: "action",
      dataIndex: "action",
    },
  ];
  return (
    <div className="space-y-2">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Debitur
          </h1>
          <p className="text-slate-500 text-sm">Manajemen informasi nasabah.</p>
        </div>
        <div className="flex items-center gap-3">
          <a className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer">
            <Download size={18} /> Export
          </a>
          <a className="flex items-center gap-2 px-2 py-1 bg-orange-500 text-white rounded text-sm font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all cursor-pointer">
            <Plus size={18} /> New
          </a>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2 rounded border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-50">
          <Input.Search
            type="text"
            placeholder="Cari Nama, NIK, atau ID Debitur..."
            className="w-full transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
          <Filter size={14} /> Filter
        </button>
      </div>

      <div className="bg-white p-2">
        <Table
          size="small"
          loading={loading}
          rowKey={"id"}
          bordered
          scroll={{ x: "max-content", y: "60vh" }}
          columns={columns}
          // dataSource={pageProps.data}
          // pagination={{
          //   current: pageProps.page,
          //   pageSize: pageProps.limit,
          //   total: pageProps.total,
          //   onChange: (page, pageSize) => {
          //     setPageProps((prev) => ({
          //       ...prev,
          //       page,
          //       limit: pageSize,
          //     }));
          //   },
          //   pageSizeOptions: [50, 100, 500, 1000],
          // }}
          // expandable={{
          //   expandedRowRender: (record) => (
          //     <div style={{ marginLeft: 10 }}>
          //       <Table
          //         bordered
          //         pagination={false}
          //         rowKey={"id"}
          //         columns={columnDapem}
          //         dataSource={record.Dapem}
          //       />
          //     </div>
          //   ),
          //   rowExpandable: (record) => record.Dapem.length !== 0,
          // }}
        />
      </div>
    </div>
  );
};

export default DataDebitur;
