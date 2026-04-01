import { App, Button, Card, Col, Divider, Row, Spin, Tooltip } from "antd";
import type {
  IActivities,
  IComments,
  IDebitur,
  IFile,
  IProduct,
  ISubmission,
  ISubType,
  IUser,
} from "../../libs/interface";
import {
  IDRFormat,
  IDRToNumber,
  InputFileUpload,
  InputUtil,
} from "../utils/utilForm";
import { PlusCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { BookPlus, FolderOpen, MessageCircle, User } from "lucide-react";
import { useEffect, useState } from "react";
import moment from "moment";
import api from "../../libs/api";
import useContext from "../../libs/context";
import { Link } from "react-router-dom";

export default function UpsertSubmission({ record }: { record?: ISubmission }) {
  const [loading, setLoading] = useState(false);
  const [subType, setSubType] = useState<ISubType[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [search, setSearch] = useState("");
  const [activities, setActivities] = useState<IActivities[]>([]);
  const { user, hasAccess } = useContext((state: any) => state);
  const [data, setData] = useState(
    record || {
      ...defaultData,
      ...(!hasAccess("/app/earsip/submission", "proses") && {
        userId: user.id,
        User: user,
      }),
    },
  );
  const { modal } = App.useApp();

  useEffect(() => {
    (async () => {
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/sub_type`,
        })
        .then((res) => setSubType(res.data.data));
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/product`,
        })
        .then((res) => setProducts(res.data.data));
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/user`,
        })
        .then((res) => setUsers(res.data.data));
    })();
  }, []);

  const handleSubmit = async () => {
    if (activities)
      data.activities.push({
        name: user.fullname || "",
        date: new Date(),
        activities: activities.map((a) => a.name).join(", "),
      });
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/submission?id=" + record?.id,
        method: record ? "PUT" : "POST",
        headers: { "Content-Type": "Application/json" },
        data: { ...data, ...(record && { updated_at: new Date() }) },
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
    setActivities([]);
    setLoading(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/debitur?id=" + search,
        method: "PATCH",
      })
      .then((res) => {
        if (res.status === 200) {
          setData((prev) => ({
            ...prev,
            Debitur: res.data.data,
            debiturId: res.data.data.id,
          }));
        } else {
          alert(res.data.msg || "Data tidak ditemukan");
        }
      })
      .catch((err) => {
        console.log(err);
        alert(err.message || "Internal Server Error");
      });
    setLoading(false);
  };

  return (
    <Spin spinning={loading}>
      <div className="bg-white p-4 rounded">
        <p className="font-bold text-lg">
          {record ? "UPDATE" : "TAMBAH"} DATA PERMOHONAN
        </p>
        <div className="ml-8 text-xs opacity-80 my-4">
          <ul className="list-disc">
            <li>Kosongkan ID Permohonan untuk generate otomatis</li>
            <li>Kosongkan Komentar untuk menghapus</li>
          </ul>
        </div>
        <Divider />
        <Row gutter={[16, 16]}>
          <Col xs={12} md={8}>
            <InputUtil
              label="CIF atau NIK"
              type="text"
              value={search}
              onchage={(e: string) => setSearch(e)}
              suffix={
                <Button
                  icon={<SearchOutlined />}
                  size="small"
                  type="primary"
                  onClick={() => handleSearch()}
                  loading={loading}
                ></Button>
              }
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="CIF"
              value={data.Debitur?.cif}
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, cif: e } });
                record &&
                  handleChangeRecord("edit CIF", activities, setActivities);
              }}
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="NIK"
              value={data.Debitur?.nik}
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, nik: e } });
                record &&
                  handleChangeRecord("edit NIK", activities, setActivities);
              }}
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Nama Lengkap"
              value={data.Debitur?.fullname}
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, fullname: e } });
                record &&
                  handleChangeRecord(
                    "edit Nama Debitur",
                    activities,
                    setActivities,
                  );
              }}
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Tempat Lahir"
              value={data.Debitur?.birthplace}
              onchage={(e: string) => {
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, birthplace: e },
                });
                record &&
                  handleChangeRecord(
                    "edit Tempat Lahir",
                    activities,
                    setActivities,
                  );
              }}
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Tanggal Lahir"
              value={moment(data.Debitur?.birthdate).format("YYYY-MM-DD")}
              onchage={(e: string) => {
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, birthdate: new Date(e) },
                });
                record &&
                  handleChangeRecord(
                    "edit Tgl Lahir",
                    activities,
                    setActivities,
                  );
              }}
              type="date"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Alamat"
              value={data.Debitur?.address}
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, address: e } });
                record &&
                  handleChangeRecord("edit Alamat", activities, setActivities);
              }}
              type="area"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="No Telepon"
              value={data.Debitur?.phone}
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, phone: e } });
                record &&
                  handleChangeRecord("edit No Telp", activities, setActivities);
              }}
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Email"
              value={data.Debitur?.email}
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, email: e } });
                record &&
                  handleChangeRecord("edit Email", activities, setActivities);
              }}
              type="text"
            />
          </Col>

          <Col xs={12} md={8}>
            <InputUtil
              label="Jenis Pemohon"
              value={data.Debitur?.submissionTypeId}
              onchage={(e: string) => {
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, submissionTypeId: e },
                });
                record &&
                  handleChangeRecord(
                    "edit Jenis Pemohon",
                    activities,
                    setActivities,
                  );
              }}
              type="option"
              options={subType.map((s) => ({ label: s.name, value: s.id }))}
            />
          </Col>
        </Row>
        <Card
          title={
            <div className="flex gap-2 items-center">
              <BookPlus size={18} /> Data Permohonan
            </div>
          }
          style={{ marginTop: 15, marginBottom: 15 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8}>
              <InputUtil
                label="ID Permohonan"
                value={data.id}
                onchage={(e: string) => {
                  setData({ ...data, id: e });
                  record &&
                    handleChangeRecord(
                      "edit ID Permohnonan",
                      activities,
                      setActivities,
                    );
                }}
                type="text"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Tanggal Permohonan"
                value={moment(data.created_at).format("YYYY-MM-DD")}
                onchage={(e: string) => {
                  setData({
                    ...data,
                    created_at: new Date(e),
                  });
                  record &&
                    handleChangeRecord(
                      "edit Tgl Permohonan",
                      activities,
                      setActivities,
                    );
                }}
                type="date"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Produk"
                value={data.productId}
                onchage={(e: string) => {
                  const find = products.find((u) => u.id === e);
                  setData({
                    ...data,
                    productId: e,
                    Product: find as IProduct,
                  });
                  record &&
                    handleChangeRecord(
                      "edit Produk",
                      activities,
                      setActivities,
                    );
                }}
                options={products.map((s) => ({
                  label: `(${s.ProductType.name}) ${s.name}`,
                  value: s.id,
                }))}
                type="option"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Plafond/Nilai"
                value={IDRFormat(data.value)}
                onchage={(e: string) => {
                  setData({ ...data, value: IDRToNumber(e) });
                  record &&
                    handleChangeRecord(
                      "edit Plafond/Nilai",
                      activities,
                      setActivities,
                    );
                }}
                type="text"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="No Rekening"
                value={data.account_number}
                onchage={(e: string) => {
                  setData({ ...data, account_number: e });
                  record &&
                    handleChangeRecord(
                      "edit No Rek",
                      activities,
                      setActivities,
                    );
                }}
                type="text"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Tujuan Penggunaan"
                value={data.purpose}
                onchage={(e: string) => {
                  setData({ ...data, purpose: e });
                  record &&
                    handleChangeRecord(
                      "edit Tujuan Penggunaan",
                      activities,
                      setActivities,
                    );
                }}
                type="text"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Status Permohonan"
                value={data.is_active}
                onchage={(e: boolean) => {
                  setData({
                    ...data,
                    is_active: e,
                  });
                  record &&
                    handleChangeRecord(
                      "edit Status Permohonan",
                      activities,
                      setActivities,
                    );
                }}
                options={[
                  { label: "AKTIF", value: true },
                  { label: "NONAKTIF", value: false },
                ]}
                type="option"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Status Jaminan"
                value={data.guarantee_status}
                onchage={(e: boolean) => {
                  setData({
                    ...data,
                    guarantee_status: e,
                  });
                  record &&
                    handleChangeRecord(
                      "edit Status Jaminan",
                      activities,
                      setActivities,
                    );
                }}
                options={[
                  { label: "SELESAI", value: true },
                  { label: "PENDING", value: false },
                ]}
                type="option"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="No Lemari"
                value={data.drawer_code}
                onchage={(e: string) => {
                  setData({ ...data, drawer_code: e });
                  record &&
                    handleChangeRecord(
                      "edit No Lemari",
                      activities,
                      setActivities,
                    );
                }}
                type="text"
              />
            </Col>
          </Row>
        </Card>
        <Card
          title={
            <div className="flex gap-2 items-center">
              <User size={18} /> Data Petugas
            </div>
          }
          style={{ marginTop: 15, marginBottom: 15 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8}>
              <InputUtil
                label="Petugas"
                value={data.userId}
                disabled={!hasAccess("/app/earsip/submission", "proses")}
                onchage={(e: string) => {
                  const find = users.find((u) => u.id === e);
                  setData({
                    ...data,
                    userId: e,
                    User: find as IUser,
                  });
                  record &&
                    handleChangeRecord(
                      "edit Petugas",
                      activities,
                      setActivities,
                    );
                }}
                options={users.map((s) => ({
                  label: `${s.fullname} (${s.nik})`,
                  value: s.id,
                }))}
                type="option"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="NIP"
                value={data.User?.nip}
                type="text"
                disabled
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Posisi"
                value={data.User?.Position?.name}
                type="text"
                disabled
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="No Telepon"
                value={data.User?.phone}
                type="text"
                disabled
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Email"
                value={data.User?.email}
                type="text"
                disabled
              />
            </Col>
          </Row>
        </Card>
        <Card
          title={
            <div className="flex gap-2 items-center">
              <MessageCircle size={18} /> Komentar
            </div>
          }
          style={{ marginTop: 15, marginBottom: 15 }}
        >
          <Row gutter={[16, 16]}>
            {data.coments.map((c, i) => (
              <Col xs={12} md={8} key={i}>
                <InputUtil
                  type="area"
                  value={c.comment}
                  label={`${c.name} (${moment(c.date).format("DD/MM/YY HH:mm")})`}
                  onchage={(e: string) => {
                    setData({
                      ...data,
                      coments: data.coments.map((dc, idc) => ({
                        ...dc,
                        ...(idc === i && { comment: e, name: user.fullname }),
                      })),
                    });
                    record &&
                      handleChangeRecord(
                        "edit Komentar " + i,
                        activities,
                        setActivities,
                      );
                  }}
                  disabled={user.fullname !== c.name}
                />
              </Col>
            ))}
          </Row>
          <div className="flex justify-center my-4">
            <Button
              icon={<PlusCircleOutlined />}
              type="primary"
              onClick={() =>
                setData({
                  ...data,
                  coments: [
                    ...data.coments,
                    {
                      ...defaultComment,
                      name: user.fullname,
                      date: new Date(),
                    },
                  ],
                })
              }
            >
              Tambahkan Komentar
            </Button>
          </div>
        </Card>
        <Card
          title={
            <div className="flex gap-2 items-center">
              <FolderOpen size={18} /> Berkas Pemohonan
            </div>
          }
          style={{ marginTop: 15, marginBottom: 15 }}
        >
          <div className="flex flex-col gap-4">
            {data.Product &&
              data.Product?.ProductType?.ProductTypeFile?.map((p, i) => (
                <div key={i}>
                  <p className="font-bold">
                    {p.name} ({p.type.toUpperCase()})
                    <Tooltip
                      title={p.Files && p.Files.map((f) => f.name).join(", ")}
                    >
                      [{p.Files && p.Files.length} Files]
                    </Tooltip>
                  </p>
                  <div className="flex flex-col gap-2 my-2 ml-4">
                    {p.Files &&
                      p.Files.filter((pf) => pf.submissionId !== null).map(
                        (file, ind) => (
                          <InputFileUpload
                            filetype={p.type}
                            ondelete={(val: IFile) => {
                              setData({
                                ...data,
                                Product: {
                                  ...data.Product,
                                  ProductType: {
                                    ...data.Product.ProductType,
                                    ProductTypeFile:
                                      data.Product.ProductType.ProductTypeFile.map(
                                        (pdffile, pdfi) => ({
                                          ...pdffile,
                                          ...(pdfi === i && {
                                            // Files: [...pdffile.Files, val],
                                            Files: pdffile.Files.map(
                                              (pfile, pfilei) => ({
                                                ...pfile,
                                                ...(pfilei === ind && val),
                                              }),
                                            ),
                                          }),
                                        }),
                                      ),
                                  },
                                },
                              });
                              record &&
                                handleChangeRecord(
                                  "hapus file " + p.name,
                                  activities,
                                  setActivities,
                                );
                            }}
                            record={file}
                            onchange={(val: IFile) => {
                              setData({
                                ...data,
                                Product: {
                                  ...data.Product,
                                  ProductType: {
                                    ...data.Product.ProductType,
                                    ProductTypeFile:
                                      data.Product.ProductType.ProductTypeFile.map(
                                        (pdffile, pdfi) => ({
                                          ...pdffile,
                                          ...(pdfi === i && {
                                            // Files: [...pdffile.Files, val],
                                            Files: pdffile.Files.map(
                                              (pfile, pfilei) => ({
                                                ...pfile,
                                                ...(pfilei === ind && val),
                                              }),
                                            ),
                                          }),
                                        }),
                                      ),
                                  },
                                },
                              });
                              record &&
                                handleChangeRecord(
                                  "upload/edit file " + p.name,
                                  activities,
                                  setActivities,
                                );
                            }}
                            key={ind}
                          />
                        ),
                      )}
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusCircleOutlined />}
                    onClick={() =>
                      setData({
                        ...data,
                        Product: {
                          ...data.Product,
                          ProductType: {
                            ...data.Product?.ProductType,
                            ProductTypeFile:
                              data.Product?.ProductType?.ProductTypeFile?.map(
                                (prev, previ) => ({
                                  ...prev,
                                  ...(previ === i && {
                                    Files: [
                                      ...(prev.Files || []),
                                      {
                                        ...defaultFile,
                                        id: data.id + prev.id + previ,
                                        submissionId:
                                          data.id || Date.now().toString(),
                                        productTypeFileId: prev.id,
                                      },
                                    ],
                                  }),
                                }),
                              ),
                          },
                        },
                      })
                    }
                  >
                    Tambahkan File
                  </Button>
                </div>
              ))}
          </div>
        </Card>
        <div className="flex gap-4 justify-end">
          <Link to={"/app/earsip/submission"}>
            <Button danger>Cancel</Button>
          </Link>
          <Button
            type="primary"
            onClick={() => handleSubmit()}
            loading={loading}
          >
            Submit
          </Button>
        </div>
      </div>
    </Spin>
  );
}

const defaultData: ISubmission = {
  id: "",
  value: 0,
  drawer_code: "",
  purpose: "",
  account_number: null,
  coments: [],
  activities: [],
  guarantee_status: false,
  is_active: true,
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  debiturId: "",
  productId: "",
  userId: "",
  Debitur: {} as IDebitur,
  User: {} as IUser,
  Product: {} as IProduct,
  Files: [],
};

const defaultComment: IComments = {
  date: new Date(),
  name: "",
  comment: "",
};
const defaultFile: IFile = {
  id: "",
  name: "",
  url: "",
  allow_download: "",
  created_at: new Date(),
  submissionId: null,
  productTypeFileId: null,
};

const handleChangeRecord = (
  name: string,
  activities: IActivities[],
  setActivities: Function,
) => {
  const find = activities.find((a) => a.name === name);
  if (!find) {
    setActivities([...activities, { name, activities: "" }]);
  }
};
