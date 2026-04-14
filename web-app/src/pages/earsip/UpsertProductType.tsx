import { App, Button, Card, Divider, Input, Select, Spin } from "antd";
import { useState } from "react";
import type {
  IProduct,
  IProductType,
  IProductTypeFile,
} from "../../libs/interface";
import { InputUtil } from "../utils/utilForm";
import {
  DeleteOutlined,
  PlusCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import api from "../../libs/api";

export default function UpsertProductType({
  record,
}: {
  record?: IProductType;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IProductType>(record || defaultData);
  const { modal } = App.useApp();

  const handleSubmit = async () => {
    if (!data.name) {
      modal.error({
        title: "ERROR",
        content: "Mohon lengkapi data terlebih dahulu!",
      });
      return;
    }
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/producttype?id=" + record?.id,
        method: record ? "PUT" : "POST",
        data: data,
        headers: { "Content-Type": "Application/json" },
      })
      .then(async (res) => {
        if (res.status === 201 || res.status === 200) {
          modal.success({
            title: "BERHASIL",
            content: res.data.msg,
          });
        } else {
          modal.error({
            title: "ERROR",
            content: res.data.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR",
          content: err.message || "Internal Server Error",
        });
      });
    setLoading(false);
  };

  const handleDeleteProduct = async (record: IProduct) => {
    setLoading(true);
    if (record.productTypeId === "") {
      setData({
        ...data,
        Product: data.Product.filter((f) => f.id !== record.id),
      });
    } else {
      setData({
        ...data,
        Product: data.Product.map((f) => ({
          ...f,
          status: f.id === record.id ? false : f.status,
        })),
      });
    }
    setLoading(false);
  };

  const handleDeleteFile = async (record: IProductTypeFile) => {
    setLoading(true);
    if (record.productTypeId === "") {
      setData({
        ...data,
        ProductTypeFile: data.ProductTypeFile.filter((f) => f.id !== record.id),
      });
    } else {
      setData({
        ...data,
        ProductTypeFile: data.ProductTypeFile.map((f) => ({
          ...f,
          status: f.id === record.id ? false : f.status,
        })),
      });
    }
    setLoading(false);
  };

  return (
    <Spin spinning={loading}>
      <p className="font-bold text-lg">
        {record ? "UPDATE" : "TAMBAH"} DATA KATEGORI BERKAS
      </p>
      <div className="ml-8 text-xs opacity-80 my-4">
        <ul className="list-disc">
          <li>Kosongkan ID untuk generate otomatis</li>
        </ul>
      </div>
      <Card>
        <div className="flex flex-col gap-2">
          <InputUtil
            label="ID"
            value={data.id}
            type="text"
            placeholder="Kosongkan untuk otomatis"
            onchage={(e: string) => setData({ ...data, id: e })}
          />
          <InputUtil
            label="Nama Kategori Berkas"
            value={data.name}
            type="text"
            required
            onchage={(e: string) => setData({ ...data, name: e })}
          />
          <InputUtil
            label="Keterangan"
            value={data.description}
            type="text"
            onchage={(e: string) => setData({ ...data, description: e })}
          />
        </div>
      </Card>
      <div className="my-4"></div>

      <Card title={<p>Berkas - Berkas</p>}>
        <div className="my-3 flex flex-col gap-2">
          {data.ProductTypeFile.filter((f) => f.status).map((d, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-25">
                <Input
                  size="small"
                  width={"100%"}
                  placeholder="ID"
                  value={d.id}
                  onChange={(e) =>
                    setData({
                      ...data,
                      ProductTypeFile: data.ProductTypeFile.map((pd, ind) =>
                        ind === i ? { ...d, id: e.target.value } : pd,
                      ),
                    })
                  }
                />
              </div>
              <div className="flex-1">
                <Input
                  size="small"
                  width={"100%"}
                  placeholder="Nama file"
                  value={d.name}
                  onChange={(e) =>
                    setData({
                      ...data,
                      ProductTypeFile: data.ProductTypeFile.map((pd, ind) =>
                        ind === i ? { ...d, name: e.target.value } : pd,
                      ),
                    })
                  }
                />
              </div>
              <div className="flex-1">
                <Select
                  size="small"
                  style={{ width: "100%" }}
                  placeholder="Tipe file"
                  options={[
                    { label: "PDF", value: "pdf" },
                    { label: "Image", value: "image" },
                    { label: "Video", value: "video" },
                  ]}
                  value={d.type}
                  onChange={(e) =>
                    setData({
                      ...data,
                      ProductTypeFile: data.ProductTypeFile.map((pd, ind) =>
                        ind === i ? { ...d, type: e } : pd,
                      ),
                    })
                  }
                />
              </div>
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
                onClick={() => handleDeleteFile(d)}
              ></Button>
            </div>
          ))}
        </div>
        <Button
          icon={<PlusCircleOutlined />}
          type="primary"
          size="small"
          block
          onClick={() =>
            setData({
              ...data,
              ProductTypeFile: [
                ...data.ProductTypeFile,
                {
                  ...defaultFileType,
                  id: `${data.id || "PFTYPE" + Date.now()}0${data.ProductTypeFile.length + 1}`,
                },
              ],
            })
          }
        >
          Tambah Daftar Berkas
        </Button>
      </Card>
      <div className="my-4"></div>
      <Card title={<p>Daftar Produk</p>}>
        <div className="my-3 flex flex-col gap-2">
          {data.Product.filter((f) => f.status).map((d, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-25">
                <Input
                  size="small"
                  width={"100%"}
                  placeholder="ID"
                  value={d.id}
                  onChange={(e) =>
                    setData({
                      ...data,
                      Product: data.Product.map((pd, ind) =>
                        ind === i ? { ...d, id: e.target.value } : pd,
                      ),
                    })
                  }
                />
              </div>
              <div className="flex-1">
                <Input
                  size="small"
                  width={"100%"}
                  placeholder="Nama Produk"
                  value={d.name}
                  onChange={(e) =>
                    setData({
                      ...data,
                      Product: data.Product.map((pd, ind) =>
                        ind === i ? { ...d, name: e.target.value } : pd,
                      ),
                    })
                  }
                />
              </div>
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
                onClick={() => handleDeleteProduct(d)}
              ></Button>
            </div>
          ))}
        </div>
        <Button
          icon={<PlusCircleOutlined />}
          type="primary"
          size="small"
          block
          onClick={() =>
            setData({
              ...data,
              Product: [
                ...data.Product,
                {
                  ...defaultProduct,
                  id: `${data.id || "PTYPE" + Date.now()}0${data.Product.length + 1}`,
                },
              ],
            })
          }
        >
          Tambah Daftar Produk
        </Button>
      </Card>
      <div className="my-8 flex justify-end">
        <Button
          icon={<SaveOutlined />}
          type="primary"
          onClick={() => handleSubmit()}
        >
          Submit
        </Button>
      </div>
    </Spin>
  );
}

const defaultData: IProductType = {
  id: "",
  name: "",
  description: "",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  ProductTypeFile: [],
  Product: [],
};

const defaultFileType: IProductTypeFile = {
  id: "",
  name: "",
  type: "pdf",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  Files: [],
  productTypeId: "",
};

const defaultProduct: IProduct = {
  id: "",
  name: "",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  productTypeId: "",
};
